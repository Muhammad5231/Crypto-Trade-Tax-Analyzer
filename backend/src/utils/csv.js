const iconv = require('iconv-lite');
const Papa = require('papaparse');

const CANDIDATE_ENCODINGS = ['utf8', 'utf-8', 'utf16le', 'latin1', 'win1252'];
const HIDDEN_CHAR_REGEX = /[\u0000\u200B-\u200D\u2060\uFEFF]/g;
const DELIMITER_CANDIDATES = [',', ';', '\t'];

function stripHiddenCharacters(value) {
  return String(value || '').replace(HIDDEN_CHAR_REGEX, '').trim();
}

function sanitizeHeader(header) {
  return stripHiddenCharacters(header);
}

function sanitizeCellValue(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return stripHiddenCharacters(value);
}

function sanitizeCsvText(text) {
  return String(text || '').replace(/^\uFEFF/, '');
}

function detectDelimiter(text) {
  const preview = Papa.parse(text, {
    delimiter: '',
    preview: 8,
    skipEmptyLines: 'greedy'
  });

  if (preview.meta?.delimiter) {
    return preview.meta.delimiter;
  }

  const firstNonEmptyLine = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstNonEmptyLine) {
    return ',';
  }

  let selectedDelimiter = ',';
  let maxHits = -1;

  for (const candidate of DELIMITER_CANDIDATES) {
    const hits = firstNonEmptyLine.split(candidate).length - 1;

    if (hits > maxHits) {
      maxHits = hits;
      selectedDelimiter = candidate;
    }
  }

  return selectedDelimiter;
}

function normalizeRowValue(value) {
  return stripHiddenCharacters(value).toLowerCase();
}

function isDuplicateHeaderRow(row, headers) {
  if (!row || !headers.length) {
    return false;
  }

  const rowValues = headers.map((header) => normalizeRowValue(row[header]));
  const headerValues = headers.map((header) => normalizeRowValue(header));

  return rowValues.every((value, index) => value === headerValues[index]);
}

function buildParseIssue({ code, message, severity = 'error', row = null, column = null, value = null }) {
  return {
    code,
    severity,
    message,
    row,
    column,
    value
  };
}

function parseCsvBuffer(buffer) {
  let fallbackResult = null;

  for (const encoding of CANDIDATE_ENCODINGS) {
    const text = sanitizeCsvText(iconv.decode(buffer, encoding));
    const delimiter = detectDelimiter(text);
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: 'greedy',
      delimiter,
      transformHeader: sanitizeHeader,
      transform: sanitizeCellValue
    });

    const headers = (parsed.meta.fields || []).map(sanitizeHeader).filter(Boolean);
    let duplicateHeaderRowsDropped = 0;

    const rows = (parsed.data || []).filter((row) => {
      const isDuplicateHeader = isDuplicateHeaderRow(row, headers);

      if (isDuplicateHeader) {
        duplicateHeaderRowsDropped += 1;
      }

      return !isDuplicateHeader;
    });

    const issues = [];

    if (!headers.length) {
      issues.push(
        buildParseIssue({
          code: 'csv_headers_missing',
          message: 'No readable header row was detected in the uploaded CSV.'
        })
      );
    }

    if (duplicateHeaderRowsDropped > 0) {
      issues.push(
        buildParseIssue({
          code: 'duplicate_header_rows_removed',
          severity: 'warning',
          message: `Removed ${duplicateHeaderRowsDropped} duplicate header row${duplicateHeaderRowsDropped === 1 ? '' : 's'} from the uploaded CSV.`
        })
      );
    }

    for (const parseError of parsed.errors || []) {
      issues.push(
        buildParseIssue({
          code: 'csv_parse_warning',
          severity: 'warning',
          row: Number.isFinite(parseError.row) ? parseError.row + 1 : null,
          message: parseError.message
        })
      );
    }

    const result = {
      encodingUsed: encoding,
      delimiterUsed: delimiter === '\t' ? 'tab' : delimiter,
      headers,
      rows,
      parseErrors: parsed.errors || [],
      duplicateHeaderRowsDropped,
      issues
    };

    if (!fallbackResult) {
      fallbackResult = result;
    }

    if (headers.length > 0) {
      return result;
    }
  }

  return (
    fallbackResult || {
      encodingUsed: 'utf8',
      delimiterUsed: ',',
      headers: [],
      rows: [],
      parseErrors: [],
      duplicateHeaderRowsDropped: 0,
      issues: [
        buildParseIssue({
          code: 'csv_unreadable',
          message: 'The uploaded file could not be decoded as a readable CSV document.'
        })
      ]
    }
  );
}

module.exports = {
  parseCsvBuffer
};
