const express = require('express');
const { query } = require('../config/db');
const { authRequired, authOptional } = require('../middleware/auth');
const { asyncHandler, HttpError, toInt, clean, isEmail } = require('../utils/helpers');

const router = express.Router();

router.post('/', authOptional, asyncHandler(async (req, res) => {
  const b = req.body;
  const name = clean(b.name, 120);
  const email = clean(b.email, 180).toLowerCase();
  const message = clean(b.message, 2000);
  const type = ['test_drive', 'enquiry', 'sell_car'].includes(b.type) ? b.type : 'enquiry';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(b.preferred_date || '') ? b.preferred_date : null;

  if (name.length < 2) throw new HttpError(400, 'Please enter your name');
  if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address');
  if (message.length < 5) throw new HttpError(400, 'Please add a short message');

  let vehicleId = toInt(b.vehicle_id);
  if (vehicleId) {
    const v = await query('SELECT id FROM vehicles WHERE id = ?', [vehicleId]);
    if (!v.length) vehicleId = null;
  }
  await query(
    'INSERT INTO inquiries (user_id, vehicle_id, name, email, phone, type, preferred_date, message) VALUES (?,?,?,?,?,?,?,?)',
    [req.user ? req.user.id : null, vehicleId, name, email, clean(b.phone, 40) || null, type, date, message]
  );
  res.status(201).json({ message: 'Thanks. Our team will contact you within one business day.' });
}));

router.get('/mine', authRequired, asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT i.*, CONCAT(v.year, ' ', v.brand, ' ', v.model) AS vehicle_name FROM inquiries i
     LEFT JOIN vehicles v ON v.id = i.vehicle_id WHERE i.user_id = ? ORDER BY i.id DESC`,
    [req.user.id]
  );
  res.json({ inquiries: rows });
}));

module.exports = router;
