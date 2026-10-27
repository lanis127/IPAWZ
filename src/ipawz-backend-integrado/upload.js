const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const pastaUploads = path.join(__dirname, 'uploads');
fs.mkdirSync(pastaUploads, { recursive: true });

const extensoesPermitidas = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const mimetypesPermitidos = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, pastaUploads),
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    callback(null, `${crypto.randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!extensoesPermitidas.has(ext) || !mimetypesPermitidos.has(file.mimetype)) {
      return callback(new Error('A foto deve estar nos formatos JPG, JPEG, PNG ou WEBP.'));
    }
    callback(null, true);
  }
});

module.exports = { upload, pastaUploads };
