const { env } = require('../config/env');

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const details = error.details || null;
  const issues = Array.isArray(details?.issues) ? details.issues : [];

  if (env.nodeEnv !== 'test') {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Unexpected server error',
    details,
    issues
  });
}

module.exports = { errorHandler };
