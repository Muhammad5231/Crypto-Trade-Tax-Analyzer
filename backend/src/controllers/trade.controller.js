const { REQUIRED_COLUMNS, SAMPLE_CSV } = require('../constants/sampleCsv');
const { generateCsvBuffer, generateCsvBufferByReportId, generatePdfBufferByReportId } = require('../services/export.service');
const { storeProcessedReport } = require('../services/report-cache.service');
const { AppError } = require('../utils/app-error');
const { processTradeUpload } = require('../services/trade-processing.service');

function getProfileConfig(req) {
  const userName = String(req.body?.userName || '').trim();
  const exchangeName = String(req.body?.exchangeName || '').trim();
  const rawBuyFeePercent = req.body?.buyFeePercent;
  const rawSellFeePercent = req.body?.sellFeePercent;
  const buyFeePercent =
    rawBuyFeePercent === undefined || rawBuyFeePercent === null || String(rawBuyFeePercent).trim() === ''
      ? 0
      : Number(rawBuyFeePercent);
  const sellFeePercent =
    rawSellFeePercent === undefined || rawSellFeePercent === null || String(rawSellFeePercent).trim() === ''
      ? 0
      : Number(rawSellFeePercent);

  if (!userName) {
    throw new AppError('Please enter a user name before processing trades.', 400);
  }

  if (!exchangeName) {
    throw new AppError('Please enter an exchange name before processing trades.', 400);
  }

  if (!Number.isFinite(buyFeePercent) || buyFeePercent < 0) {
    throw new AppError('Buy-side spot fee percent must be zero or greater.', 400);
  }

  if (!Number.isFinite(sellFeePercent) || sellFeePercent < 0) {
    throw new AppError('Sell-side spot fee percent must be zero or greater.', 400);
  }

  return {
    userName,
    exchangeName,
    buyFeePercent,
    sellFeePercent
  };
}

function processUpload(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      throw new AppError('Please upload a CSV file to continue.', 400);
    }

    const processedReport = processTradeUpload(req.file.buffer, getProfileConfig(req));
    processedReport.meta = {
      ...processedReport.meta,
      sourceFile: req.file.originalname || processedReport.meta?.sourceFile || 'Uploaded CSV'
    };

    const report = storeProcessedReport(processedReport);

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

async function exportCsvByReportId(req, res, next) {
  try {
    const csvBuffer = await generateCsvBufferByReportId(req.params.reportId);
    const filename = buildExportFilename('csv');

    setBinaryDownloadHeaders(res, 'text/csv; charset=utf-8', filename, csvBuffer.length);
    res.status(200).send(csvBuffer);
  } catch (error) {
    next(error);
  }
}

async function exportPdfByReportId(req, res, next) {
  try {
    const pdfBuffer = await generatePdfBufferByReportId(req.params.reportId);
    const filename = buildExportFilename('pdf');

    setBinaryDownloadHeaders(res, 'application/pdf', filename, pdfBuffer.length);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  exportCsv,
  exportCsvByReportId,
  exportPdfByReportId,
  getSampleFormat,
  processUpload
};
