function MetricCard({ label, value, helper, tone = 'neutral' }) {
  const toneClasses = {
    positive:
      'border-mint-500/20 bg-gradient-to-br from-mint-500/12 via-white/80 to-sky-500/5 text-mint-700 dark:from-mint-500/18 dark:via-white/6 dark:to-sky-500/10 dark:text-mint-300',
    negative:
      'border-coral-500/20 bg-gradient-to-br from-coral-500/12 via-white/80 to-amber-500/5 text-coral-700 dark:from-coral-500/18 dark:via-white/6 dark:to-amber-500/10 dark:text-coral-300',
    neutral:
      'border-white/50 bg-gradient-to-br from-white/85 via-white/70 to-slate-100/90 text-slate-700 dark:border-white/10 dark:from-white/10 dark:via-white/6 dark:to-slate-900/80 dark:text-slate-200',
    accent:
      'border-copper-500/20 bg-gradient-to-br from-copper-500/12 via-white/80 to-mint-500/5 text-copper-700 dark:from-copper-500/18 dark:via-white/6 dark:to-mint-500/10 dark:text-copper-300'
  };

  return (
    <div className={`relative overflow-hidden rounded-[26px] border p-5 shadow-soft ${toneClasses[tone]}`}>
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-white/40 blur-3xl dark:bg-white/5" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 font-display text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p> : null}
    </div>
  );
}

export default MetricCard;
