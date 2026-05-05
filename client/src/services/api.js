import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

function getFilenameFromDisposition(contentDisposition, fallbackName) {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallbackName;
}

function createDownloadBlob(data, contentType) {
  if (data instanceof Blob) {
    if (!contentType || data.type === contentType) {
      return data;
    }

    return new Blob([data], { type: contentType });
  }

  if (data instanceof ArrayBuffer) {
    return new Blob([new Uint8Array(data)], { type: contentType });
  }

  if (ArrayBuffer.isView(data)) {
    return new Blob([data], { type: contentType });
  }

  return new Blob([data], { type: contentType });
}

function ensureReportId(reportId) {
  const normalizedReportId = String(reportId || '').trim();

  if (!normalizedReportId) {
    throw new Error('This session is not ready for export yet. Please process the CSV again to generate a fresh report.');
  }

  return normalizedReportId;
}

function getBinaryLength(data) {
  if (!data) {
    return 0;
  }

  if (data instanceof Blob) {
    return data.size;
  }

  if (data instanceof ArrayBuffer) {
    return data.byteLength;
  }

  if (ArrayBuffer.isView(data)) {
    return data.byteLength;
  }

  if (typeof data === 'string') {
    return data.length;
  }

  return 0;
}

function triggerBlobDownload(blob, fileName) {
  if (!blob || blob.size === 0) {
    throw new Error('The exported file was empty.');
  }

  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    window.setTimeout(() => {
      link.remove();
    }, 0);
  }

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 60000);
}

function decodeTextPayload(payload) {
  if (payload instanceof ArrayBuffer) {
    return new TextDecoder().decode(payload);
  }

  if (ArrayBuffer.isView(payload)) {
    return new TextDecoder().decode(payload);
  }

  if (payload instanceof Blob) {
    return payload.text();
  }

  return String(payload || '');
}

async function extractBlobErrorMessage(error, fallbackMessage) {
  const maybeBlob = error?.response?.data;

  if (maybeBlob instanceof Blob) {
    try {
      const text = await maybeBlob.text();
      const payload = JSON.parse(text);
      return payload?.message || fallbackMessage;
    } catch (_parseError) {
      return fallbackMessage;
    }
  }

  if (maybeBlob instanceof ArrayBuffer) {
    try {
      const text = new TextDecoder().decode(maybeBlob);
      const payload = JSON.parse(text);
      return payload?.message || fallbackMessage;
    } catch (_parseError) {
      return fallbackMessage;
    }
  }

  return error?.response?.data?.message || error?.message || fallbackMessage;
}

async function readBlobText(blob) {
  if (!(blob instanceof Blob)) {
    return '';
  }

  return blob.text();
}

async function requestBlobExportWithFetch(endpoint, fallbackName, fallbackContentType, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    cache: 'no-store',
    headers: {
      Accept: fallbackContentType,
      ...(options.headers || {})
    },
    body: options.body
  });

  const blob = await response.blob();

  if (!response.ok) {
    const text = await readBlobText(blob);
    try {
      const payload = JSON.parse(text);
      throw new Error(payload?.message || `Unable to export ${fallbackName}.`);
    } catch (_parseError) {
      throw new Error(text || `Unable to export ${fallbackName}.`);
    }
  }

  return {
    data: blob,
    fileName: getFilenameFromDisposition(response.headers.get('content-disposition'), fallbackName),
    contentType: response.headers.get('content-type') || fallbackContentType,
    contentLength: Number(response.headers.get('content-length') || 0)
  };
}

async function downloadBinaryExport(endpoint, fallbackName, fallbackContentType, options = {}) {
  const exportResult = await requestBlobExportWithFetch(endpoint, fallbackName, fallbackContentType, options);
  const blob = createDownloadBlob(exportResult.data, exportResult.contentType || fallbackContentType);
  const binaryLength = getBinaryLength(exportResult.data);

  if (binaryLength === 0 || blob.size === 0) {
    throw new Error('The exported file was empty.');
  }

  if (exportResult.contentLength > 0 && blob.size === 0) {
    throw new Error('The exported file response was incomplete.');
  }

  triggerBlobDownload(blob, exportResult.fileName);
  return exportResult.fileName;
}

export function getSampleCsvUrl() {
  return `${API_BASE_URL}/sample-format`;
}

export async function processTradeFile(file, profile = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userName', profile.userName ?? '');
  formData.append('exchangeName', profile.exchangeName ?? '');
  formData.append('buyFeePercent', profile.buyFeePercent ?? '0');
  formData.append('sellFeePercent', profile.sellFeePercent ?? '0');

  try {
    const response = await api.post('/upload/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.data;
  } catch (error) {
    const payload = error?.response?.data;
    const enhancedError = new Error(payload?.message || error.message || 'Unable to process the uploaded file.');

    enhancedError.statusCode = error?.response?.status || null;
    enhancedError.details = payload?.details || null;
    enhancedError.issues = Array.isArray(payload?.issues) ? payload.issues : payload?.details?.issues || [];

    throw enhancedError;
  }
}

export async function exportReportCsv(report) {
  try {
    const reportId = ensureReportId(report?.meta?.reportId);
    return await downloadBinaryExport(`/export/csv/${encodeURIComponent(reportId)}`, 'crypto-trade-tax-analyzer-spot-report.csv', 'text/csv;charset=utf-8');
  } catch (error) {
    throw new Error(await extractBlobErrorMessage(error, 'Unable to export the CSV report.'));
  }
}

export async function exportTaxReportPdf(report) {
  try {
    const reportId = ensureReportId(report?.meta?.reportId);
    return await downloadBinaryExport(`/export/pdf/${encodeURIComponent(reportId)}`, 'crypto-trade-tax-analyzer-spot-report.pdf', 'application/pdf');
  } catch (error) {
    throw new Error(await extractBlobErrorMessage(error, 'Unable to generate the PDF tax report.'));
  }
}
