const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

// ── Storage destination ───────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'notices');

// Ensure the directory exists at startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Allowed file types ────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.webp']);

// Max 5 MB
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// ── Multer storage (disk) ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const unique   = crypto.randomBytes(16).toString('hex');
    const safeName = `${Date.now()}-${unique}${ext}`;
    cb(null, safeName);
  },
});

// ── File filter ───────────────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      Object.assign(new Error('Invalid file type. Allowed: PDF, Word, Excel, JPEG, PNG, WebP.'), { code: 'INVALID_TYPE' }),
      false
    );
  }
  cb(null, true);
};

// ── Multer instance ───────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

// ── Single-file middleware with clean error mapping ───────────────────────────
/**
 * Express middleware that wraps multer.single('attachment').
 * Converts multer errors into standardised { success, message } responses
 * so the frontend never sees raw multer error objects.
 */
const uploadAttachment = (req, res, next) => {
  upload.single('attachment')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum allowed size is ${MAX_SIZE_BYTES / 1024 / 1024} MB.`,
      });
    }
    if (err.code === 'INVALID_TYPE') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(400).json({ success: false, message: 'File upload failed. Please try again.' });
  });
};

module.exports = { uploadAttachment, UPLOAD_DIR };
