const { AppError } = require('../utils/app-error');

const EXPORT_CACHE_LIMIT = 8;
const exportCache = new Map();

function buildExportPayload(report) {
  if (!report || typeof report !== 'object') {
    throw new AppError('A processed report payload is required for export.', 400);
  }

  if (!report.summary || !report.meta) {
    throw new AppError('The export payload is missing report summary or metadata.', 400);
  }

  return report;
}

function buildCacheKey(format, payload) {
  return `${format}:${JSON.stringify(payload)}`;
}

function rememberExport(cacheKey, buffer) {
  if (exportCache.has(cacheKey)) {
    exportCache.delete(cacheKey);
  }

  exportCache.set(cacheKey, Buffer.from(buffer));

  if (exportCache.size > EXPORT_CACHE_LIMIT) {
    const oldestKey = exportCache.keys().next().value;
    exportCache.delete(oldestKey);
  }
}

function validateExportBuffer(format, buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError(`The generated ${format.toUpperCase()} export was empty.`, 500);
  }
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function formatQuantity(value) {
  return Number(value || 0)
    .toFixed(4)
    .replace(/\.?0+$/, '');
}

function escapeCsvValue(value) {
  const normalizedValue = value == null ? '' : String(value);

  if (/[",\r\n]/.test(normalizedValue)) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
}

function buildCsvRow(values) {
  return values.map(escapeCsvValue).join(',');
}

function buildCsvBundle(report) {
  const rows = [];
  const summary = report.summary || {};
  const meta = report.meta || {};
  const feeModel = meta.feeModel || {};
  const buyFeePercent = Number(feeModel.buyFeePercent || 0).toFixed(4).replace(/\.?0+$/, '');
  const sellFeePercent = Number(feeModel.sellFeePercent || 0).toFixed(4).replace(/\.?0+$/, '');

  rows.push(buildCsvRow(['Crypto Trade Tax Analyzer - Spot CSV Export']));
  rows.push(buildCsvRow(['Export Format', 'CSV']));
  rows.push(buildCsvRow(['Generated On', new Date().toISOString()]));
  rows.push(buildCsvRow(['Processed On', meta.processedAt || 'N/A']));
  rows.push(buildCsvRow(['Report ID', meta.reportId || 'N/A']));
  rows.push(buildCsvRow(['Source File', meta.sourceFile || 'Workspace session']));
  rows.push(buildCsvRow(['User Name', feeModel.userName || 'N/A']));
  rows.push(buildCsvRow(['Exchange', feeModel.exchangeName || 'N/A']));
  rows.push(buildCsvRow(['Buy Fee Rate', `${buyFeePercent || '0'}%`]));
  rows.push(buildCsvRow(['Sell Fee Rate', `${sellFeePercent || '0'}%`]));
  rows.push('');

  rows.push(buildCsvRow(['SUMMARY']));
  rows.push(buildCsvRow(['Metric', 'Amount (INR)']));
  rows.push(buildCsvRow(['Total Buy Value', formatMoney(summary.totalBuyValue)]));
  rows.push(buildCsvRow(['Total Sell Value', formatMoney(summary.totalSellValue)]));
  rows.push(buildCsvRow(['Gross Profit', formatMoney(summary.grossProfit)]));
  rows.push(buildCsvRow(['Total Fees Paid', formatMoney(summary.totalFeesPaid)]));
  rows.push(buildCsvRow(['Total GST on Fees', formatMoney(summary.totalGstOnFees)]));
  rows.push(buildCsvRow(['Total TDS Deducted', formatMoney(summary.totalTdsDeducted)]));
  rows.push(buildCsvRow(['Total Crypto Tax', formatMoney(summary.totalCryptoTax)]));
  rows.push(buildCsvRow(['Final Net Profit', formatMoney(summary.finalNetProfit)]));
  rows.push('');

  rows.push(buildCsvRow(['REALIZED TRADES']));
  rows.push(
    buildCsvRow([
      'Pair',
      'Buy Date',
      'Sell Date',
      'Qty',
      'Buy Value (INR)',
      'Sell Value (INR)',
      'Gross Profit',
      'Buy Fee',
      'Sell Fee',
      'Total Fees',
      'GST',
      'TDS',
      '30% Tax',
      'Final Net'
    ])
  );

  for (const trade of report.realizedTrades || []) {
    rows.push(
      buildCsvRow([
        trade.contract,
        trade.buyDateTime || trade.buyDate || '',
        trade.sellDateTime || trade.sellDate || '',
        formatQuantity(trade.matchedQty),
        formatMoney(trade.buyValue),
        formatMoney(trade.sellValue),
        formatMoney(trade.grossProfit),
        formatMoney(trade.buySideFee),
        formatMoney(trade.sellSideFee),
        formatMoney(trade.fees),
        formatMoney(trade.gstOnFees),
        formatMoney(trade.tds),
        formatMoney(trade.cryptoTax),
        formatMoney(trade.finalNetProfit)
      ])
    );
  }

  rows.push('');
  rows.push(buildCsvRow(['OPEN HOLDINGS']));
  rows.push(buildCsvRow(['Pair', 'Buy Date', 'Unsold Qty', 'Avg Buy Price (INR)', 'Invested Capital (INR)']));

  for (const position of report.openPositions || []) {
    rows.push(
      buildCsvRow([
        position.contract,
        position.buyDateTime || position.buyDate || '',
        formatQuantity(position.unsoldQty),
        formatMoney(position.avgBuyPrice),
        formatMoney(position.totalInvested)
      ])
    );
  }

  if (!(report.openPositions || []).length) {
    rows.push(buildCsvRow(['Fully matched', '-', '0', formatMoney(0), formatMoney(0)]));
  }

  return `${rows.join('\r\n')}\r\n`;
}

async function generateCsvBuffer(report) {
  const payload = buildExportPayload(report);
  const cacheKey = buildCacheKey('csv', payload);
  const cachedBuffer = exportCache.get(cacheKey);

  if (cachedBuffer) {
    return Buffer.from(cachedBuffer);
  }

  const nextBuffer = Buffer.from(buildCsvBundle(payload), 'utf8');
  validateExportBuffer('csv', nextBuffer);
  rememberExport(cacheKey, nextBuffer);
  return nextBuffer;
}

module.exports = {
  generateCsvBuffer
};
