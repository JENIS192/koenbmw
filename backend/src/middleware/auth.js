const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/helpers');
const { query } = require('../config/db');

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function loadUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const rows = await query('SELECT id, name, email, phone, role FROM users WHERE id = ?', [payload.id]);
    return rows[0] || null;
  } catch (e) {
    return null;
  }
}

async function authRequired(req, res, next) {
  try {
    const user = await loadUser(req);
    if (!user) throw new HttpError(401, 'Please log in to continue');
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

async function authOptional(req, res, next) {
  try {
    req.user = await loadUser(req);
    next();
  } catch (e) {
    next(e);
  }
}

function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return next(new HttpError(403, 'Admin access only'));
  next();
}

module.exports = { sign, authRequired, authOptional, adminRequired };
