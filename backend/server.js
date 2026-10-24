const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const { connectDatabase, query } = require('./src/config/db');
const { createTables } = require('./src/db/schema');
const { seedAll } = require('./src/db/seed');
const { uploadDir } = require('./src/middleware/upload');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const frontendDir = path.resolve(__dirname, '..', 'frontend');

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request log
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// ---------- Health check ----------
app.get('/api/hell/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', uptime: Math.round(process.uptime()), time: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ---------- API routes ----------
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/departments', require('./src/routes/departments'));
app.use('/api/vehicles', require('./src/routes/vehicles'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/wishlist', require('./src/routes/wishlist'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/inquiries', require('./src/routes/inquiries'));
app.use('/api/admin', require('./src/routes/admin'));

app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// ---------- Frontend config from frontend/.env ----------
app.get('/config.js', (req, res) => {
  let env = {};
  try {
    env = dotenv.parse(fs.readFileSync(path.join(frontendDir, '.env')));
  } catch (e) {
    env = {};
  }
  const config = {
    APP_NAME: env.APP_NAME || 'Apex & Bavaria Motors',
    API_BASE_URL: env.API_BASE_URL || '',
    CURRENCY: env.CURRENCY || 'USD',
    LOCALE: env.LOCALE || 'en-US',
  };
  res.type('application/javascript').send(`window.APP_CONFIG = ${JSON.stringify(config)};`);
});

// ---------- Static: uploaded car photos and the frontend ----------
app.use('/uploads', express.static(uploadDir, { maxAge: '7d' }));
app.use(express.static(frontendDir, { extensions: ['html'] }));

app.use((req, res) => {
  const notFound = path.join(frontendDir, '404.html');
  res.status(404);
  if (fs.existsSync(notFound)) return res.sendFile(notFound);
  res.send('Page not found');
});

// ---------- Error handler ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  if (err.name === 'MulterError') {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = `Each photo must be under ${process.env.MAX_UPLOAD_MB || 8} MB`;
    else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') message = 'You can upload up to 8 photos at once';
  } else if (err.message && err.message.startsWith('Only JPG')) {
    status = 400;
  } else if (status === 500) {
    console.error('❌ Server error:', err);
    message = 'Something went wrong on our side. Please try again.';
  }
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid request data'; }
  res.status(status).json({ message });
});

async function start() {
  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing in backend/.env');
    const pool = await connectDatabase();
    await createTables(pool);
    await seedAll();
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 Apex & Bavaria Motors is running');
      console.log(`   Website : http://localhost:${PORT}`);
      console.log(`   Admin   : http://localhost:${PORT}/admin.html`);
      console.log(`   Health  : http://localhost:${PORT}/api/hell/health`);
      console.log('');
    });
  } catch (err) {
    console.error('');
    console.error('❌ Could not start the server:', err.message);
    console.error('   Check that MySQL is running and the DB_* values in backend/.env are correct.');
    process.exit(1);
  }
}

start();
