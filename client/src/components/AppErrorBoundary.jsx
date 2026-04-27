import { Component } from 'react';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('App render failed:', error);
  }

  handleReset = () => {
    try {
      window.localStorage.removeItem('crypto-tax-last-report');
      window.localStorage.removeItem('crypto-tax-mobile-tab');
    } catch {
      // Ignore storage cleanup issues.
    }

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel mx-auto my-8 flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
          <div className="ambient-pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-coral-700 dark:text-coral-200">
            Workspace Recovery
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold text-slate-900 dark:text-white">The dashboard hit a render issue</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            A saved workspace or recent UI state caused the app to stop rendering safely. Resetting the local workspace will
            bring the dashboard back without touching your source files.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-mint-500 dark:text-slate-900 dark:hover:bg-mint-300"
          >
            Reset local workspace
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
