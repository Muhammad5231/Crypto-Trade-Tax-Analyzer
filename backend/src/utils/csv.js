const iconv = require('iconv-lite');
const Papa = require('papaparse');

const CANDIDATE_ENCODINGS = ['utf8', 'utf-8', 'latin1', 'win1252'];

function parseCsvBuffer(buffer) {
  let fallbackResult = null;

  for (const encoding of CANDIDATE_ENCODINGS) {
    const text = iconv.decode(buffer, encoding);
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => String(header || '').trim()
    });

    const headers = (parsed.meta.fields || []).filter(Boolean);
    const result = {
      encodingUsed: encoding,
      headers,
      rows: parsed.data || [],
      parseErrors: parsed.errors || []
    };

    if (!fallbackResult) {
      fallbackResult = result;
    }

    if (headers.length > 0) {
      return result;
    }
  }

  return fallbackResult || {
    encodingUsed: 'utf8',
    headers: [],
    rows: [],
    parseErrors: []
  };
}

module.exports = { parseCsvBuffer };
