import { ArrowUpFromLine, DatabaseZap } from 'lucide-react';

function EmptyState({ onUploadClick, onDownloadSample }) {
  return (
    <div className="glass-panel grid-panel flex flex-col items-center justify-center rounded-[32px] px-8 py-16 text-center">
      <div className="rounded-[28px] bg-gradient-to-br from-slate-900 via-[#10243a] to-slate-900 p-5 text-white shadow-soft dark:from-mint-500 dark:via-mint-400 dark:to-sky-300 dark:text-slate-900">
        <DatabaseZap className="h-10 w-10" />
      </div>
      <h2 className="mt-6 font-display text-3xl font-bold text-slate-900 dark:text-white">
        Your dashboard will appear here
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
        Start with a CSV export from your exchange. The app will validate the file, match trades using FIFO, calculate
        deductions and taxes, then build a full analytics dashboard with polished insights, tables, and chart views.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onUploadClick}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-mint-500 dark:text-slate-900 dark:hover:bg-mint-300"
        >
          <ArrowUpFromLine className="h-4 w-4" />
          Upload first CSV
        </button>
        <button
          type="button"
          onClick={onDownloadSample}
          className="rounded-full border border-slate-300/70 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-copper-500 hover:text-slate-900 dark:border-white/10 dark:text-slate-200"
        >
          Inspect sample format
        </button>
      </div>
    </div>
  );
}

export default EmptyState;
