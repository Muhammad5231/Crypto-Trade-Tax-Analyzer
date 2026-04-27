function StatusBanner({ tone = 'warning', title, description, items = [] }) {
  const toneClasses = {
    warning: 'border-copper-500/30 bg-copper-500/10 text-copper-800 dark:text-copper-100',
    error: 'border-coral-500/30 bg-coral-500/10 text-coral-800 dark:text-coral-100',
    info: 'ambient-surface text-slate-700 dark:text-slate-200'
  };

  return (
    <div className={`rounded-[24px] border p-5 backdrop-blur-xl ${toneClasses[tone]}`}>
      <h3 className="text-base font-bold">{title}</h3>
      {description ? <p className="mt-2 text-sm leading-6 opacity-90">{description}</p> : null}
      {items.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-6">
          {items.map((item) => (
            <li key={item} className="ambient-surface-soft rounded-2xl px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default StatusBanner;
