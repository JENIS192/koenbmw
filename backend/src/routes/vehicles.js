const express = require('express');
const { query } = require('../config/db');
const { authRequired, adminRequired } = require('../middleware/auth');
const { upload, removeFile } = require('../middleware/upload');
const { asyncHandler, HttpError, toInt, toNum, clean } = require('../utils/helpers');

const router = express.Router();

const SELECT = `SELECT v.*, d.name AS department_name, d.slug AS department_slug,
  (SELECT image_path FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS image,
  (SELECT ROUND(AVG(rating),1) FROM reviews WHERE vehicle_id = v.id) AS rating,
  (SELECT COUNT(*) FROM reviews WHERE vehicle_id = v.id) AS review_count
  FROM vehicles v JOIN departments d ON d.id = v.department_id`;

const SORTS = {
  newest: 'v.created_at DESC, v.id DESC',
  price_asc: 'v.price ASC',
  price_desc: 'v.price DESC',
  power: 'v.horsepower DESC',
  year: 'v.year DESC',
};

function readFields(body) {
  const f = {
    department_id: toInt(body.department_id),
    brand: clean(body.brand, 60),
    model: clean(body.model, 120),
    year: toInt(body.year),
    price: toNum(body.price),
    mileage: toInt(body.mileage, 0),
    fuel: clean(body.fuel, 30) || 'Petrol',
    transmission: clean(body.transmission, 40) || 'Automatic',
    horsepower: toInt(body.horsepower),
    top_speed: toInt(body.top_speed),
    acceleration: toNum(body.acceleration),
    color: clean(body.color, 60) || null,
    description: clean(body.description, 4000) || null,
    stock: toInt(body.stock, 1),
    featured: body.featured === true || body.featured === 'true' || body.featured === '1' || body.featured === 1 ? 1 : 0,
  };
  if (!f.department_id) throw new HttpError(400, 'Please choose a department');
  if (!f.brand || !f.model) throw new HttpError(400, 'Brand and model are required');
  if (!f.year || f.year < 1900 || f.year > 2100) throw new HttpError(400, 'Enter a valid year');
  if (f.price === null || f.price < 0) throw new HttpError(400, 'Enter a valid price');
  if (f.stock < 0) f.stock = 0;
  return f;
}

router.get('/', asyncHandler(async (req, res) => {
  const where = ['1=1'];
  const params = [];
  const q = req.query;

  if (q.department) { where.push('d.slug = ?'); params.push(String(q.department)); }
  if (q.brand) { where.push('v.brand = ?'); params.push(String(q.brand)); }
  if (q.fuel) { where.push('v.fuel LIKE ?'); params.push(`${String(q.fuel)}%`); }
  if (q.status === 'available' || q.status === 'sold') { where.push('v.status = ?'); params.push(q.status); }
  if (q.featured === '1') where.push('v.featured = 1');
  if (toNum(q.minPrice) !== null) { where.push('v.price >= ?'); params.push(toNum(q.minPrice)); }
  if (toNum(q.maxPrice) !== null) { where.push('v.price <= ?'); params.push(toNum(q.maxPrice)); }
  if (q.q) {
    where.push('(v.brand LIKE ? OR v.model LIKE ? OR v.color LIKE ? OR v.description LIKE ?)');
    const like = `%${String(q.q).slice(0, 80)}%`;
    params.push(like, like, like, like);
  }

  const limit = Math.min(Math.max(toInt(q.limit, 12), 1), 48);
  const page = Math.max(toInt(q.page, 1), 1);
  const order = SORTS[q.sort] || SORTS.newest;
  const whereSql = where.join(' AND ');

  const count = await query(`SELECT COUNT(*) AS n FROM vehicles v JOIN departments d ON d.id = v.department_id WHERE ${whereSql}`, params);
  const rows = await query(`${SELECT} WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
  res.json({ vehicles: rows, total: count[0].n, page, pages: Math.max(Math.ceil(count[0].n / limit), 1) });
}));

router.get('/meta/filters', asyncHandler(async (req, res) => {
  const brands = await query('SELECT DISTINCT brand FROM vehicles ORDER BY brand');
  const fuels = await query("SELECT DISTINCT SUBSTRING_INDEX(fuel, ' (', 1) AS fuel FROM vehicles ORDER BY fuel");
  res.json({ brands: brands.map((b) => b.brand), fuels: fuels.map((f) => f.fuel) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const rows = await query(`${SELECT} WHERE v.id = ?`, [id]);
  if (!rows.length) throw new HttpError(404, 'Vehicle not found');
  const images = await query('SELECT id, image_path, is_primary FROM vehicle_images WHERE vehicle_id = ? ORDER BY is_primary DESC, id ASC', [id]);
  const reviews = await query(
    'SELECT r.id, r.rating, r.comment, r.created_at, u.name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.vehicle_id = ? ORDER BY r.created_at DESC LIMIT 20',
    [id]
  );
  const related = await query(`${SELECT} WHERE v.department_id = ? AND v.id <> ? ORDER BY v.featured DESC, v.id DESC LIMIT 3`, [rows[0].department_id, id]);
  res.json({ vehicle: rows[0], images, reviews, related });
}));

router.post('/', authRequired, adminRequired, upload.array('images', 8), asyncHandler(async (req, res) => {
  let f;
  try {
    f = readFields(req.body);
  } catch (e) {
    (req.files || []).forEach((file) => removeFile(`/uploads/${file.filename}`));
    throw e;
  }
  const r = await query(
    `INSERT INTO vehicles (department_id, brand, model, year, price, mileage, fuel, transmission, horsepower, top_speed, acceleration, color, description, stock, featured, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [f.department_id, f.brand, f.model, f.year, f.price, f.mileage, f.fuel, f.transmission, f.horsepower, f.top_speed, f.acceleration, f.color, f.description, f.stock, f.featured, f.stock > 0 ? 'available' : 'sold']
  );
  const files = req.files || [];
  for (let i = 0; i < files.length; i++) {
    await query('INSERT INTO vehicle_images (vehicle_id, image_path, is_primary) VALUES (?,?,?)', [r.insertId, `/uploads/${files[i].filename}`, i === 0 ? 1 : 0]);
  }
  res.status(201).json({ id: r.insertId, message: 'Vehicle published' });
}));

router.put('/:id', authRequired, adminRequired, upload.array('images', 8), asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  let f;
  try {
    f = readFields(req.body);
  } catch (e) {
    (req.files || []).forEach((file) => removeFile(`/uploads/${file.filename}`));
    throw e;
  }
  const r = await query(
    `UPDATE vehicles SET department_id=?, brand=?, model=?, year=?, price=?, mileage=?, fuel=?, transmission=?, horsepower=?, top_speed=?, acceleration=?, color=?, description=?, stock=?, featured=?, status=? WHERE id=?`,
    [f.department_id, f.brand, f.model, f.year, f.price, f.mileage, f.fuel, f.transmission, f.horsepower, f.top_speed, f.acceleration, f.color, f.description, f.stock, f.featured, f.stock > 0 ? 'available' : 'sold', id]
  );
  if (!r.affectedRows) {
    (req.files || []).forEach((file) => removeFile(`/uploads/${file.filename}`));
    throw new HttpError(404, 'Vehicle not found');
  }
  const existing = await query('SELECT COUNT(*) AS n FROM vehicle_images WHERE vehicle_id = ?', [id]);
  const files = req.files || [];
  for (let i = 0; i < files.length; i++) {
    await query('INSERT INTO vehicle_images (vehicle_id, image_path, is_primary) VALUES (?,?,?)', [id, `/uploads/${files[i].filename}`, existing[0].n === 0 && i === 0 ? 1 : 0]);
  }
  res.json({ message: 'Vehicle updated' });
}));

router.delete('/images/:imageId', authRequired, adminRequired, asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM vehicle_images WHERE id = ?', [req.params.imageId]);
  if (!rows.length) throw new HttpError(404, 'Photo not found');
  await query('DELETE FROM vehicle_images WHERE id = ?', [rows[0].id]);
  removeFile(rows[0].image_path);
  if (rows[0].is_primary) {
    await query('UPDATE vehicle_images SET is_primary = 1 WHERE vehicle_id = ? ORDER BY id ASC LIMIT 1', [rows[0].vehicle_id]);
  }
  res.json({ message: 'Photo removed' });
}));

router.patch('/images/:imageId/primary', authRequired, adminRequired, asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM vehicle_images WHERE id = ?', [req.params.imageId]);
  if (!rows.length) throw new HttpError(404, 'Photo not found');
  await query('UPDATE vehicle_images SET is_primary = 0 WHERE vehicle_id = ?', [rows[0].vehicle_id]);
  await query('UPDATE vehicle_images SET is_primary = 1 WHERE id = ?', [rows[0].id]);
  res.json({ message: 'Cover photo updated' });
}));

router.delete('/:id', authRequired, adminRequired, asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const ordered = await query('SELECT COUNT(*) AS n FROM order_items WHERE vehicle_id = ?', [id]);
  if (ordered[0].n > 0) throw new HttpError(400, 'This vehicle has orders. Mark it as sold out instead of deleting it.');
  const images = await query('SELECT image_path FROM vehicle_images WHERE vehicle_id = ?', [id]);
  const r = await query('DELETE FROM vehicles WHERE id = ?', [id]);
  if (!r.affectedRows) throw new HttpError(404, 'Vehicle not found');
  images.forEach((i) => removeFile(i.image_path));
  res.json({ message: 'Vehicle deleted' });
}));

router.post('/:id/reviews', authRequired, asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const rating = toInt(req.body.rating);
  if (!rating || rating < 1 || rating > 5) throw new HttpError(400, 'Choose a rating from 1 to 5');
  const exists = await query('SELECT id FROM vehicles WHERE id = ?', [id]);
  if (!exists.length) throw new HttpError(404, 'Vehicle not found');
  await query(
    'INSERT INTO reviews (vehicle_id, user_id, rating, comment) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)',
    [id, req.user.id, rating, clean(req.body.comment, 800) || null]
  );
  res.status(201).json({ message: 'Thanks for your review' });
}));

module.exports = router;
