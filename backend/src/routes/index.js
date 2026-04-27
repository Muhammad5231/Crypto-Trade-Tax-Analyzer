const express = require('express');

const healthRoutes = require('./health.routes');
const tradeRoutes = require('./trade.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/', tradeRoutes);

module.exports = router;
