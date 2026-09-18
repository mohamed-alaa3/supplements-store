const fs = require('fs');
const path = require('path');
const multer = require('multer');
const env = require('../config/env');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const uploadRoot = path.resolve(__dirname, '..', env.uploadDir);
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, unique);
  }
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG or WEBP images are allowed'));
  }
  cb(null, true);
}

/** Single-image upload middleware, field name "image". Serves back a relative /uploads/<file> URL. */
const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadSizeMb * 1024 * 1024 }
});

module.exports = { uploadImage, uploadRoot };
