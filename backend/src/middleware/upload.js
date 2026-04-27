const multer = require('multer');

const { env } = require('../config/env');
const { AppError } = require('../utils/app-error');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    const isCsv = file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv');

    if (!isCsv) {
      callback(new AppError('Only CSV uploads are supported.', 400));
      return;
    }

    callback(null, true);
  }
});

module.exports = { upload };
