const PDFDocument = require('pdfkit');

const { AppError } = require('../utils/app-error');
const { getCachedExportBuffer, getCachedReport, storeCachedExportBuffer } = require('./report-cache.service');

function buildExportPayload(report) {
  if (!report || typeof report !== 'object') {
    throw new AppError('A processed report payload is required for export.', 400);
  }

  if (!report.summary || !report.meta) {
    throw new AppError('The export payload is missing report summary or metadata.', 400);
  }

  return report;
}

function validateExportBuffer(format, buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError(`The generated ${format.toUpperCase()} export was empty.`, 500);
  }
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function formatCurrencyLabel(value) {
  return `Rs ${formatMoney(value)}`;
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
  rows.push(buildCsvRow(['Total Base Crypto Tax', formatMoney(summary.totalCryptoTax)]));
  rows.push(buildCsvRow(['Total 4% Cess', formatMoney(summary.totalCessAmount)]));
  rows.push(buildCsvRow(['Total Direct Tax', formatMoney(summary.totalTaxAmount)]));
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
      '4% Cess',
      'Total Tax',
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
        formatMoney(trade.cessAmount),
        formatMoney(trade.totalTaxAmount),
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
  const nextBuffer = Buffer.from(buildCsvBundle(payload), 'utf8');
  validateExportBuffer('csv', nextBuffer);
  return nextBuffer;
}

async function generateCsvBufferByReportId(reportId) {
  const cachedBuffer = getCachedExportBuffer(reportId, 'csv');

  if (cachedBuffer) {
    return cachedBuffer;
  }

  const report = getCachedReport(reportId);
  const nextBuffer = await generateCsvBuffer(report);
  storeCachedExportBuffer(reportId, 'csv', nextBuffer);
  return nextBuffer;
}

function drawReportHeader(doc, report) {
  const meta = report.meta || {};
  const feeModel = meta.feeModel || {};

  doc.save();
  doc.roundedRect(42, 36, doc.page.width - 84, 84, 18).fill('#162334');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('CRYPTO TRADE TAX AUDIT REPORT', 62, 56);
  doc.fillColor('#a9b7ca').font('Helvetica').fontSize(10);
  doc.text(`Report ID: ${meta.reportId || 'N/A'}`, 62, 88);
  doc.text(`Processed: ${meta.processedAt || 'N/A'}`, 250, 88);
  doc.text(`Source File: ${meta.sourceFile || 'Workspace session'}`, 450, 88);
  doc.text(`Trader: ${feeModel.userName || 'N/A'}  •  Exchange: ${feeModel.exchangeName || 'N/A'}`, 62, 103);
  doc.restore();
}

function drawSummaryCard(doc, x, y, width, height, label, value, helper) {
  doc.save();
  doc.roundedRect(x, y, width, height, 14).fillAndStroke('#f8fbff', '#d8e4f2');
  doc.fillColor('#637487').font('Helvetica-Bold').fontSize(9).text(label.toUpperCase(), x + 16, y + 14);
  doc.fillColor('#102034').font('Helvetica-Bold').fontSize(20).text(value, x + 16, y + 30, {
    width: width - 32
  });
  if (helper) {
    doc.fillColor('#5d6d7d').font('Helvetica').fontSize(9).text(helper, x + 16, y + height - 20, {
      width: width - 32
    });
  }
  doc.restore();
}

function drawSummarySection(doc, report) {
  const summary = report.summary || {};
  const startX = 42;
  const startY = 144;
  const cardGap = 14;
  const cardWidth = (doc.page.width - 84 - cardGap) / 2;
  const cardHeight = 82;

  drawSummaryCard(doc, startX, startY, cardWidth, cardHeight, 'Total Capital Gains', formatCurrencyLabel(summary.grossProfit), 'Realized gross profit before deductions');
  drawSummaryCard(
    doc,
    startX + cardWidth + cardGap,
    startY,
    cardWidth,
    cardHeight,
    'Total Fees',
    formatCurrencyLabel(summary.totalFeesPaid),
    'Exchange fees prioritized from raw CSV values'
  );
  drawSummaryCard(
    doc,
    startX,
    startY + cardHeight + cardGap,
    cardWidth,
    cardHeight,
    'Total TDS',
    formatCurrencyLabel(summary.totalTdsDeducted),
    'Section 194S deduction applied on sell value'
  );
  drawSummaryCard(
    doc,
    startX + cardWidth + cardGap,
    startY + cardHeight + cardGap,
    cardWidth,
    cardHeight,
    'Net Profit In Hand',
    formatCurrencyLabel(summary.netProfitInHand),
    'After fees, GST, TDS, base tax, and 4% cess'
  );

  return startY + cardHeight * 2 + cardGap + 28;
}

function drawTableHeader(doc, columns, y) {
  let x = 42;

  doc.save();
  doc.roundedRect(42, y, doc.page.width - 84, 26, 10).fill('#1d2c40');
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#edf4ff');

  for (const column of columns) {
    doc.text(column.label, x + 6, y + 8, {
      width: column.width - 12,
      align: column.align || 'left'
    });
    x += column.width;
  }

  doc.restore();
}

function drawTableRow(doc, columns, row, rowIndex, y) {
  const rowHeight = 34;
  let x = 42;

  if (rowIndex % 2 === 1) {
    doc.save();
    doc.roundedRect(42, y, doc.page.width - 84, rowHeight, 8).fill('#f6f9fc');
    doc.restore();
  }

  doc.save();
  doc.strokeColor('#e4edf6').moveTo(42, y + rowHeight).lineTo(doc.page.width - 42, y + rowHeight).stroke();

  for (const column of columns) {
    const value = typeof column.value === 'function' ? column.value(row, rowIndex) : row[column.key];
    const color = typeof column.color === 'function' ? column.color(row) : '#122033';

    doc.font(column.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).fillColor(color).text(String(value), x + 6, y + 8, {
      width: column.width - 12,
      align: column.align || 'left'
    });

    x += column.width;
  }

  doc.restore();
  return rowHeight;
}

function drawPageFooter(doc, pageNumber) {
  const footerY = doc.page.height - 30;

  doc.save();
  doc.strokeColor('#d8e4f2').moveTo(42, footerY - 8).lineTo(doc.page.width - 42, footerY - 8).stroke();
  doc.fillColor('#6d7b8d').font('Helvetica').fontSize(8).text(`Generated by Crypto Trade Tax Analyzer • Page ${pageNumber}`, 42, footerY, {
    width: doc.page.width - 84,
    align: 'center'
  });
  doc.restore();
}

function sortTradesForExport(realizedTrades = []) {
  return [...realizedTrades].sort((left, right) => {
    const leftTime = new Date(left.sellDateTime || left.sellDate || 0).getTime();
    const rightTime = new Date(right.sellDateTime || right.sellDate || 0).getTime();
    return rightTime - leftTime;
  });
}

function buildPdfDocument(report) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 42,
    info: {
      Title: 'Crypto Trade Tax Audit Report',
      Author: 'Crypto Trade Tax Analyzer'
    }
  });

  const chunks = [];
  const done = new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const columns = [
    { label: '#', width: 26, value: (_row, index) => String(index + 1) },
    { label: 'Pair', width: 72, key: 'contract', bold: true },
    { label: 'Buy Date', width: 90, value: (row) => row.buyDateTime || row.buyDate || '' },
    { label: 'Sell Date', width: 90, value: (row) => row.sellDateTime || row.sellDate || '' },
    { label: 'Qty', width: 52, value: (row) => formatQuantity(row.matchedQty), align: 'right' },
    { label: 'Gross', width: 64, value: (row) => formatMoney(row.grossProfit), align: 'right', color: (row) => (Number(row.grossProfit) >= 0 ? '#0f9b5f' : '#d4584f'), bold: true },
    { label: 'Fees', width: 58, value: (row) => formatMoney(row.fees), align: 'right' },
    { label: 'GST', width: 48, value: (row) => formatMoney(row.gstOnFees), align: 'right' },
    { label: 'TDS', width: 52, value: (row) => formatMoney(row.tds), align: 'right' },
    { label: 'Tax', width: 62, value: (row) => formatMoney(row.totalTaxAmount || 0), align: 'right' },
    { label: 'Final Net', width: 70, value: (row) => formatMoney(row.finalNetProfit), align: 'right', color: (row) => (Number(row.finalNetProfit) >= 0 ? '#0f9b5f' : '#d4584f'), bold: true }
  ];

  drawReportHeader(doc, report);
  let y = drawSummarySection(doc, report);

  doc.fillColor('#102034').font('Helvetica-Bold').fontSize(12).text('Realized Trade Audit Trail', 42, y);
  doc.fillColor('#5d6d7d').font('Helvetica').fontSize(9).text('Chronological realized trades with capital gain, deduction, and post-tax audit values.', 42, y + 16);
  y += 34;

  const sortedTrades = sortTradesForExport(report.realizedTrades);
  let pageNumber = 1;

  drawTableHeader(doc, columns, y);
  y += 32;

  for (const [index, trade] of sortedTrades.entries()) {
    const rowHeight = 34;
    const pageBottomLimit = doc.page.height - 50;

    if (y + rowHeight > pageBottomLimit) {
      drawPageFooter(doc, pageNumber);
      doc.addPage();
      pageNumber += 1;
      drawReportHeader(doc, report);
      doc.fillColor('#102034').font('Helvetica-Bold').fontSize(12).text('Realized Trade Audit Trail', 42, 138);
      y = 162;
      drawTableHeader(doc, columns, y);
      y += 32;
    }

    y += drawTableRow(doc, columns, trade, index, y);
  }

  drawPageFooter(doc, pageNumber);
  doc.end();
  return done;
}

async function generatePdfBuffer(report) {
  const payload = buildExportPayload(report);
  const nextBuffer = await buildPdfDocument(payload);
  validateExportBuffer('pdf', nextBuffer);
  return nextBuffer;
}

async function generatePdfBufferByReportId(reportId) {
  const cachedBuffer = getCachedExportBuffer(reportId, 'pdf');

  if (cachedBuffer) {
    return cachedBuffer;
  }

  const report = getCachedReport(reportId);
  const nextBuffer = await generatePdfBuffer(report);
  storeCachedExportBuffer(reportId, 'pdf', nextBuffer);
  return nextBuffer;
}

module.exports = {
  generateCsvBuffer,
  generateCsvBufferByReportId,
  generatePdfBuffer,
  generatePdfBufferByReportId
};
