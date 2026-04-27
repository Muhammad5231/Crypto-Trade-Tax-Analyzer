const express = require('express');

const { exportCsv, getSampleFormat, processUpload } = require('../controllers/trade.controller');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.post('/upload/process', upload.single('file'), processUpload);
router.post('/export/csv', exportCsv);
router.get('/sample-format', getSampleFormat);

module.exports = router;
