import { FileSpreadsheet, RefreshCw, Upload } from 'lucide-react';

import ExportMenu from './ExportMenu';
import ThemeToggle from './ThemeToggle';

function AppHeader({
  theme,
  onToggleTheme,
  onUploadClick,
  onDownloadSample,
  onClear,
  hasReport,
  report,
  stats,
  sourceFile,
  processedAt
}) {
  return (
    <header className="glass-panel grid-panel sticky top-4 z-30 mb-6 overflow-hidden px-5 py-5 sm:px-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-mint-500/12 via-sky-500/8 to-copper-500/10" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Crypto Trade Tax Analyzer
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              Upload spot exchange CSV files, match buys and sells with FIFO logic, calculate taxes and deductions,
              inspect open holdings, and review a polished analytics workspace built for serious spot traders.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="ambient-surface rounded-[22px] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Valid Trades</p>
              <p className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">{stats?.validTrades || 0}</p>
            </div>
            <div className="ambient-surface rounded-[22px] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Realized</p>
              <p className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">{stats?.realizedTradesCount || 0}</p>
            </div>
            <div className="ambient-surface rounded-[22px] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Open Holdings</p>
              <p className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">{stats?.openPositionsCount || 0}</p>
            </div>
            {(sourceFile || processedAt) ? (
              <div className="ambient-surface rounded-[22px] border-mint-500/20 bg-gradient-to-r from-mint-500/10 to-sky-500/8 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                {sourceFile ? <p className="font-semibold">Source: {sourceFile}</p> : null}
                {processedAt ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Processed: {processedAt}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <button
            type="button"
            onClick={onDownloadSample}
            className="ambient-pill inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-copper-500 hover:text-slate-900 dark:text-slate-200 dark:hover:border-copper-300"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Sample CSV
          </button>

          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800 dark:bg-mint-500 dark:text-slate-900 dark:hover:bg-mint-300"
          >
            <Upload className="h-4 w-4" />
            Upload CSV
          </button>

          <ExportMenu report={report} sourceFile={sourceFile} processedAt={processedAt} />

          {hasReport ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-coral-300 bg-coral-100 px-4 py-2.5 text-sm font-semibold text-coral-700 transition hover:bg-coral-200 dark:border-coral-500/40 dark:bg-coral-500/10 dark:text-coral-200 dark:hover:bg-coral-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              Clear
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
