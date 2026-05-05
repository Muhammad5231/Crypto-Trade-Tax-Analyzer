const { REQUIRED_COLUMNS } = require('../constants/sampleCsv');
const { AppError } = require('../utils/app-error');
const { parseCsvBuffer } = require('../utils/csv');
const { normalizeTradeRow, processNormalizedTrades, shouldSkipTradeRow, validateHeaders } = require('./engine.service');

function buildIssue({ code, severity = 'error', message, row = null, column = null, value = null }) {
  return {
    code,
    severity,
    message,
    row,
    column,
    value
  };
}

function buildRowIssue(error, rowNumber) {
  if (error?.code === 'TIMEZONE_PARSE_ERROR') {
    return buildIssue({
      code: 'timezone_unresolved',
      message: error.message,
      row: rowNumber,
      column: 'Time',
      value: error.rawValue || null
    });
  }

  return buildIssue({
    code: 'row_invalid',
    severity: 'warning',
    message: error.message,
    row: rowNumber
  });
}

function processTradeUpload(fileBuffer, options = {}) {
  const { encodingUsed, delimiterUsed, headers, parseErrors, rows, issues: parseIssues, duplicateHeaderRowsDropped } = parseCsvBuffer(
    fileBuffer
  );
  const missingFields = validateHeaders(headers);
  const criticalIssues = [];
  const rowIssues = [];

  if (missingFields.length > 0) {
    throw new AppError('CSV is missing required columns.', 400, {
      requiredColumns: REQUIRED_COLUMNS,
      missingFields,
      issues: [
        ...parseIssues,
        buildIssue({
          code: 'missing_required_columns',
          message: `The CSV is missing required columns: ${missingFields.join(', ')}.`
        })
      ]
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
      const issue = buildRowIssue(error, index + 2);

      if (issue.code === 'timezone_unresolved') {
        criticalIssues.push(issue);
        return;
      }

      rowIssues.push(issue);
      warnings.push(`Row ${index + 2}: ${error.message}`);
    }
  });

  if (criticalIssues.length > 0) {
    throw new AppError('The uploaded file contains timezone conflicts that must be fixed before FIFO processing can continue.', 400, {
      requiredColumns: REQUIRED_COLUMNS,
      encodingUsed,
      delimiterUsed,
      issues: [...parseIssues, ...criticalIssues]
    });
  }

  if (normalizedTrades.length === 0) {
    throw new AppError('No valid trades found in the uploaded file.', 400, {
      requiredColumns: REQUIRED_COLUMNS,
      skippedRows: rows.length,
      encodingUsed,
      delimiterUsed,
      issues: [
        ...parseIssues,
        ...rowIssues,
        buildIssue({
          code: 'csv_unreadable',
          message: 'No usable trade rows remained after parsing, sanitization, and validation.'
        })
      ]
    });
  }

  const report = processNormalizedTrades(normalizedTrades, warnings, options);

  report.meta = {
    ...report.meta,
    headers,
    encodingUsed,
    delimiterUsed,
    totalUploadedRows: rows.length,
    validTrades: normalizedTrades.length,
    skippedRows: Math.max(0, rows.length - normalizedTrades.length),
    warningCount: report.warnings.length,
    duplicateHeaderRowsDropped
  };

  return report;
}

module.exports = { processTradeUpload };
