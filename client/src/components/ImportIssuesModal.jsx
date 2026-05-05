import { AlertTriangle, FileWarning, X } from 'lucide-react';

function IssueRow({ issue }) {
  const toneClass =
    issue.severity === 'warning'
      ? 'border-copper-500/20 bg-copper-500/10 text-copper-900 dark:text-copper-100'
      : 'border-coral-500/20 bg-coral-500/10 text-slate-900 dark:text-white';

  return (
    <article className={`rounded-[22px] border p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{issue.message}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs opacity-90">
            {issue.row ? <span className="rounded-full bg-black/5 px-2.5 py-1 dark:bg-white/10">Row {issue.row}</span> : null}
            {issue.column ? (
              <span className="rounded-full bg-black/5 px-2.5 py-1 dark:bg-white/10">Column {issue.column}</span>
            ) : null}
            {issue.code ? <span className="rounded-full bg-black/5 px-2.5 py-1 dark:bg-white/10">{issue.code}</span> : null}
          </div>
        </div>
      </div>
      {issue.value ? (
        <div className="mt-3 rounded-2xl bg-black/5 px-3 py-2 text-xs text-slate-700 dark:bg-white/10 dark:text-slate-200">
          {issue.value}
        </div>
      ) : null}
    </article>
  );
}

function ImportIssuesModal({ open, title, message, issues = [], onClose }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
      <button type="button" aria-label="Close import issues dialog" onClick={onClose} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />

      <section className="relative flex w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,17,29,0.985),rgba(8,20,37,0.975))] text-white shadow-[0_32px_110px_rgba(2,6,23,0.5)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-coral-500/18 via-copper-500/12 to-violet-500/8" />

        <div className="relative flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral-500/12 text-coral-200">
              <FileWarning className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral-200">Import issues</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">{title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{message}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="mb-4 flex items-start gap-3 rounded-[24px] border border-copper-500/20 bg-copper-500/10 p-4 text-copper-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm leading-6">
              The upload was blocked because the CSV contained issues that could change FIFO ordering, validation reliability, or trade calculations.
            </p>
          </div>

          <div className="space-y-3">
            {issues.map((issue, index) => (
              <IssueRow key={`${issue.code || 'issue'}-${issue.row || index}-${index}`} issue={issue} />
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-[20px] bg-mint-500 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-mint-300"
          >
            Close and review file
          </button>
        </div>
      </section>
    </div>
  );
}

export default ImportIssuesModal;
