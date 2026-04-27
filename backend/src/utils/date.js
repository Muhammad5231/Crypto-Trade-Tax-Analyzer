const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(customParseFormat);

const SUPPORTED_FORMATS = [
  'YYYY-MM-DD HH:mm:ss.SSS',
  'YYYY-MM-DD HH:mm:ss',
  'DD/MM/YYYY HH:mm:ss',
  'YYYY/MM/DD HH:mm:ss',
  'DD-MM-YYYY HH:mm:ss',
  'YYYY-MM-DDTHH:mm:ss.SSS',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DD'
];

function sanitizeTimestamp(rawValue) {
  let clean = String(rawValue || '').trim();

  clean = clean.replace(/\s+(IST|UTC)\s+\S+$/i, '');
  clean = clean.replace(/\s+(IST|UTC)$/i, '');
  clean = clean.replace(/[+-]\d{2}:\d{2}$/, '');
  clean = clean.replace(/Z$/i, '');
  clean = clean.replace(/\.(\d{3})\d+/, '.$1');

  return clean.trim();
}

function parseTradeTimestamp(rawValue) {
  const sanitized = sanitizeTimestamp(rawValue);

  if (!sanitized) {
    throw new Error('Missing timestamp');
  }

  for (const format of SUPPORTED_FORMATS) {
    const parsed = dayjs(sanitized, format, true);

    if (parsed.isValid()) {
      return parsed.toDate();
    }
  }

  const fallback = dayjs(sanitized);
  if (fallback.isValid()) {
    return fallback.toDate();
  }

  throw new Error(`Cannot parse time: ${rawValue}`);
}

function formatDate(value) {
  return dayjs(value).format('YYYY-MM-DD');
}

function formatDateTime(value) {
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

function formatMonth(value) {
  return dayjs(value).format('YYYY-MM');
}

module.exports = {
  formatDate,
  formatDateTime,
  formatMonth,
  parseTradeTimestamp
};
