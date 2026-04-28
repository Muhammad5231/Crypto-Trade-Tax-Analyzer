function MobileBottomNav({ tabs, activeTab, onChange }) {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.95rem)] pt-3 lg:hidden">
      <div className="pointer-events-auto mx-auto max-w-lg">
        <div className="glass-panel relative overflow-hidden rounded-[30px] px-2 py-2 shadow-panel">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-mint-400/60 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-950/10 to-transparent dark:from-slate-950/30" />
          <div className="flex items-center justify-between gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChange(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[22px] px-3 py-3 text-[11.5px] font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-soft dark:bg-mint-500 dark:text-slate-900'
                      : 'text-slate-500 hover:bg-white/50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`absolute inset-x-5 top-0 h-0.5 rounded-full transition ${
                      isActive ? 'bg-mint-400 dark:bg-slate-900' : 'bg-transparent'
                    }`}
                  />
                  <Icon className={`h-[19px] w-[19px] transition ${isActive ? 'scale-105' : ''}`} />
                  <span className="leading-none">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default MobileBottomNav;
