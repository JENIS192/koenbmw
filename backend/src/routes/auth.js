const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { sign, authRequired } = require('../middleware/auth');
const { asyncHandler, HttpError, clean, isEmail } = require('../utils/helpers');

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
  const name = clean(req.body.name, 120);
  const email = clean(req.body.email, 180).toLowerCase();
  const password = String(req.body.password || '');
  const phone = clean(req.body.phone, 40) || null;

  if (name.length < 2) throw new HttpError(400, 'Please enter your full name');
  if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');

  const exists = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists.length) throw new HttpError(409, 'An account with this email already exists');

  const hash = await bcrypt.hash(password, 10);
  const result = await query('INSERT INTO users (name, email, password_hash, phone) VALUES (?,?,?,?)', [name, email, hash, phone]);
  const user = { id: result.insertId, name, email, phone, role: 'customer' };
  res.status(201).json({ token: sign(user), user });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const email = clean(req.body.email, 180).toLowerCase();
  const password = String(req.body.password || '');
  const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
  const row = rows[0];
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    throw new HttpError(401, 'Incorrect email or password');
  }
  const user = { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role };
  res.json({ token: sign(user), user });
}));

router.get('/me', authRequired, (req, res) => res.json({ user: req.user }));

router.put('/me', authRequired, asyncHandler(async (req, res) => {
  const name = clean(req.body.name, 120);
  const phone = clean(req.body.phone, 40) || null;
  if (name.length < 2) throw new HttpError(400, 'Please enter your full name');
  await query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, req.user.id]);
  res.json({ user: { ...req.user, name, phone } });
}));

router.put('/password', authRequired, asyncHandler(async (req, res) => {
  const current = String(req.body.current_password || '');
  const next = String(req.body.new_password || '');
  if (next.length < 6) throw new HttpError(400, 'New password must be at least 6 characters');
  const rows = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!(await bcrypt.compare(current, rows[0].password_hash))) throw new HttpError(400, 'Current password is incorrect');
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(next, 10), req.user.id]);
  res.json({ message: 'Password updated' });
}));

module.exports = router;
