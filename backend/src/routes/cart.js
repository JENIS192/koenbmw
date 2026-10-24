const express = require('express');
const { query } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { asyncHandler, HttpError, toInt } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

async function cartPayload(userId) {
  const items = await query(
    `SELECT c.id, v.id AS vehicle_id, v.brand, v.model, v.year, v.price, v.status, v.stock, v.color,
       (SELECT image_path FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS image
     FROM cart_items c JOIN vehicles v ON v.id = c.vehicle_id WHERE c.user_id = ? ORDER BY c.id DESC`,
    [userId]
  );
  const total = items.filter((i) => i.status === 'available').reduce((sum, i) => sum + i.price, 0);
  return { items, total, count: items.length };
}

router.get('/', asyncHandler(async (req, res) => res.json(await cartPayload(req.user.id))));

router.post('/:vehicleId', asyncHandler(async (req, res) => {
  const id = toInt(req.params.vehicleId);
  const rows = await query('SELECT id, status FROM vehicles WHERE id = ?', [id]);
  if (!rows.length) throw new HttpError(404, 'Vehicle not found');
  if (rows[0].status !== 'available') throw new HttpError(400, 'This vehicle has already been sold');
  await query('INSERT IGNORE INTO cart_items (user_id, vehicle_id) VALUES (?,?)', [req.user.id, id]);
  res.status(201).json(await cartPayload(req.user.id));
}));

router.delete('/:vehicleId', asyncHandler(async (req, res) => {
  await query('DELETE FROM cart_items WHERE user_id = ? AND vehicle_id = ?', [req.user.id, toInt(req.params.vehicleId)]);
  res.json(await cartPayload(req.user.id));
}));

router.delete('/', asyncHandler(async (req, res) => {
  await query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
  res.json(await cartPayload(req.user.id));
}));

module.exports = router;
