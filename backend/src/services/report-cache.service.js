const { randomUUID } = require('crypto');

const { AppError } = require('../utils/app-error');

const REPORT_CACHE_LIMIT = 24;
const REPORT_CACHE_TTL_MS = 1000 * 60 * 60 * 4;

const reportCache = new Map();

function cloneReport(report) {
  if (typeof structuredClone === 'function') {
    return structuredClone(report);
  }

  return JSON.parse(JSON.stringify(report));
}

function touchEntry(reportId, entry) {
  entry.accessedAt = Date.now();
  reportCache.delete(reportId);
  reportCache.set(reportId, entry);
}

function pruneExpiredEntries() {
  const now = Date.now();

  for (const [reportId, entry] of reportCache.entries()) {
    if (now - entry.accessedAt > REPORT_CACHE_TTL_MS) {
      reportCache.delete(reportId);
    }
  }
}

function pruneOverflow() {
  while (reportCache.size > REPORT_CACHE_LIMIT) {
    const oldestKey = reportCache.keys().next().value;
    reportCache.delete(oldestKey);
  }
}

function validateReportId(reportId) {
  const normalizedReportId = String(reportId || '').trim();

  if (!normalizedReportId) {
    throw new AppError('A report ID is required for export.', 400);
  }

  return normalizedReportId;
}

function storeProcessedReport(report) {
  if (!report || typeof report !== 'object' || !report.summary || !report.meta) {
    throw new AppError('A processed report payload is required for caching.', 400);
  }

  pruneExpiredEntries();

  const reportId = report.meta.reportId || randomUUID();
  const cachedReport = cloneReport({
    ...report,
    meta: {
      ...report.meta,
      reportId
    }
  });

  reportCache.set(reportId, {
    report: cachedReport,
    exports: new Map(),
    createdAt: Date.now(),
    accessedAt: Date.now()
  });

  pruneOverflow();

  return cloneReport(cachedReport);
}

function getCacheEntry(reportId) {
  pruneExpiredEntries();

  const normalizedReportId = validateReportId(reportId);
  const entry = reportCache.get(normalizedReportId);

  if (!entry) {
    throw new AppError(
      'This report is no longer available for export. Please re-upload the CSV to generate a fresh session.',
      404
    );
  }

  touchEntry(normalizedReportId, entry);
  return {
    reportId: normalizedReportId,
    entry
  };
}

function getCachedReport(reportId) {
  const { entry } = getCacheEntry(reportId);
  return cloneReport(entry.report);
}

function getCachedExportBuffer(reportId, format) {
  const { entry } = getCacheEntry(reportId);
  const buffer = entry.exports.get(format);

  return buffer ? Buffer.from(buffer) : null;
}

function storeCachedExportBuffer(reportId, format, buffer) {
  const { entry } = getCacheEntry(reportId);
  entry.exports.set(format, Buffer.from(buffer));
}

module.exports = {
  getCachedExportBuffer,
  getCachedReport,
  storeCachedExportBuffer,
  storeProcessedReport
};
