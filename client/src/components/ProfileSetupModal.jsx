import { Building2, CirclePercent, ShieldCheck, UserRound, X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

function FieldShell({ label, icon: Icon, children }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="inline-flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </span>
      {children}
    </label>
  );
}

function ProfileSetupModal({
  open,
  canDismiss = false,
  profileDraft,
  onProfileDraftChange,
  onSave,
  onClose
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && canDismiss) {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canDismiss, onClose, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close profile setup"
        onClick={() => {
          if (canDismiss) {
            onClose();
          }
        }}
        className="absolute inset-0 bg-slate-950/72 backdrop-blur-md"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-setup-title"
        className="glass-panel relative flex max-h-[88vh] w-full max-w-[28rem] flex-col overflow-hidden rounded-[28px] p-4 shadow-[0_26px_90px_rgba(2,6,23,0.34)] sm:max-h-[calc(100vh-3rem)] sm:max-w-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-mint-500/14 via-sky-500/10 to-violet-500/10" />

        <div className="relative flex-1 overflow-y-auto pr-1 scrollbar-thin">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-mint-500/20 bg-mint-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-mint-700 dark:text-mint-200 sm:text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Spot Trader Setup</span>
              </div>
              <h2 id="profile-setup-title" className="mt-3 font-display text-[1.75rem] font-bold leading-[1.02] tracking-tight text-slate-900 dark:text-white sm:mt-4 sm:text-3xl">
                Save your exchange fee profile
              </h2>
              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Tell the workspace who is reviewing the report, which spot exchange is being used, and how that platform charges
                buy-side and sell-side trading fees. Set a side to <span className="font-semibold">0</span> if the exchange does not
                charge it.
              </p>
            </div>

            {canDismiss ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white sm:h-11 sm:w-11"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 sm:mt-6 sm:grid-cols-2">
            <FieldShell label="User name" icon={UserRound}>
              <input
                type="text"
                value={profileDraft.userName}
                onChange={(event) => onProfileDraftChange('userName', event.target.value)}
                className="ambient-input w-full rounded-2xl px-4 py-3 text-slate-900 outline-none transition focus:border-mint-500 dark:text-white"
                placeholder="e.g. Muhammad"
              />
            </FieldShell>

            <FieldShell label="Exchange name" icon={Building2}>
              <input
                type="text"
                value={profileDraft.exchangeName}
                onChange={(event) => onProfileDraftChange('exchangeName', event.target.value)}
                className="ambient-input w-full rounded-2xl px-4 py-3 text-slate-900 outline-none transition focus:border-mint-500 dark:text-white"
                placeholder="e.g. Binance, Delta, CoinDCX"
              />
            </FieldShell>

            <FieldShell label="Buy fee (%)" icon={CirclePercent}>
              <input
                type="number"
                min="0"
                step="0.001"
                value={profileDraft.buyFeePercent}
                onChange={(event) => onProfileDraftChange('buyFeePercent', event.target.value)}
                className="ambient-input w-full rounded-2xl px-4 py-3 text-slate-900 outline-none transition focus:border-mint-500 dark:text-white"
                placeholder="0"
              />
            </FieldShell>

            <FieldShell label="Sell fee (%)" icon={CirclePercent}>
              <input
                type="number"
                min="0"
                step="0.001"
                value={profileDraft.sellFeePercent}
                onChange={(event) => onProfileDraftChange('sellFeePercent', event.target.value)}
                className="ambient-input w-full rounded-2xl px-4 py-3 text-slate-900 outline-none transition focus:border-mint-500 dark:text-white"
                placeholder="0.1"
              />
            </FieldShell>
          </div>

          <div className="mt-4 rounded-[24px] border border-sky-500/15 bg-sky-500/8 px-4 py-4 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:mt-6">
            This profile is stored locally in the browser and reused for future uploads. Updating buy or sell fee values will change
            FIFO fee calculations, GST on fees, final net profit, and open-holding invested capital.
          </div>
        </div>

        <div className="relative mt-4 flex shrink-0 flex-col gap-3 border-t border-slate-200/80 pt-4 dark:border-white/10 sm:mt-5 sm:flex-row sm:items-center sm:justify-end">
          {canDismiss ? (
            <button
              type="button"
              onClick={onClose}
              className="ambient-pill min-h-[3.1rem] rounded-full px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:text-slate-200"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            className="inline-flex min-h-[3.1rem] items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-mint-500 dark:text-slate-900 dark:hover:bg-mint-300"
          >
            Save profile
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

export default ProfileSetupModal;
