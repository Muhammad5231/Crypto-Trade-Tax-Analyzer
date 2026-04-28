import {
  FileSpreadsheet,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { exportReportCsv } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const CSV_EXPORT_MODE = {
  title: 'CSV export',
  description: 'One spreadsheet-ready file with summary totals, realized spot trades, and current open holdings.',
  buttonLabel: 'Download CSV',
  includes: ['Summary totals', 'Realized spot trades', 'Open holdings']
};

function ExportSummaryStat({ label, value, helper }) {
  return (
    <div className="rounded-[20px] border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 break-words font-display text-lg font-bold text-slate-900 dark:text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</p> : null}
    </div>
  );
}

function ExportActionCard({ loading = false, disabled = false, onClick }) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.045] dark:shadow-none">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-100">
        <FileSpreadsheet className="h-5 w-5" />
      </div>

      <h3 className="mt-4 font-display text-2xl font-bold text-slate-900 dark:text-white">{CSV_EXPORT_MODE.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{CSV_EXPORT_MODE.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CSV_EXPORT_MODE.includes.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
          >
            {item}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
          disabled || loading
            ? 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-500'
            : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-mint-500 dark:text-slate-900 dark:hover:bg-mint-300'
        }`}
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        <span>{loading ? 'Preparing...' : CSV_EXPORT_MODE.buttonLabel}</span>
      </button>
    </div>
  );
}

function ExportMenu({ report, sourceFile, processedAt, compact = false, buttonLabel = 'Export CSV', iconOnly = false }) {
  const [open, setOpen] = useState(false);
  const [activeExport, setActiveExport] = useState(false);
  const [status, setStatus] = useState(null);
  const hasReport = Boolean(report?.summary && report?.meta);
  const summary = report?.summary || {};
  const meta = report?.meta || {};
  const tradeCount = meta.realizedTradesCount || report?.realizedTrades?.length || 0;
  const holdingsCount = meta.openPositionsCount || report?.openPositions?.length || 0;
  const sourceLabel = sourceFile || meta.sourceFile || 'No file loaded';
  const processedLabel = processedAt || meta.processedAt || 'Waiting for processing';

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setActiveExport(false);
      setStatus(null);
    }
  }, [open]);

  async function handleExport() {
    if (!hasReport || activeExport) {
      return;
    }

    setActiveExport(true);
    setStatus(null);

    try {
      await exportReportCsv(report);
      setStatus({
        tone: 'success',
        message: 'CSV export downloaded successfully.'
      });
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error.message || 'Export failed. Please try again.'
      });
    } finally {
      setActiveExport(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((currentValue) => !currentValue)}
        className={`ambient-pill inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-copper-500 hover:text-slate-900 dark:text-slate-200 dark:hover:border-copper-300 ${
          iconOnly ? 'h-11 w-11 rounded-[18px] px-0 py-0' : ''
        }`}
      >
        <FileSpreadsheet className={iconOnly ? 'h-[18px] w-[18px]' : 'h-4 w-4'} />
        {iconOnly ? null : <span>{buttonLabel}</span>}
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] sm:items-center sm:p-6">
              <button
                type="button"
                aria-label="Close export dialog"
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-slate-950/68 backdrop-blur-md"
              />

              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="export-dialog-title"
                className={`relative flex w-full max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.985),rgba(244,248,252,0.97))] text-slate-900 shadow-[0_30px_100px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(7,17,29,0.985),rgba(8,20,37,0.975))] dark:text-white dark:shadow-[0_32px_110px_rgba(2,6,23,0.5)] ${
                  compact ? 'sm:max-w-[760px]' : 'sm:max-w-[820px]'
                } rounded-[32px]`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-mint-500/14 via-sky-500/8 to-violet-500/8 dark:from-mint-500/18 dark:via-sky-500/10 dark:to-violet-500/10" />

                <div className="relative flex min-h-0 flex-1 flex-col">
                  <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300/80 dark:bg-white/12 sm:hidden" />

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-6">
                    <div className="rounded-[28px] border border-slate-200/80 bg-white/82 p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.045] dark:shadow-none sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-mint-500/20 bg-mint-500/12 text-mint-700 dark:text-mint-100">
                              <Sparkles className="h-[18px] w-[18px]" />
                            </div>
                            <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-mint-200">
                              CSV Export
                            </span>
                          </div>

                          <h2 id="export-dialog-title" className="mt-5 font-display text-[2rem] font-bold leading-[1] tracking-tight sm:text-[2.3rem]">
                            Download your current session as CSV
                          </h2>
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Keep the export simple: one clean file for spreadsheet review, sharing, and audit-friendly handoff.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <ExportSummaryStat label="Source" value={sourceLabel} helper={processedLabel} />
                        <ExportSummaryStat
                          label="Final Net"
                          value={hasReport ? formatCurrency(summary.finalNetProfit || 0) : 'Not ready'}
                          helper={hasReport ? `${tradeCount} realized trades` : 'Upload a CSV first'}
                        />
                        <ExportSummaryStat
                          label="CSV Scope"
                          value={hasReport ? 'Realized + Open' : 'Locked'}
                          helper={hasReport ? `${holdingsCount} open holdings included` : 'No report available'}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <ExportActionCard disabled={!hasReport} loading={activeExport} onClick={handleExport} />
                    </div>

                    <div className="mt-4 rounded-[24px] border border-slate-200/80 bg-white/80 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/12 text-sky-700 dark:text-sky-100">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">Export note</p>
                          <p className="mt-1">
                            CSV is the only export format now. Charts and visual analysis stay inside the live dashboard, while the download focuses on clean spot-trade data.
                          </p>
                        </div>
                      </div>
                    </div>

                    {status ? (
                      <div
                        className={`mt-4 rounded-[22px] px-4 py-4 text-sm leading-6 ${
                          status.tone === 'success'
                            ? 'border border-mint-500/20 bg-mint-500/10 text-mint-800 dark:text-mint-100'
                            : 'border border-coral-500/20 bg-coral-500/10 text-coral-800 dark:text-coral-100'
                        }`}
                      >
                        {status.message}
                      </div>
                    ) : null}

                    {!hasReport ? (
                      <div className="mt-4 rounded-[22px] border border-copper-400/20 bg-copper-500/10 px-4 py-4 text-sm leading-6 text-copper-800 dark:text-copper-100">
                        Process a CSV report first. Export buttons will unlock automatically once session data is available.
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#07111d]/90 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {hasReport ? 'CSV export uses the current processed session data.' : 'No processed session available yet.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-mint-500 dark:text-slate-900 dark:hover:bg-mint-300"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export default ExportMenu;
