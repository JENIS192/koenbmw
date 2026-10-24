const express = require('express');
const { query } = require('../config/db');
const { authRequired, adminRequired } = require('../middleware/auth');
const { asyncHandler, HttpError, toInt } = require('../utils/helpers');
const { cancelOrder, withItems } = require('./orders');

const router = express.Router();
router.use(authRequired, adminRequired);

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

router.get('/stats', asyncHandler(async (req, res) => {
  const one = async (sql) => (await query(sql))[0];
  const vehicles = await one("SELECT COUNT(*) AS total, SUM(status='available') AS available, SUM(status='sold') AS sold FROM vehicles");
  const orders = await one("SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total END),0) AS revenue, SUM(status='pending') AS pending FROM orders");
  const users = await one("SELECT COUNT(*) AS total FROM users WHERE role = 'customer'");
  const inquiries = await one("SELECT COUNT(*) AS total, SUM(status='new') AS fresh FROM inquiries");
  const byDepartment = await query(
    `SELECT d.name, d.accent, COUNT(v.id) AS vehicles, COALESCE(SUM(v.status='sold'),0) AS sold
     FROM departments d LEFT JOIN vehicles v ON v.department_id = d.id GROUP BY d.id ORDER BY d.sort_order`
  );
  const recent = await query(
    `SELECT o.id, o.order_number, o.total, o.status, o.created_at, u.name AS customer
     FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC LIMIT 6`
  );
  res.json({
    vehicles: { total: vehicles.total, available: Number(vehicles.available || 0), sold: Number(vehicles.sold || 0) },
    orders: { total: orders.total, revenue: orders.revenue, pending: Number(orders.pending || 0) },
    customers: users.total,
    inquiries: { total: inquiries.total, fresh: Number(inquiries.fresh || 0) },
    byDepartment,
    recent,
  });
}));

router.get('/orders', asyncHandler(async (req, res) => {
  const orders = await query(
    'SELECT o.*, u.name AS customer, u.email AS customer_email FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC LIMIT 200'
  );
  res.json({ orders: await withItems(orders) });
}));

router.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const status = String(req.body.status || '');
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Invalid order status');
  const rows = await query('SELECT status FROM orders WHERE id = ?', [id]);
  if (!rows.length) throw new HttpError(404, 'Order not found');
  if (rows[0].status === 'cancelled') throw new HttpError(400, 'Cancelled orders cannot be changed');
  if (status === 'cancelled') await cancelOrder(id);
  else await query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  res.json({ message: 'Order status updated' });
}));

router.get('/inquiries', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT i.*, CONCAT(v.year, ' ', v.brand, ' ', v.model) AS vehicle_name FROM inquiries i
     LEFT JOIN vehicles v ON v.id = i.vehicle_id ORDER BY i.id DESC LIMIT 200`
  );
  res.json({ inquiries: rows });
}));

router.patch('/inquiries/:id', asyncHandler(async (req, res) => {
  const status = String(req.body.status || '');
  if (!['new', 'contacted', 'closed'].includes(status)) throw new HttpError(400, 'Invalid status');
  await query('UPDATE inquiries SET status = ? WHERE id = ?', [status, toInt(req.params.id)]);
  res.json({ message: 'Enquiry updated' });
}));

router.get('/users', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
      (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders
     FROM users u ORDER BY u.id DESC LIMIT 300`
  );
  res.json({ users: rows });
}));

module.exports = router;
