function SectionCard({ title, description, actions, children, compact = false, className = '' }) {
  return (
    <section className={`glass-panel overflow-hidden ${className}`}>
      <div
        className={`relative flex flex-col gap-4 border-b border-slate-200/70 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between ${
          compact ? 'px-4 py-4' : 'px-5 py-5 sm:px-6'
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-mint-500/8 via-transparent to-sky-500/8" />
        <div>
          <h2 className={`font-display font-bold text-slate-900 dark:text-white ${compact ? 'text-xl' : 'text-2xl'}`}>{title}</h2>
          {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      <div className={compact ? 'p-4' : 'p-5 sm:p-6'}>{children}</div>
    </section>
  );
}

export default SectionCard;
