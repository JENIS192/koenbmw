const express = require('express');
const crypto = require('crypto');
const { getPool, query } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { asyncHandler, HttpError, toInt, clean } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

const PAYMENTS = ['card', 'bank_transfer', 'finance', 'pay_on_delivery'];

function orderNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `AB-${stamp}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function withItems(orders) {
  for (const o of orders) {
    o.items = await query(
      `SELECT oi.vehicle_id, oi.vehicle_name, oi.price,
        (SELECT image_path FROM vehicle_images WHERE vehicle_id = oi.vehicle_id ORDER BY is_primary DESC, id ASC LIMIT 1) AS image
       FROM order_items oi WHERE oi.order_id = ?`,
      [o.id]
    );
  }
  return orders;
}

router.post('/', asyncHandler(async (req, res) => {
  const b = req.body;
  const data = {
    shipping_name: clean(b.shipping_name, 120),
    shipping_phone: clean(b.shipping_phone, 40),
    shipping_address: clean(b.shipping_address, 255),
    shipping_city: clean(b.shipping_city, 100),
    shipping_country: clean(b.shipping_country, 100),
    payment_method: clean(b.payment_method, 40),
    notes: clean(b.notes, 500) || null,
  };
  for (const key of ['shipping_name', 'shipping_phone', 'shipping_address', 'shipping_city', 'shipping_country']) {
    if (!data[key]) throw new HttpError(400, 'Please complete all delivery details');
  }
  if (!PAYMENTS.includes(data.payment_method)) throw new HttpError(400, 'Choose a payment method');

  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [cart] = await conn.query(
      `SELECT v.id, v.brand, v.model, v.year, v.price, v.stock, v.status
       FROM cart_items c JOIN vehicles v ON v.id = c.vehicle_id WHERE c.user_id = ? FOR UPDATE`,
      [req.user.id]
    );
    if (!cart.length) throw new HttpError(400, 'Your cart is empty');
    const unavailable = cart.filter((v) => v.status !== 'available' || v.stock < 1);
    if (unavailable.length) {
      throw new HttpError(409, `${unavailable[0].brand} ${unavailable[0].model} is no longer available. Remove it from your cart to continue.`);
    }

    const total = cart.reduce((s, v) => s + v.price, 0);
    const number = orderNumber();
    const [orderRes] = await conn.query(
      `INSERT INTO orders (order_number, user_id, total, payment_method, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_country, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [number, req.user.id, total, data.payment_method, data.shipping_name, data.shipping_phone, data.shipping_address, data.shipping_city, data.shipping_country, data.notes]
    );
    for (const v of cart) {
      await conn.query('INSERT INTO order_items (order_id, vehicle_id, vehicle_name, price) VALUES (?,?,?,?)', [
        orderRes.insertId, v.id, `${v.year} ${v.brand} ${v.model}`, v.price,
      ]);
      await conn.query("UPDATE vehicles SET status = IF(stock - 1 <= 0, 'sold', status), stock = stock - 1 WHERE id = ?", [v.id]);
      await conn.query('DELETE FROM cart_items WHERE vehicle_id = ?', [v.id]);
    }
    await conn.commit();
    res.status(201).json({ id: orderRes.insertId, order_number: number, total });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

router.get('/', asyncHandler(async (req, res) => {
  const orders = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
  res.json({ orders: await withItems(orders) });
}));

router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const rows = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!rows.length) throw new HttpError(404, 'Order not found');
  if (rows[0].status !== 'pending') throw new HttpError(400, 'Only pending orders can be cancelled');
  await cancelOrder(id);
  res.json({ message: 'Order cancelled' });
}));

async function cancelOrder(orderId) {
  const items = await query('SELECT vehicle_id FROM order_items WHERE order_id = ?', [orderId]);
  await query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);
  for (const i of items) {
    await query("UPDATE vehicles SET stock = stock + 1, status = 'available' WHERE id = ?", [i.vehicle_id]);
  }
}

module.exports = router;
module.exports.cancelOrder = cancelOrder;
module.exports.withItems = withItems;
