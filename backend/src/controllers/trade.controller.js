const { REQUIRED_COLUMNS, SAMPLE_CSV } = require('../constants/sampleCsv');
const { generateCsvBuffer } = require('../services/export.service');
const { AppError } = require('../utils/app-error');
const { processTradeUpload } = require('../services/trade-processing.service');

function getFeeConfig(req) {
  const rawFeeRatePercent = req.body?.feeRatePercent;
  const rawFeeAppliesTo = String(req.body?.feeAppliesTo || 'sell')
    .trim()
    .toLowerCase();
  const feeRatePercent =
    rawFeeRatePercent === undefined || rawFeeRatePercent === null || String(rawFeeRatePercent).trim() === ''
      ? 0.1
      : Number(rawFeeRatePercent);

  if (!Number.isFinite(feeRatePercent) || feeRatePercent < 0) {
    throw new AppError('Spot trading fee percent must be zero or greater.', 400);
  }

  if (!['buy', 'sell', 'both'].includes(rawFeeAppliesTo)) {
    throw new AppError('Spot trading fee side must be buy, sell, or both.', 400);
  }

  return {
    feeRatePercent,
    feeAppliesTo: rawFeeAppliesTo
  };
}

function processUpload(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      throw new AppError('Please upload a CSV file to continue.', 400);
    }

    const report = processTradeUpload(req.file.buffer, getFeeConfig(req));

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
}

function getSampleFormat(req, res) {
  if (req.query.format === 'json') {
    res.json({
      success: true,
      data: {
        requiredColumns: REQUIRED_COLUMNS,
        exampleCsv: SAMPLE_CSV
      }
    });
    return;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sample-trades.csv"');
  res.send(SAMPLE_CSV);
}

function buildExportFilename(extension) {
  return `crypto-trade-tax-analyzer-spot-report.${extension}`;
}

function getExportPayload(req) {
  const rawPayload = req.body?.payload;

  if (typeof rawPayload === 'string') {
    try {
      return JSON.parse(rawPayload);
    } catch (_error) {
      throw new AppError('The export payload could not be parsed.', 400);
    }
  }

  if (!req.body || typeof req.body !== 'object') {
    throw new AppError('A processed report payload is required for export.', 400);
  }

  return req.body;
}

function setBinaryDownloadHeaders(res, contentType, filename, payloadLength) {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', payloadLength);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Type');
}

async function exportCsv(req, res, next) {
  try {
    const payload = getExportPayload(req);

    const csvBuffer = await generateCsvBuffer(payload);
    const filename = buildExportFilename('csv');

    setBinaryDownloadHeaders(res, 'text/csv; charset=utf-8', filename, csvBuffer.length);
    res.status(200).send(csvBuffer);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  exportCsv,
  getSampleFormat,
  processUpload
};
