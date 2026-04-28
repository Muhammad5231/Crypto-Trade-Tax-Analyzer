const { REQUIRED_COLUMNS } = require('../constants/sampleCsv');
const { AppError } = require('../utils/app-error');
const { parseCsvBuffer } = require('../utils/csv');
const { normalizeTradeRow, processNormalizedTrades, shouldSkipTradeRow, validateHeaders } = require('./engine.service');

function processTradeUpload(fileBuffer, options = {}) {
  const { encodingUsed, headers, parseErrors, rows } = parseCsvBuffer(fileBuffer);
  const missingFields = validateHeaders(headers);

  if (missingFields.length > 0) {
    throw new AppError('CSV is missing required columns.', 400, {
      requiredColumns: REQUIRED_COLUMNS,
      missingFields
    });
  }

  const warnings = parseErrors.map((error) => `CSV parse warning on row ${error.row || 'unknown'}: ${error.message}`);
  const normalizedTrades = [];

  rows.forEach((row, index) => {
    if (shouldSkipTradeRow(row)) {
      return;
    }

    try {
      const trade = normalizeTradeRow(row, index);
      normalizedTrades.push(trade);
    } catch (error) {
      warnings.push(`Row ${index + 2}: ${error.message}`);
    }
  });

  if (normalizedTrades.length === 0) {
    throw new AppError('No valid trades found in the uploaded file.', 400, {
      requiredColumns: REQUIRED_COLUMNS,
      skippedRows: rows.length
    });
  }

  const report = processNormalizedTrades(normalizedTrades, warnings, options);

  report.meta = {
    ...report.meta,
    headers,
    encodingUsed,
    totalUploadedRows: rows.length,
    validTrades: normalizedTrades.length,
    skippedRows: Math.max(0, rows.length - normalizedTrades.length),
    warningCount: report.warnings.length
  };

  return report;
}

module.exports = { processTradeUpload };
