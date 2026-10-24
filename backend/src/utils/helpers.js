const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const toInt = (v, fallback = null) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const toNum = (v, fallback = null) => {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const clean = (v, max = 255) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');

const slugify = (v) =>
  String(v || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

module.exports = { asyncHandler, HttpError, toInt, toNum, clean, isEmail, slugify };
