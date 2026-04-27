function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-[24px] border px-4 py-3 shadow-soft backdrop-blur-xl ${
            toast.tone === 'error'
              ? 'border-coral-500/30 bg-coral-500/95 text-white'
              : toast.tone === 'warning'
              ? 'border-copper-500/30 bg-copper-500/95 text-slate-900'
              : 'border-mint-500/30 bg-mint-500/95 text-slate-900'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold">{toast.title}</p>
              {toast.description ? <p className="mt-1 text-sm opacity-90">{toast.description}</p> : null}
            </div>
            <button type="button" onClick={() => onDismiss(toast.id)} className="text-sm font-bold opacity-70">
              X
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ToastStack;
