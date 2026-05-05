const test = require('node:test');
const assert = require('node:assert/strict');

const { app } = require('../src/app');
const { SAMPLE_CSV } = require('../src/constants/sampleCsv');
const { generateCsvBuffer, generatePdfBuffer } = require('../src/services/export.service');
const { storeProcessedReport } = require('../src/services/report-cache.service');
const { processTradeUpload } = require('../src/services/trade-processing.service');

test('generateCsvBuffer returns a combined CSV export payload', async () => {
  const report = processTradeUpload(Buffer.from(SAMPLE_CSV, 'utf8'));
  report.meta.sourceFile = 'sample-trades.csv';

  const csvBuffer = await generateCsvBuffer(report);
  const csvText = csvBuffer.toString('utf8');

  assert.match(csvText, /Crypto Trade Tax Analyzer - Spot CSV Export/);
  assert.match(csvText, /Buy Fee Rate,0%/);
  assert.match(csvText, /Sell Fee Rate,0.1%/);
  assert.match(csvText, /SUMMARY/);
  assert.match(csvText, /Total 4% Cess/);
  assert.match(csvText, /REALIZED TRADES/);
  assert.match(csvText, /Pair,Buy Date,Sell Date,Qty/);
  assert.match(csvText, /BTCUSDT/);
});

test('POST /api/export/csv returns a valid CSV payload over HTTP', async () => {
  const report = processTradeUpload(Buffer.from(SAMPLE_CSV, 'utf8'));
  report.meta.sourceFile = 'sample-trades.csv';

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/export/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(report)
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /text\/csv/);
    assert.ok(Number(response.headers.get('content-length') || 0) > 100);
    assert.match(response.headers.get('content-disposition') || '', /crypto-trade-tax-analyzer-spot-report\.csv/);

    const payload = Buffer.from(await response.arrayBuffer()).toString('utf8');
    assert.match(payload, /REALIZED TRADES/);
    assert.match(payload, /OPEN HOLDINGS/);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});

test('GET /api/export/csv/:reportId returns a cached CSV payload', async () => {
  const report = storeProcessedReport(processTradeUpload(Buffer.from(SAMPLE_CSV, 'utf8')));
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/export/csv/${report.meta.reportId}`);

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /text\/csv/);
    assert.match(response.headers.get('content-disposition') || '', /crypto-trade-tax-analyzer-spot-report\.csv/);

    const payload = Buffer.from(await response.arrayBuffer()).toString('utf8');
    assert.match(payload, /Report ID/);
    assert.match(payload, new RegExp(report.meta.reportId));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});

test('generatePdfBuffer returns a non-empty PDF payload', async () => {
  const report = processTradeUpload(Buffer.from(SAMPLE_CSV, 'utf8'));
  report.meta.sourceFile = 'sample-trades.csv';
  report.meta.reportId = 'pdf-test-report';

  const pdfBuffer = await generatePdfBuffer(report);

  assert.ok(Buffer.isBuffer(pdfBuffer));
  assert.ok(pdfBuffer.length > 1000);
  assert.equal(pdfBuffer.subarray(0, 4).toString('utf8'), '%PDF');
});

test('GET /api/export/pdf/:reportId returns a valid PDF payload over HTTP', async () => {
  const report = storeProcessedReport(processTradeUpload(Buffer.from(SAMPLE_CSV, 'utf8')));
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/export/pdf/${report.meta.reportId}`);

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /application\/pdf/);
    assert.match(response.headers.get('content-disposition') || '', /crypto-trade-tax-analyzer-spot-report\.pdf/);

    const payload = Buffer.from(await response.arrayBuffer());
    assert.ok(payload.length > 1000);
    assert.equal(payload.subarray(0, 4).toString('utf8'), '%PDF');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});
