import { FileWarning, UploadCloud } from 'lucide-react';
import { useState } from 'react';

function UploadDropzone({
  inputRef,
  onFileSelected,
  onDownloadSample,
  onOpenProfile,
  onRecalculate,
  isProcessing,
  currentFileName,
  stats,
  profile
}) {
  const [isDragging, setIsDragging] = useState(false);

  function handleIncomingFiles(fileList) {
    const [file] = [...fileList];

    if (file) {
      onFileSelected(file);
    }
  }

  return (
    <section id="upload-panel" className="glass-panel overflow-hidden p-5 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => !isProcessing && inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            if (!isProcessing) {
              handleIncomingFiles(event.dataTransfer.files);
            }
          }}
          className={`relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[28px] border border-dashed p-8 text-center transition duration-300 ${
            isDragging
              ? 'border-mint-500 bg-mint-500/10 shadow-[0_22px_60px_rgba(16,185,129,0.14)] dark:bg-mint-500/[0.08] dark:shadow-[0_28px_70px_rgba(16,185,129,0.14)]'
              : 'ambient-surface border-slate-200/80 hover:border-mint-500 hover:shadow-[0_22px_60px_rgba(16,185,129,0.10)] dark:hover:border-mint-300 dark:hover:shadow-[0_28px_70px_rgba(8,189,155,0.12)]'
          } ${isProcessing ? 'pointer-events-none opacity-75' : ''}`}
        >
          <div className="pointer-events-none absolute inset-x-10 top-0 h-32 rounded-full bg-mint-500/10 blur-3xl" />
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-mint-500 dark:text-slate-900">
            <UploadCloud className="h-8 w-8" />
          </div>

          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Drop your CSV here</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Supported columns: <span className="font-semibold">Time, Contract, Qty, Side, Exec.Price</span>. Use your
            spot trade export, and extra fields like fees or order value will be accepted safely too.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
              Select CSV
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDownloadSample();
              }}
              className="rounded-full border border-slate-300/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-copper-500 hover:text-slate-900 dark:border-white/10 dark:text-slate-200"
            >
              Download sample
            </button>
          </div>

          {currentFileName ? (
            <div className="mt-5 rounded-full bg-mint-500/10 px-4 py-2 text-sm font-semibold text-mint-700 dark:text-mint-300">
              Current file: {currentFileName}
            </div>
          ) : null}

          {isProcessing ? (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-copper-500/10 px-4 py-2 text-sm font-semibold text-copper-700 dark:text-copper-300">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-current" />
              Processing trades and building analytics...
            </div>
          ) : null}
        </div>

        <div className="grid gap-4">
          <div className="ambient-surface rounded-[28px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Trading Profile
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="ambient-surface-soft min-w-[11rem] flex-1 rounded-2xl px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Trader</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">{profile.userName || 'Not set'}</p>
              </div>
              <div className="ambient-surface-soft min-w-[11rem] flex-1 rounded-2xl px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Exchange</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">{profile.exchangeName || 'Not set'}</p>
              </div>
              <div className="ambient-surface-soft rounded-2xl px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Buy Fee</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">{profile.buyFeePercent}%</p>
              </div>
              <div className="ambient-surface-soft rounded-2xl px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Sell Fee</p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">{profile.sellFeePercent}%</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              This saved profile powers fee-aware FIFO calculations for every processed spot-trading session.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onOpenProfile}
                className="rounded-full border border-slate-300/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-mint-500 hover:text-slate-900 dark:border-white/10 dark:text-slate-200"
              >
                Edit profile
              </button>
              {onRecalculate ? (
                <button
                  type="button"
                  onClick={onRecalculate}
                  disabled={isProcessing}
                  className="rounded-full border border-slate-300/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-mint-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-200"
                >
                  Recalculate current file
                </button>
              ) : null}
            </div>
          </div>

          <div className="ambient-surface-strong relative overflow-hidden rounded-[28px] border-sky-100/80 px-5 py-5 text-slate-800 dark:border-white/10 dark:text-white">
            <div className="pointer-events-none absolute -right-10 top-2 h-24 w-24 rounded-full bg-sky-500/8 blur-3xl dark:bg-sky-500/8" />
            <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-mint-500/8 blur-3xl dark:bg-mint-500/7" />

            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Processing Flow
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <p>1. Validate CSV structure and safely skip malformed rows.</p>
              <p>2. Parse timestamps, quantities, and prices with finance-safe handling.</p>
              <p>3. Match spot buys and sells using FIFO for realized P&amp;L.</p>
              <p>4. Apply saved exchange fees, GST on fees, TDS, and base spot-tax deductions.</p>
            </div>
          </div>
          </div>

          <div className="ambient-surface rounded-[28px] p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-copper-500/12 p-3 text-copper-600 dark:text-copper-300">
                <FileWarning className="h-5 w-5" />
              </div>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">Best results with spot exchange export CSVs</p>
                <p>Use standard spot trade history files with one executed order per row and timestamps in chronological order.</p>
                <p>Large files are supported with sticky tables, pagination, and analytics summaries.</p>
                <p>2026 India tax note: surcharge, cess, thresholds, and trader-specific treatment should still be reviewed professionally.</p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div className="ambient-surface-soft rounded-2xl p-4">
                <dt className="text-slate-500 dark:text-slate-400">Valid rows</dt>
                <dd className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{stats?.validTrades || 0}</dd>
              </div>
              <div className="ambient-surface-soft rounded-2xl p-4">
                <dt className="text-slate-500 dark:text-slate-400">Warnings</dt>
                <dd className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{stats?.warningCount || 0}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UploadDropzone;
