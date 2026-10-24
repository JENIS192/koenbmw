const express = require('express');
const { query } = require('../config/db');
const { authRequired, adminRequired } = require('../middleware/auth');
const { asyncHandler, HttpError, clean, slugify } = require('../utils/helpers');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT d.*, COUNT(v.id) AS vehicle_count,
       (SELECT image_path FROM vehicle_images i JOIN vehicles v2 ON v2.id = i.vehicle_id
         WHERE v2.department_id = d.id ORDER BY i.is_primary DESC, i.id ASC LIMIT 1) AS cover
     FROM departments d
     LEFT JOIN vehicles v ON v.department_id = d.id
     GROUP BY d.id ORDER BY d.sort_order, d.id`
  );
  res.json({ departments: rows });
}));

router.post('/', authRequired, adminRequired, asyncHandler(async (req, res) => {
  const name = clean(req.body.name, 120);
  if (!name) throw new HttpError(400, 'Department name is required');
  const slug = slugify(req.body.slug || name);
  const dup = await query('SELECT id FROM departments WHERE slug = ?', [slug]);
  if (dup.length) throw new HttpError(409, 'A department with this name already exists');
  const r = await query(
    'INSERT INTO departments (name, slug, brand, tagline, description, accent, sort_order) VALUES (?,?,?,?,?,?,?)',
    [name, slug, clean(req.body.brand, 40) || 'BMW', clean(req.body.tagline), clean(req.body.description, 2000), clean(req.body.accent, 20) || '#4aa3df', 99]
  );
  res.status(201).json({ id: r.insertId });
}));

router.put('/:id', authRequired, adminRequired, asyncHandler(async (req, res) => {
  const name = clean(req.body.name, 120);
  if (!name) throw new HttpError(400, 'Department name is required');
  const r = await query(
    'UPDATE departments SET name=?, brand=?, tagline=?, description=?, accent=? WHERE id=?',
    [name, clean(req.body.brand, 40) || 'BMW', clean(req.body.tagline), clean(req.body.description, 2000), clean(req.body.accent, 20) || '#4aa3df', req.params.id]
  );
  if (!r.affectedRows) throw new HttpError(404, 'Department not found');
  res.json({ message: 'Department updated' });
}));

router.delete('/:id', authRequired, adminRequired, asyncHandler(async (req, res) => {
  const used = await query('SELECT COUNT(*) AS n FROM vehicles WHERE department_id = ?', [req.params.id]);
  if (used[0].n > 0) throw new HttpError(400, 'Move or delete the vehicles in this department first');
  await query('DELETE FROM departments WHERE id = ?', [req.params.id]);
  res.json({ message: 'Department deleted' });
}));

module.exports = router;
