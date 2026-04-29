const Decimal = require('decimal.js');

const { formatDate, formatDateTime, formatMonth, parseTradeTimestamp } = require('../utils/date');

Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP
});

const EPSILON = new Decimal('0.00000001');
const DEFAULT_SETTINGS = {
  userName: '',
  exchangeName: '',
  buyFeePercent: new Decimal(0),
  sellFeePercent: new Decimal('0.1'),
  buyFeeRate: new Decimal(0),
  sellFeeRate: new Decimal('0.001'),
  gstRate: new Decimal('0.18'),
  tdsRate: new Decimal('0.01'),
  taxRate: new Decimal('0.30')
};

const FIELD_ALIASES = {
  time: ['Time', 'time', 'Timestamp', 'timestamp', 'Date', 'date', 'DateTime'],
  contract: ['Contract', 'contract', 'Symbol', 'symbol', 'Pair', 'Instrument'],
  qty: ['Qty', 'qty', 'Quantity', 'quantity', 'Amount', 'Size', 'Filled Qty', 'filled_qty'],
  side: ['Side', 'side', 'Type', 'type', 'Action'],
  execPrice: ['Exec.Price', 'Exec Price', 'Price', 'price', 'Execution Price', 'Rate', 'exec_price'],
  orderValue: ['Order Value', 'order_value', 'Value', 'value', 'Total'],
  fees: ['Trading Fees', 'Fees', 'fees', 'Commission', 'commission', 'Fees paid', 'fees_paid'],
  status: ['Status', 'status', 'Order Status', 'order_status']
};

function findAliasValue(row, aliases) {
  for (const alias of aliases) {
    const value = row[alias];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  return null;
}

function sanitizeNumeric(value) {
  return String(value).replace(/,/g, '').trim();
}

function parseDecimal(value, label) {
  try {
    return new Decimal(sanitizeNumeric(value));
  } catch (error) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

function parseNonNegativeDecimal(value, label) {
  const decimalValue = parseDecimal(value, label);

  if (decimalValue.lt(0)) {
    throw new Error(`${label} must be zero or greater`);
  }

  return decimalValue;
}

function toMoney(decimalValue) {
  return Number(new Decimal(decimalValue).toDecimalPlaces(2).toString());
}

function toQuantity(decimalValue) {
  return Number(new Decimal(decimalValue).toDecimalPlaces(8).toString());
}

function determineSide(rawValue) {
  const normalized = String(rawValue || '').toLowerCase();

  if (normalized.includes('buy')) {
    return 'buy';
  }

  if (normalized.includes('sell')) {
    return 'sell';
  }

  throw new Error(`Unknown side: ${rawValue}`);
}

function resolveSettings(rawSettings = {}) {
  const normalizedUserName = String(rawSettings.userName || '').trim();
  const normalizedExchangeName = String(rawSettings.exchangeName || '').trim();
  let buyFeePercent = DEFAULT_SETTINGS.buyFeePercent;
  let sellFeePercent = DEFAULT_SETTINGS.sellFeePercent;

  if (
    rawSettings.buyFeePercent !== undefined ||
    rawSettings.sellFeePercent !== undefined ||
    rawSettings.userName !== undefined ||
    rawSettings.exchangeName !== undefined
  ) {
    buyFeePercent =
      rawSettings.buyFeePercent === undefined || rawSettings.buyFeePercent === null || rawSettings.buyFeePercent === ''
        ? DEFAULT_SETTINGS.buyFeePercent
        : parseNonNegativeDecimal(rawSettings.buyFeePercent, 'buy fee rate');
    sellFeePercent =
      rawSettings.sellFeePercent === undefined || rawSettings.sellFeePercent === null || rawSettings.sellFeePercent === ''
        ? DEFAULT_SETTINGS.sellFeePercent
        : parseNonNegativeDecimal(rawSettings.sellFeePercent, 'sell fee rate');
  } else {
    const legacyFeeRatePercent =
      rawSettings.feeRatePercent === undefined || rawSettings.feeRatePercent === null || rawSettings.feeRatePercent === ''
        ? DEFAULT_SETTINGS.sellFeePercent
        : parseNonNegativeDecimal(rawSettings.feeRatePercent, 'fee rate');
    const legacyFeeSide = ['buy', 'sell', 'both'].includes(rawSettings.feeAppliesTo)
      ? rawSettings.feeAppliesTo
      : 'sell';

    if (legacyFeeSide === 'buy' || legacyFeeSide === 'both') {
      buyFeePercent = legacyFeeRatePercent;
    }

    if (legacyFeeSide === 'sell' || legacyFeeSide === 'both') {
      sellFeePercent = legacyFeeRatePercent;
    }
  }

  return {
    ...DEFAULT_SETTINGS,
    userName: normalizedUserName,
    exchangeName: normalizedExchangeName,
    buyFeePercent,
    sellFeePercent,
    buyFeeRate: buyFeePercent.div(100),
    sellFeeRate: sellFeePercent.div(100)
  };
}

function hasSemanticHeader(headers, semanticKey) {
  const headerSet = new Set(headers.map((header) => String(header).trim().toLowerCase()));
  return FIELD_ALIASES[semanticKey].some((alias) => headerSet.has(alias.toLowerCase()));
}

function validateHeaders(headers) {
  const requiredFields = ['time', 'contract', 'qty', 'side', 'execPrice'];
  return requiredFields.filter((field) => !hasSemanticHeader(headers, field));
}

function shouldSkipTradeRow(row) {
  const rawStatus = findAliasValue(row, FIELD_ALIASES.status);

  if (!rawStatus) {
    return false;
  }

  const normalizedStatus = rawStatus.toLowerCase();

  return ['cancelled', 'canceled', 'rejected', 'expired', 'failed'].some((status) =>
    normalizedStatus.includes(status)
  );
}

function normalizeTradeRow(row, index) {
  const rawTime = findAliasValue(row, FIELD_ALIASES.time);
  const rawContract = findAliasValue(row, FIELD_ALIASES.contract);
  const rawQuantity = findAliasValue(row, FIELD_ALIASES.qty);
  const rawSide = findAliasValue(row, FIELD_ALIASES.side);
  const rawExecPrice = findAliasValue(row, FIELD_ALIASES.execPrice);

  if (!rawTime || !rawContract || !rawQuantity || !rawSide || !rawExecPrice) {
    throw new Error('Missing one or more required values');
  }

  const qty = parseDecimal(rawQuantity, 'quantity');
  const execPrice = parseDecimal(rawExecPrice, 'exec price');

  if (qty.lte(0)) {
    throw new Error('Quantity must be greater than 0');
  }

  if (execPrice.lte(0)) {
    throw new Error('Exec.Price must be greater than 0');
  }

  const time = parseTradeTimestamp(rawTime);
  const side = determineSide(rawSide);
  const orderValueRaw = findAliasValue(row, FIELD_ALIASES.orderValue);
  const feeValueRaw = findAliasValue(row, FIELD_ALIASES.fees);

  return {
    id: `trade-${index + 2}`,
    rowNumber: index + 2,
    time,
    timeLabel: formatDateTime(time),
    contract: rawContract.toUpperCase(),
    qty,
    side,
    execPrice,
    orderValue: orderValueRaw ? parseDecimal(orderValueRaw, 'order value') : qty.mul(execPrice),
    rawFees: feeValueRaw ? parseDecimal(feeValueRaw, 'fees') : new Decimal(0)
  };
}

function buildRealizedTrade(contract, buyLot, sellTrade, matchedQty, sequence, settings) {
  const buyValue = matchedQty.mul(buyLot.execPrice);
  const sellValue = matchedQty.mul(sellTrade.execPrice);
  const grossProfit = sellValue.minus(buyValue);
  const buySideFee = buyValue.mul(settings.buyFeeRate);
  const sellSideFee = sellValue.mul(settings.sellFeeRate);
  const fees = buySideFee.plus(sellSideFee);
  const gstOnFees = fees.mul(settings.gstRate);
  const tds = sellValue.mul(settings.tdsRate);
  const cryptoTax = grossProfit.gt(0) ? grossProfit.mul(settings.taxRate) : new Decimal(0);
  const netProfitInHand = grossProfit.minus(fees).minus(gstOnFees).minus(tds).minus(cryptoTax);
  const finalNetProfit = netProfitInHand.plus(tds);
  const holdingDays = Math.max(
    0,
    Math.floor((sellTrade.time.getTime() - buyLot.time.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    id: `${contract}-${sequence}`,
    contract,
    buyDate: formatDate(buyLot.time),
    buyDateTime: formatDateTime(buyLot.time),
    sellDate: formatDate(sellTrade.time),
    sellDateTime: formatDateTime(sellTrade.time),
    matchedQty: toQuantity(matchedQty),
    buyPrice: toMoney(buyLot.execPrice),
    sellPrice: toMoney(sellTrade.execPrice),
    buyValue: toMoney(buyValue),
    sellValue: toMoney(sellValue),
    grossProfit: toMoney(grossProfit),
    buySideFee: toMoney(buySideFee),
    sellSideFee: toMoney(sellSideFee),
    fees: toMoney(fees),
    gstOnFees: toMoney(gstOnFees),
    tds: toMoney(tds),
    cryptoTax: toMoney(cryptoTax),
    netProfitInHand: toMoney(netProfitInHand),
    finalNetProfit: toMoney(finalNetProfit),
    holdingDays,
    resultLabel: finalNetProfit.gte(0) ? 'WIN' : 'LOSS'
  };
}

function aggregateSummary(realizedTrades) {
  const summary = {
    totalBuyValue: 0,
    totalSellValue: 0,
    grossProfit: 0,
    totalFeesPaid: 0,
    totalGstOnFees: 0,
    totalTdsDeducted: 0,
    totalCryptoTax: 0,
    netProfitInHand: 0,
    finalNetProfit: 0
  };

  for (const trade of realizedTrades) {
    summary.totalBuyValue += trade.buyValue;
    summary.totalSellValue += trade.sellValue;
    summary.grossProfit += trade.grossProfit;
    summary.totalFeesPaid += trade.fees;
    summary.totalGstOnFees += trade.gstOnFees;
    summary.totalTdsDeducted += trade.tds;
    summary.totalCryptoTax += trade.cryptoTax;
    summary.netProfitInHand += trade.netProfitInHand;
    summary.finalNetProfit += trade.finalNetProfit;
  }

  for (const key of Object.keys(summary)) {
    summary[key] = Number(summary[key].toFixed(2));
  }

  return summary;
}

function buildAnalytics(realizedTrades, openPositions, summary) {
  const assetMap = new Map();
  const openMap = new Map();
  const monthMap = new Map();

  for (const trade of realizedTrades) {
    if (!assetMap.has(trade.contract)) {
      assetMap.set(trade.contract, {
        contract: trade.contract,
        grossProfit: 0,
        finalNetProfit: 0,
        sellValue: 0,
        buyValue: 0,
        cryptoTax: 0,
        tradesCount: 0
      });
    }

    const asset = assetMap.get(trade.contract);
    asset.grossProfit += trade.grossProfit;
    asset.finalNetProfit += trade.finalNetProfit;
    asset.sellValue += trade.sellValue;
    asset.buyValue += trade.buyValue;
    asset.cryptoTax += trade.cryptoTax;
    asset.tradesCount += 1;

    const monthKey = trade.sellDate.slice(0, 7);
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        month: monthKey,
        grossProfit: 0,
        finalNetProfit: 0,
        sellValue: 0
      });
    }

    const month = monthMap.get(monthKey);
    month.grossProfit += trade.grossProfit;
    month.finalNetProfit += trade.finalNetProfit;
    month.sellValue += trade.sellValue;
  }

  for (const position of openPositions) {
    if (!openMap.has(position.contract)) {
      openMap.set(position.contract, {
        contract: position.contract,
        unsoldQty: 0,
        totalInvested: 0
      });
    }

    const open = openMap.get(position.contract);
    open.unsoldQty += position.unsoldQty;
    open.totalInvested += position.totalInvested;
  }

  const realizedPnlByAsset = [...assetMap.values()]
    .map((asset) => ({
      ...asset,
      grossProfit: Number(asset.grossProfit.toFixed(2)),
      finalNetProfit: Number(asset.finalNetProfit.toFixed(2)),
      sellValue: Number(asset.sellValue.toFixed(2)),
      buyValue: Number(asset.buyValue.toFixed(2)),
      cryptoTax: Number(asset.cryptoTax.toFixed(2))
    }))
    .sort((left, right) => right.finalNetProfit - left.finalNetProfit);

  const openPositionsDistribution = [...openMap.values()]
    .map((position) => ({
      ...position,
      unsoldQty: Number(position.unsoldQty.toFixed(8)),
      totalInvested: Number(position.totalInvested.toFixed(2))
    }))
    .sort((left, right) => right.totalInvested - left.totalInvested);

  const monthlyPerformance = [...monthMap.values()]
    .map((month) => ({
      ...month,
      grossProfit: Number(month.grossProfit.toFixed(2)),
      finalNetProfit: Number(month.finalNetProfit.toFixed(2)),
      sellValue: Number(month.sellValue.toFixed(2))
    }))
    .sort((left, right) => left.month.localeCompare(right.month));

  const taxBreakdown = [
    { label: 'Fees', value: summary.totalFeesPaid },
    { label: 'GST on Fees', value: summary.totalGstOnFees },
    { label: 'TDS', value: summary.totalTdsDeducted },
    { label: 'Crypto Tax', value: summary.totalCryptoTax }
  ];

  return {
    realizedPnlByAsset,
    openPositionsDistribution,
    monthlyPerformance,
    taxBreakdown
  };
}

function processNormalizedTrades(trades, warnings = [], rawSettings = {}) {
  const settings = resolveSettings(rawSettings);
  const groupedTrades = new Map();
  const realizedTrades = [];
  const openPositions = [];
  let tradeSequence = 1;

  for (const trade of [...trades].sort((left, right) => left.time - right.time)) {
    if (!groupedTrades.has(trade.contract)) {
      groupedTrades.set(trade.contract, []);
    }

    groupedTrades.get(trade.contract).push(trade);
  }

  for (const [contract, contractTrades] of groupedTrades.entries()) {
    const buyQueue = [];

    for (const trade of contractTrades) {
      if (trade.side === 'buy') {
        buyQueue.push({
          ...trade,
          remainingQty: trade.qty
        });
        continue;
      }

      let remainingSell = trade.qty;

      while (remainingSell.gt(EPSILON) && buyQueue.length > 0) {
        const currentBuy = buyQueue[0];
        const matchedQty = Decimal.min(currentBuy.remainingQty, remainingSell);

        realizedTrades.push(buildRealizedTrade(contract, currentBuy, trade, matchedQty, tradeSequence, settings));

        tradeSequence += 1;
        currentBuy.remainingQty = currentBuy.remainingQty.minus(matchedQty);
        remainingSell = remainingSell.minus(matchedQty);

        if (currentBuy.remainingQty.lte(EPSILON)) {
          buyQueue.shift();
        }
      }

      if (remainingSell.gt(EPSILON)) {
        warnings.push(
          `Row ${trade.rowNumber}: sell quantity exceeded available buys for ${contract}. Unmatched sell quantity ${toQuantity(
            remainingSell
          )} was ignored.`
        );
      }
    }

    for (const buyLot of buyQueue) {
      if (buyLot.remainingQty.lte(EPSILON)) {
        continue;
      }

      const remainingBuyValue = buyLot.remainingQty.mul(buyLot.execPrice);
      const openBuyFee = remainingBuyValue.mul(settings.buyFeeRate);
      const totalInvested = remainingBuyValue.plus(openBuyFee);

      openPositions.push({
        id: `${contract}-open-${buyLot.rowNumber}`,
        contract,
        buyDate: formatDate(buyLot.time),
        buyDateTime: formatDateTime(buyLot.time),
        unsoldQty: toQuantity(buyLot.remainingQty),
        avgBuyPrice: toMoney(buyLot.execPrice),
        buySideFee: toMoney(openBuyFee),
        totalInvested: toMoney(totalInvested)
      });
    }
  }

  const summary = aggregateSummary(realizedTrades);
  const analytics = buildAnalytics(realizedTrades, openPositions, summary);
  const contracts = [...new Set(trades.map((trade) => trade.contract))].sort();
  const meta = {
    contracts,
    contractCount: contracts.length,
    realizedTradesCount: realizedTrades.length,
    openPositionsCount: openPositions.length,
    processedAt: formatDateTime(new Date()),
    feeModel: {
      userName: settings.userName,
      exchangeName: settings.exchangeName,
      buyFeePercent: Number(settings.buyFeePercent.toDecimalPlaces(4).toString()),
      sellFeePercent: Number(settings.sellFeePercent.toDecimalPlaces(4).toString())
    }
  };

  return {
    summary,
    realizedTrades,
    openPositions: openPositions.sort((left, right) => left.buyDateTime.localeCompare(right.buyDateTime)),
    analytics,
    meta,
    warnings
  };
}

module.exports = {
  buildAnalytics,
  normalizeTradeRow,
  processNormalizedTrades,
  shouldSkipTradeRow,
  validateHeaders
};
