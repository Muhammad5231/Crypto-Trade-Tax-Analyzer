function getHealth(_req, res) {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'crypto-tax-backend',
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = { getHealth };
