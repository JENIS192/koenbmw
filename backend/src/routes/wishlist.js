const express = require('express');
const { query } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { asyncHandler, HttpError, toInt } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

router.get('/', asyncHandler(async (req, res) => {
  const items = await query(
    `SELECT v.id, v.brand, v.model, v.year, v.price, v.status, v.horsepower, v.fuel, v.mileage, v.featured, d.name AS department_name,
       (SELECT image_path FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS image
     FROM wishlist w JOIN vehicles v ON v.id = w.vehicle_id JOIN departments d ON d.id = v.department_id
     WHERE w.user_id = ? ORDER BY w.id DESC`,
    [req.user.id]
  );
  res.json({ items, ids: items.map((i) => i.id) });
}));

router.get('/ids', asyncHandler(async (req, res) => {
  const rows = await query('SELECT vehicle_id FROM wishlist WHERE user_id = ?', [req.user.id]);
  res.json({ ids: rows.map((r) => r.vehicle_id) });
}));

router.post('/:vehicleId', asyncHandler(async (req, res) => {
  const id = toInt(req.params.vehicleId);
  const v = await query('SELECT id FROM vehicles WHERE id = ?', [id]);
  if (!v.length) throw new HttpError(404, 'Vehicle not found');
  const existing = await query('SELECT id FROM wishlist WHERE user_id = ? AND vehicle_id = ?', [req.user.id, id]);
  if (existing.length) {
    await query('DELETE FROM wishlist WHERE id = ?', [existing[0].id]);
    return res.json({ wished: false });
  }
  await query('INSERT INTO wishlist (user_id, vehicle_id) VALUES (?,?)', [req.user.id, id]);
  res.json({ wished: true });
}));

module.exports = router;
