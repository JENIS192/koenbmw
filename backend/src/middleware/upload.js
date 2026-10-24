const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const uploadDir = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const allowed = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = allowed[file.mimetype] || '.jpg';
    cb(null, `car-${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || 8) * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => {
    if (!allowed[file.mimetype]) return cb(new Error('Only JPG, PNG, WEBP or GIF photos are allowed'));
    cb(null, true);
  },
});

function removeFile(publicPath) {
  try {
    if (!publicPath || !publicPath.startsWith('/uploads/')) return;
    const file = path.join(uploadDir, path.basename(publicPath));
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch (e) {
    /* ignore */
  }
}

module.exports = { upload, uploadDir, removeFile };
