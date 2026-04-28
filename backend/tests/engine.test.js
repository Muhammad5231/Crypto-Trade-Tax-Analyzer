const test = require('node:test');
const assert = require('node:assert/strict');

const { SAMPLE_CSV } = require('../src/constants/sampleCsv');
const { processTradeUpload } = require('../src/services/trade-processing.service');

test('processTradeUpload returns expected totals for the sample CSV', () => {
  const report = processTradeUpload(Buffer.from(SAMPLE_CSV, 'utf8'));

  assert.equal(report.meta.validTrades, 8);
  assert.equal(report.realizedTrades.length, 4);
  assert.equal(report.openPositions.length, 0);
  assert.equal(report.summary.totalBuyValue, 3700000);
  assert.equal(report.summary.totalSellValue, 3847000);
  assert.equal(report.summary.grossProfit, 147000);
  assert.equal(report.summary.totalFeesPaid, 3847);
  assert.equal(report.summary.totalGstOnFees, 692.46);
  assert.equal(report.summary.totalTdsDeducted, 38470);
  assert.equal(report.summary.totalCryptoTax, 59100);
  assert.equal(report.summary.finalNetProfit, 83360.54);
  assert.deepEqual(report.meta.feeModel, {
    userName: '',
    exchangeName: '',
    buyFeePercent: 0,
    sellFeePercent: 0.1
  });
});

test('processTradeUpload preserves unmatched buys as open positions', () => {
  const csv = `Time,Contract,Qty,Side,Exec.Price
2024-03-01 10:00:00,SOLUSDT,5,buy,8000
2024-03-05 10:00:00,SOLUSDT,2,sell,9000`;

  const report = processTradeUpload(Buffer.from(csv, 'utf8'));

  assert.equal(report.realizedTrades.length, 1);
  assert.equal(report.openPositions.length, 1);
  assert.equal(report.openPositions[0].contract, 'SOLUSDT');
  assert.equal(report.openPositions[0].unsoldQty, 3);
  assert.equal(report.openPositions[0].totalInvested, 24000);
});

test('processTradeUpload skips cancelled rows without creating warnings', () => {
  const csv = `Time,Contract,Qty,Side,Exec.Price,Status
2024-03-01 10:00:00,BTCUSDT,1,buy,4200000,closed
2024-03-01 10:05:00,BTCUSDT,1,sell,,cancelled
2024-03-02 10:00:00,BTCUSDT,1,sell,4300000,closed`;

  const report = processTradeUpload(Buffer.from(csv, 'utf8'));

  assert.equal(report.meta.validTrades, 2);
  assert.equal(report.realizedTrades.length, 1);
  assert.equal(report.warnings.length, 0);
});

test('processTradeUpload applies configurable buy-side spot fees and carries them into open holdings', () => {
  const csv = `Time,Contract,Qty,Side,Exec.Price
2024-03-01 10:00:00,SOLUSDT,5,buy,100
2024-03-05 10:00:00,SOLUSDT,2,sell,150`;

  const report = processTradeUpload(Buffer.from(csv, 'utf8'), {
    userName: 'Muhammad',
    exchangeName: 'Delta',
    buyFeePercent: 1,
    sellFeePercent: 0
  });

  assert.equal(report.realizedTrades.length, 1);
  assert.equal(report.realizedTrades[0].fees, 2);
  assert.equal(report.realizedTrades[0].gstOnFees, 0.36);
  assert.equal(report.realizedTrades[0].finalNetProfit, 67.64);
  assert.equal(report.openPositions.length, 1);
  assert.equal(report.openPositions[0].buySideFee, 3);
  assert.equal(report.openPositions[0].totalInvested, 303);
  assert.deepEqual(report.meta.feeModel, {
    userName: 'Muhammad',
    exchangeName: 'Delta',
    buyFeePercent: 1,
    sellFeePercent: 0
  });
});
