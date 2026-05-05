const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

const STANDARD_TIMEZONE = 'Asia/Kolkata';
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

const TIMEZONE_LABELS = {
  IST: 'Asia/Kolkata',
  UTC: 'UTC',
  GMT: 'UTC'
};

function stripHiddenCharacters(value) {
  return String(value || '').replace(/[\u0000\u200B-\u200D\u2060\uFEFF]/g, '').trim();
}

function trimFractionalSeconds(value) {
  return value.replace(/\.(\d{3})\d+/, '.$1');
}

function buildTimezoneError(message, rawValue) {
  const error = new Error(message);
  error.code = 'TIMEZONE_PARSE_ERROR';
  error.rawValue = rawValue;
  return error;
}

function parseNaiveTimestamp(rawValue, timezoneLabel) {
  const sanitized = trimFractionalSeconds(stripHiddenCharacters(rawValue));

  for (const format of SUPPORTED_FORMATS) {
    try {
      const parsed = dayjs.tz(sanitized, format, timezoneLabel);

      if (parsed.isValid()) {
        return parsed;
      }
    } catch (_error) {
      // Ignore mismatched formats and continue checking the remaining patterns.
    }
  }

  try {
    const fallback = dayjs.tz(sanitized, timezoneLabel);

    if (fallback.isValid()) {
      return fallback;
    }
  } catch (_error) {
    // Fall through to the structured timezone error below.
  }

  throw buildTimezoneError(`Cannot parse time: ${rawValue}`, rawValue);
}

function parseOffsetTimestamp(rawValue) {
  const sanitized = trimFractionalSeconds(stripHiddenCharacters(rawValue));
  const withoutTrailingZoneText = sanitized.replace(/\s+[A-Z]{2,5}(?:\s+[A-Za-z_]+\/[A-Za-z_]+)?$/i, '');
  const normalized = withoutTrailingZoneText.replace(' ', 'T');
  try {
    const parsed = dayjs(normalized);

    if (parsed.isValid()) {
      return parsed;
    }
  } catch (_error) {
    // Fall through to the structured timezone error below.
  }

  throw buildTimezoneError(`Cannot parse offset timestamp: ${rawValue}`, rawValue);
}

function extractTimezoneContext(rawValue) {
  const sanitized = stripHiddenCharacters(rawValue).replace(/\s+/g, ' ').trim();
  const offsetMatch = sanitized.match(/(?<=\d)([+-]\d{2}:\d{2}|Z)(?=\s|$)/i);
  const ianaMatch = sanitized.match(/\b([A-Za-z_]+\/[A-Za-z_]+)\b/);
  const abbreviationMatch = sanitized.match(/\b([A-Z]{2,5})\b(?=\s+[A-Za-z_]+\/[A-Za-z_]+|$)/);

  return {
    sanitized,
    offset: offsetMatch ? offsetMatch[1] : null,
    ianaZone: ianaMatch ? ianaMatch[1] : null,
    abbreviation: abbreviationMatch ? abbreviationMatch[1] : null
  };
}

function parseTradeTimestamp(rawValue) {
  const { sanitized, offset, ianaZone, abbreviation } = extractTimezoneContext(rawValue);

  if (!sanitized) {
    throw buildTimezoneError('Missing timestamp', rawValue);
  }

  let parsed;
  let sourceTimezone = 'assumed-IST';

  if (offset || /\dZ$/i.test(sanitized)) {
    parsed = parseOffsetTimestamp(sanitized);
    sourceTimezone = offset || 'UTC';
  } else if (ianaZone) {
    const baseTimestamp = sanitized.replace(new RegExp(`\\s*${ianaZone.replace('/', '\\/')}\\s*$`), '').trim();
    parsed = parseNaiveTimestamp(baseTimestamp, ianaZone);
    sourceTimezone = ianaZone;
  } else if (abbreviation && TIMEZONE_LABELS[abbreviation]) {
    const baseTimestamp = sanitized.replace(new RegExp(`\\s*${abbreviation}\\s*$`), '').trim();
    parsed = parseNaiveTimestamp(baseTimestamp, TIMEZONE_LABELS[abbreviation]);
    sourceTimezone = TIMEZONE_LABELS[abbreviation];
  } else if (abbreviation) {
    throw buildTimezoneError(
      `Timezone label "${abbreviation}" could not be resolved automatically. Please normalize the file timestamps before upload.`,
      rawValue
    );
  } else {
    parsed = parseNaiveTimestamp(sanitized, STANDARD_TIMEZONE);
  }

  return {
    date: parsed.toDate(),
    normalizedTimezone: STANDARD_TIMEZONE,
    normalizedLabel: parsed.tz(STANDARD_TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
    sourceTimezone
  };
}

function formatDate(value) {
  return dayjs(value).tz(STANDARD_TIMEZONE).format('YYYY-MM-DD');
}

function formatDateTime(value) {
  return dayjs(value).tz(STANDARD_TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
}

function formatMonth(value) {
  return dayjs(value).tz(STANDARD_TIMEZONE).format('YYYY-MM');
}

module.exports = {
  STANDARD_TIMEZONE,
  formatDate,
  formatDateTime,
  formatMonth,
  parseTradeTimestamp
};
