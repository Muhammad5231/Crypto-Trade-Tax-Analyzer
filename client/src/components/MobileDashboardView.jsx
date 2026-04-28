import { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  BarChart3,
  CircleAlert,
  FileSpreadsheet,
  LayoutDashboard,
  MoonStar,
  PencilLine,
  ShieldCheck,
  SunMedium,
  TrendingUp,
  Trash2,
  Upload,
  WalletCards
} from 'lucide-react';

import AnalyticsPanel from './AnalyticsPanel';
import CalculationGuideSection from './CalculationGuideSection';
import ExportMenu from './ExportMenu';
import FilterBar from './FilterBar';
import MobileBottomNav from './MobileBottomNav';
import SkeletonGrid from './SkeletonGrid';
import StatusBanner from './StatusBanner';
import { formatCurrency, formatDateTime, formatQuantity } from '../utils/formatters';

const MOBILE_TABS = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'trades', label: 'Trades', icon: ArrowRightLeft },
  { id: 'holdings', label: 'Holdings', icon: WalletCards },
  { id: 'analytics', label: 'Insights', icon: BarChart3 }
];

function MobilePrimaryAction({ children, icon: Icon, onClick, tone = 'dark', className = '' }) {
  const toneClass =
    tone === 'light'
      ? 'bg-white text-slate-900 shadow-soft hover:bg-slate-100'
      : 'bg-slate-900 text-white shadow-soft hover:bg-slate-800 dark:bg-mint-500 dark:text-slate-900 dark:hover:bg-mint-300';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-[20px] px-4 py-3 text-sm font-semibold transition ${toneClass} ${className}`}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
    </button>
  );
}

function MobileIconAction({ icon: Icon, onClick, label, tone = 'neutral', inverted = false }) {
  const toneClass =
    tone === 'danger'
      ? inverted
        ? 'border-coral-500/20 text-coral-200 hover:border-coral-400/40 hover:bg-coral-500/10'
        : 'border-coral-500/20 text-coral-700 hover:border-coral-500/40 hover:bg-coral-500/10'
      : inverted
        ? 'border-white/10 text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
        : 'border-slate-300/70 text-slate-700 hover:border-slate-400 hover:bg-white/70 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.08]';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex h-[3.2rem] w-[3.2rem] items-center justify-center rounded-[20px] border transition ${
        inverted ? 'bg-white/[0.04]' : 'bg-white/60 dark:bg-white/[0.04]'
      } ${toneClass}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

function MobileSecondaryAction({ children, icon: Icon, onClick, tone = 'neutral', inverted = false }) {
  const toneClass =
    tone === 'danger'
      ? inverted
        ? 'border-coral-500/20 bg-coral-500/10 text-coral-100 hover:border-coral-400/40 hover:bg-coral-500/[0.14]'
        : 'border-coral-500/20 bg-coral-500/10 text-coral-700 hover:border-coral-500/35 hover:bg-coral-500/[0.14]'
      : inverted
        ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
        : 'border-slate-200/80 bg-white/[0.72] text-slate-700 hover:border-slate-300 hover:bg-white';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[3.15rem] items-center justify-center gap-2 rounded-[20px] border px-4 py-3 text-sm font-semibold transition ${toneClass}`}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
    </button>
  );
}

function MobileInlineChip({ children, icon: Icon, tone = 'neutral', inverted = false }) {
  const toneClasses = inverted
    ? {
        neutral: 'border-white/10 bg-white/[0.08] text-slate-200',
        positive: 'border-mint-400/20 bg-mint-500/[0.12] text-mint-100',
        warning: 'border-copper-400/20 bg-copper-500/[0.14] text-copper-100'
      }
    : {
        neutral: 'border-slate-200/80 bg-white/70 text-slate-700',
        positive: 'border-mint-400/20 bg-mint-500/10 text-mint-700',
        warning: 'border-copper-400/20 bg-copper-500/12 text-copper-700'
      };

  const activeTone = toneClasses[tone] || toneClasses.neutral;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${activeTone}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
}

function MobileHeaderStat({ label, value, helper, valueClassName = 'text-xl', truncateValue = false, inverted = false }) {
  const wrapperClass = inverted
    ? 'ambient-surface-soft min-h-[112px] rounded-[24px] border border-white/[0.08] p-3.5'
    : 'min-h-[112px] rounded-[24px] border border-slate-200/80 bg-white/[0.58] p-3.5 shadow-soft backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.05]';
  const labelClass = inverted
    ? 'text-slate-400'
    : 'text-slate-500 dark:text-slate-400';
  const valueToneClass = inverted
    ? 'text-white'
    : 'text-slate-900 dark:text-white';
  const helperClass = inverted
    ? 'text-slate-300'
    : 'text-slate-600 dark:text-slate-300';

  return (
    <div className={wrapperClass}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${labelClass}`}>{label}</p>
      <p
        className={`mt-2 font-display font-bold ${valueToneClass} ${valueClassName} ${truncateValue ? 'truncate' : ''}`}
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </p>
      {helper ? <p className={`mt-1 text-xs leading-5 ${helperClass}`}>{helper}</p> : null}
    </div>
  );
}

function MobileInfoCard({ title, description, value, tone = 'neutral' }) {
  const toneClasses = {
    positive: 'border-mint-500/20 bg-mint-500/10',
    negative: 'border-coral-500/20 bg-coral-500/10',
    accent: 'border-sky-500/20 bg-sky-500/10',
    neutral: 'ambient-surface'
  };
  const toneDots = {
    positive: 'bg-mint-500',
    negative: 'bg-coral-500',
    accent: 'bg-sky-500',
    neutral: 'bg-slate-400 dark:bg-slate-500'
  };
 
  return (
    <article className={`rounded-[26px] border p-5 backdrop-blur-xl ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${toneDots[tone]}`} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
      </div>
      <p className="mt-3 font-display text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </article>
  );
}

function MobileMetricTile({ label, value, tone = 'neutral', className = '' }) {
  const toneClasses = {
    positive: {
      surface: 'border-mint-500/20 bg-mint-500/10',
      dot: 'bg-mint-500',
      value: 'text-mint-700 dark:text-mint-300'
    },
    negative: {
      surface: 'border-coral-500/20 bg-coral-500/10',
      dot: 'bg-coral-500',
      value: 'text-coral-700 dark:text-coral-300'
    },
    accent: {
      surface: 'border-sky-500/20 bg-sky-500/10',
      dot: 'bg-sky-500',
      value: 'text-sky-700 dark:text-sky-200'
    },
    neutral: {
      surface: 'ambient-surface',
      dot: 'bg-slate-400 dark:bg-slate-500',
      value: 'text-slate-900 dark:text-white'
    }
  };
  const activeTone = toneClasses[tone];

  return (
    <div className={`min-h-[104px] rounded-[24px] border p-4 backdrop-blur-xl ${activeTone.surface} ${className}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${activeTone.dot}`} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      </div>
      <p className={`mt-3 font-display text-lg font-bold ${activeTone.value}`}>{value}</p>
    </div>
  );
}

function MobileSectionCard({ eyebrow, title, description, action, children, className = '' }) {
  return (
    <section className={`glass-panel relative overflow-hidden p-4 ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-mint-500/8 via-transparent to-sky-500/8" />
      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-200/70 pb-3 dark:border-white/10">
          <div>
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{eyebrow}</p>
            ) : null}
            <h2 className="mt-1 font-display text-[1.15rem] font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            {description ? <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p> : null}
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

function MobileDateBlock({ label, value }) {
  const formatted = formatDateTime(value);
  const [datePart, ...rest] = formatted.split(',');
  const timePart = rest.join(',').trim();

  return (
    <div className="ambient-surface-soft rounded-2xl px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{datePart?.trim() || formatted}</p>
      {timePart ? <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{timePart}</p> : null}
    </div>
  );
}

function MobileTradeCard({ trade, showBuyFee = false, showSellFee = false }) {
  return (
    <article className="ambient-surface-strong relative overflow-hidden rounded-[30px] p-4">
      <div className="pointer-events-none absolute -left-8 top-0 h-24 w-24 rounded-full bg-sky-500/8 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-mint-500/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 rounded-full bg-violet-500/6 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold text-slate-900 dark:text-white">{trade.contract}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
              trade.finalNetProfit >= 0
                ? 'bg-mint-500/15 text-mint-700 dark:text-mint-300'
                : 'bg-coral-500/15 text-coral-700 dark:text-coral-300'
            }`}
          >
            {trade.resultLabel}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <MobileDateBlock label="Buy" value={trade.buyDateTime} />
          <MobileDateBlock label="Sell" value={trade.sellDateTime} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="ambient-pill rounded-full px-3 py-1.5 text-slate-600 dark:text-slate-300">
            Holding {trade.holdingDays}d
          </span>
          <span className="ambient-pill rounded-full px-3 py-1.5 text-slate-600 dark:text-slate-300">
            Qty {formatQuantity(trade.matchedQty)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="ambient-surface-soft rounded-2xl p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Final Net</p>
            <p
              className={`mt-1 font-semibold ${
                trade.finalNetProfit >= 0 ? 'text-mint-700 dark:text-mint-300' : 'text-coral-700 dark:text-coral-300'
              }`}
            >
              {formatCurrency(trade.finalNetProfit)}
            </p>
          </div>
          <div className="ambient-surface-soft rounded-2xl p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Gross Profit</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatCurrency(trade.grossProfit)}</p>
          </div>
          <div className="ambient-surface-soft rounded-2xl p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Buy Value</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatCurrency(trade.buyValue)}</p>
          </div>
          <div className="ambient-surface-soft rounded-2xl p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Sell Value</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatCurrency(trade.sellValue)}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {showBuyFee ? (
            <span className="ambient-pill rounded-full px-3 py-1.5 text-slate-600 dark:text-slate-300">
              Buy Fee {formatCurrency(trade.buySideFee)}
            </span>
          ) : null}
          {showSellFee ? (
            <span className="ambient-pill rounded-full px-3 py-1.5 text-slate-600 dark:text-slate-300">
              Sell Fee {formatCurrency(trade.sellSideFee)}
            </span>
          ) : null}
          <span className="ambient-pill rounded-full px-3 py-1.5 text-slate-600 dark:text-slate-300">
            Total Fees {formatCurrency(trade.fees)}
          </span>
          <span className="ambient-pill rounded-full px-3 py-1.5 text-slate-600 dark:text-slate-300">GST {formatCurrency(trade.gstOnFees)}</span>
          <span className="ambient-pill rounded-full px-3 py-1.5 text-slate-600 dark:text-slate-300">TDS {formatCurrency(trade.tds)}</span>
          <span className="ambient-pill rounded-full px-3 py-1.5 text-slate-600 dark:text-slate-300">Tax {formatCurrency(trade.cryptoTax)}</span>
        </div>
      </div>
    </article>
  );
}

function MobileHoldingCard({ position }) {
  return (
    <article className="ambient-surface-strong relative overflow-hidden rounded-[30px] p-4">
      <div className="pointer-events-none absolute -left-6 top-0 h-20 w-20 rounded-full bg-copper-500/8 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-500/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 rounded-full bg-violet-500/5 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold text-slate-900 dark:text-white">{position.contract}</p>
          </div>
          <span className="rounded-full bg-copper-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-copper-700 dark:text-copper-300">
            Open
          </span>
        </div>

        <div className="mt-3">
          <MobileDateBlock label="Buy Date" value={position.buyDateTime} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="ambient-pill rounded-full px-3 py-1.5 text-slate-600 dark:text-slate-300">
            Qty {formatQuantity(position.unsoldQty)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="ambient-surface-soft rounded-2xl p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Unsold Qty</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatQuantity(position.unsoldQty)}</p>
          </div>
          <div className="ambient-surface-soft rounded-2xl p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Avg Buy</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatCurrency(position.avgBuyPrice)}</p>
          </div>
          <div className="ambient-surface-soft col-span-2 rounded-2xl p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Invested Capital</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatCurrency(position.totalInvested)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function MobileOnboarding({ onUploadClick, onDownloadSample, processing, sourceFile, theme }) {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-4">
      <MobileSectionCard
        eyebrow="Import Flow"
        title="Start with one clean CSV"
        description="This import flow is tuned for quick uploads, safe processing, and a focused review experience."
      >
        <div className="grid gap-3">
          <div
            className={`ambient-surface rounded-[26px] p-5 ${
              isDark
                ? 'bg-gradient-to-br from-slate-900 via-[#0d2238] to-[#0a1626] text-white'
                : 'border border-slate-200/80 bg-gradient-to-br from-white via-sky-50/80 to-emerald-50/60 text-slate-900 shadow-soft'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-mint-300' : 'text-mint-700'}`}>Quick Import</p>
                <p className="mt-2 font-display text-2xl font-bold">Upload and review in one flow</p>
                <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Bring in spot trade history, inspect matched cycles, and move through analytics in a cleaner mobile layout.
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <Upload className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
              <MobilePrimaryAction onClick={onUploadClick} icon={Upload} tone={isDark ? 'light' : 'dark'}>
                Upload CSV
              </MobilePrimaryAction>
              <button
                type="button"
                onClick={onDownloadSample}
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                  isDark
                    ? 'border-white/20 text-white hover:bg-white/10'
                    : 'border-slate-200/80 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <FileSpreadsheet className="h-5 w-5" />
              </button>
            </div>

            {sourceFile ? (
              <div className={`mt-4 rounded-[20px] px-4 py-3 text-sm ${isDark ? 'bg-white/10' : 'border border-slate-200/80 bg-white/70'}`}>
                <p className={`text-[11px] uppercase tracking-[0.16em] ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Queued file</p>
                <p className={`mt-1 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{sourceFile}</p>
              </div>
            ) : null}

            {processing ? (
              <div
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  isDark ? 'bg-copper-500/20 text-copper-100' : 'bg-copper-500/12 text-copper-700'
                }`}
              >
                <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-current" />
                Processing trades...
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="ambient-surface rounded-[24px] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">How it works</p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <p>1. Upload spot exchange trade history.</p>
                <p>2. Process FIFO matches safely.</p>
                <p>3. Review taxes, warnings, and open holdings.</p>
              </div>
            </div>
            <div className="ambient-surface rounded-[24px] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">What you get</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['FIFO cycles', 'Tax summary', 'Open holdings', 'Analytics panels'].map((item) => (
                  <span key={item} className="ambient-pill rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MobileSectionCard>
    </div>
  );
}

function MobileDashboardView({
  theme,
  onToggleTheme,
  onUploadClick,
  onDownloadSample,
  onOpenProfile,
  onRecalculateCurrentFile,
  onClearReport,
  report,
  processing,
  summary,
  stats,
  warnings,
  profile,
  sourceFile,
  processedAt,
  activeMobileTab,
  onActiveMobileTabChange,
  mobileMetricCards,
  mobileOverviewCards,
  mobileTradeHighlights,
  mobileHoldingHighlights,
  tradeSearch,
  onTradeSearchChange,
  selectedTradeContract,
  onSelectedTradeContractChange,
  contracts,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onResetTradeFilters,
  openSearch,
  onOpenSearchChange,
  selectedOpenContract,
  onSelectedOpenContractChange,
  onResetHoldingFilters,
  filteredTrades,
  visibleMobileTrades,
  onLoadMoreTrades,
  filteredOpenPositions,
  visibleMobileOpenPositions,
  onLoadMoreHoldings,
  analytics
}) {
  const [showTradeFilters, setShowTradeFilters] = useState(false);
  const [showHoldingFilters, setShowHoldingFilters] = useState(false);

  const hasTradeFiltersApplied = Boolean(
    tradeSearch || selectedTradeContract !== 'ALL' || startDate || endDate
  );
  const hasHoldingFiltersApplied = Boolean(openSearch || selectedOpenContract !== 'ALL');

  useEffect(() => {
    if (hasTradeFiltersApplied) {
      setShowTradeFilters(true);
    }
  }, [hasTradeFiltersApplied]);

  useEffect(() => {
    if (hasHoldingFiltersApplied) {
      setShowHoldingFilters(true);
    }
  }, [hasHoldingFiltersApplied]);

  function handleTabChange(nextTab) {
    onActiveMobileTabChange(nextTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const hasReport = Boolean(report?.summary && report?.meta);
  const isDark = theme === 'dark';
  const showMobileHeader = !hasReport || activeMobileTab === 'overview';
  const remainingTradeCount = Math.max(0, filteredTrades.length - visibleMobileTrades.length);
  const reportFeeModel = report?.meta?.feeModel || profile;
  const showBuyFee = Number(reportFeeModel?.buyFeePercent || 0) > 0;
  const showSellFee = Number(reportFeeModel?.sellFeePercent || 0) > 0;
  const activeExchangeLabel = reportFeeModel?.exchangeName || profile?.exchangeName || 'Saved setup';
  const activeFeeSummary = `Buy ${Number(reportFeeModel?.buyFeePercent || 0)}% / Sell ${Number(reportFeeModel?.sellFeePercent || 0)}%`;

  return (
    <div className="space-y-4 pb-32 lg:hidden">
      {showMobileHeader ? (
      <section id="mobile-upload-panel" className="glass-panel overflow-hidden p-3">
        <div
          className={`relative overflow-hidden rounded-[30px] p-4 ${
            isDark
              ? 'bg-gradient-to-br from-slate-900 via-[#0c1e31] to-[#091525] text-white'
              : 'border border-white/70 bg-gradient-to-br from-white via-[#f4f8fd] to-[#e7eff9] text-slate-900 shadow-[0_24px_60px_rgba(148,163,184,0.18)]'
          }`}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-mint-500/18 via-sky-500/12 to-violet-500/12" />
          <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-sky-500/18 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-mint-500/14 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-mint-300' : 'text-mint-700'}`}>
                  Spot Trading Workspace
                </p>
                <h1 className="mt-2 max-w-[15rem] font-display text-[2rem] font-bold leading-[0.98] tracking-tight">
                  Crypto Trade Tax Analyzer
                </h1>
                <p className={`mt-3 max-w-xl text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {hasReport
                    ? 'A compact review surface for spot uploads, realized trades, open holdings, and analytics.'
                    : 'Upload spot exchange CSVs, match trades with FIFO logic, and review taxes in a cleaner mobile flow.'}
                </p>
              </div>

              <div className="ambient-surface-soft flex shrink-0 items-center gap-2 rounded-[22px] p-1.5 pt-1.5">
                <MobileIconAction
                  icon={theme === 'dark' ? SunMedium : MoonStar}
                  onClick={onToggleTheme}
                  label="Toggle theme"
                  inverted={isDark}
                />
                {hasReport ? <ExportMenu report={report} sourceFile={sourceFile} processedAt={processedAt} iconOnly compact /> : null}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <MobilePrimaryAction onClick={onUploadClick} icon={Upload} tone={isDark ? 'light' : 'dark'} className="w-full">
                Upload CSV
              </MobilePrimaryAction>
              <div className={`grid gap-3 ${hasReport ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <MobileSecondaryAction icon={FileSpreadsheet} onClick={onDownloadSample} inverted={isDark}>
                  Sample CSV
                </MobileSecondaryAction>
                {hasReport ? (
                  <MobileSecondaryAction icon={Trash2} onClick={onClearReport} tone="danger" inverted={isDark}>
                    Clear Session
                  </MobileSecondaryAction>
                ) : null}
              </div>
            </div>

            <div className={`mt-4 rounded-[24px] border px-3.5 py-3 ${
              isDark
                ? 'border-white/10 bg-white/[0.05]'
                : 'border-slate-200/80 bg-white/72'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Saved setup
                  </p>
                  <p className={`mt-1 truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activeExchangeLabel}
                  </p>
                  <p className={`mt-0.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {activeFeeSummary}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition ${
                    isDark
                      ? 'border-white/10 bg-white/[0.06] text-slate-200 hover:border-mint-400/40 hover:text-white'
                      : 'border-slate-200/80 bg-white/88 text-slate-700 hover:border-mint-500 hover:text-slate-900'
                  }`}
                  aria-label="Edit saved setup"
                >
                  <PencilLine className="h-4 w-4" />
                </button>
              </div>
              {onRecalculateCurrentFile ? (
                <button
                  type="button"
                  onClick={onRecalculateCurrentFile}
                  disabled={processing}
                  className={`mt-3 inline-flex w-full items-center justify-center rounded-[18px] px-4 py-2.5 text-sm font-semibold transition ${
                    processing
                      ? 'cursor-not-allowed bg-slate-400/20 text-slate-400'
                      : isDark
                        ? 'border border-white/10 bg-white/[0.06] text-slate-200 hover:border-mint-400/40 hover:text-white'
                        : 'border border-slate-200/80 bg-white/88 text-slate-700 hover:border-mint-500 hover:text-slate-900'
                  }`}
                >
                  Recalculate current file
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MobileHeaderStat
                label={hasReport ? 'Final Net' : 'Valid Rows'}
                value={
                  hasReport && summary
                    ? formatCurrency(summary.finalNetProfit)
                    : String(stats?.validTrades || 0)
                }
                helper={hasReport ? (summary?.finalNetProfit >= 0 ? 'Net positive session' : 'Net negative session') : 'Rows accepted into the engine'}
                inverted={isDark}
              />
              <MobileHeaderStat
                label="Session"
                value={sourceFile || 'No file yet'}
                helper={processedAt || `${warnings.length} warning${warnings.length === 1 ? '' : 's'} tracked`}
                valueClassName="text-base leading-6"
                truncateValue
                inverted={isDark}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <MobileInlineChip icon={TrendingUp} tone={hasReport ? 'positive' : 'neutral'} inverted={isDark}>
                {stats?.realizedTradesCount || 0} realized
              </MobileInlineChip>
              <MobileInlineChip icon={WalletCards} inverted={isDark}>
                {stats?.openPositionsCount || 0} open holdings
              </MobileInlineChip>
              <MobileInlineChip icon={CircleAlert} tone={warnings.length ? 'warning' : 'neutral'} inverted={isDark}>
                {warnings.length} warnings
              </MobileInlineChip>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {processing ? <SkeletonGrid /> : null}

      {warnings.length ? (
        <StatusBanner
          tone="warning"
          title={`${warnings.length} validation warning${warnings.length > 1 ? 's' : ''}`}
          description="Rows with issues were skipped safely, and unmatched sell quantities were flagged without breaking the report."
          items={warnings.slice(0, 3)}
        />
      ) : null}

      {!hasReport && !processing ? (
        <>
          <MobileOnboarding
            onUploadClick={onUploadClick}
            onDownloadSample={onDownloadSample}
            processing={processing}
            sourceFile={sourceFile}
            theme={theme}
          />
          <CalculationGuideSection compact />
        </>
      ) : null}

      {hasReport ? (
        <>
          {activeMobileTab === 'overview' ? (
            <div className="space-y-4">
              <MobileSectionCard
                eyebrow="Portfolio Health"
                title={formatCurrency(summary.finalNetProfit)}
                description="A quick read on realized performance, current exposure, and tax drag in the active session."
                action={
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                      summary.finalNetProfit >= 0 ? 'bg-mint-500/15 text-mint-700 dark:text-mint-300' : 'bg-coral-500/15 text-coral-700 dark:text-coral-300'
                    }`}
                  >
                    {summary.finalNetProfit >= 0 ? 'Positive' : 'Negative'}
                  </span>
                }
              >
                <div
                  className={`relative overflow-hidden rounded-[28px] p-4 ${
                    isDark
                      ? 'bg-gradient-to-br from-slate-900 via-[#10243a] to-[#0b1624] text-white'
                      : 'border border-slate-200/80 bg-gradient-to-br from-white/90 via-sky-50/75 to-emerald-50/60 text-slate-900 shadow-soft'
                  }`}
                >
                  <div className="pointer-events-none absolute -right-10 top-0 h-24 w-24 rounded-full bg-sky-500/18 blur-3xl" />
                  <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-mint-500/16 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-mint-200' : 'text-mint-700'}`}>Session Readout</p>
                        <p className={`mt-2 max-w-[14rem] text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          Compare profit, taxes, and remaining exposure without losing readability.
                        </p>
                      </div>
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <MobileInlineChip icon={TrendingUp} tone={summary.finalNetProfit >= 0 ? 'positive' : 'neutral'} inverted={isDark}>
                        {stats?.realizedTradesCount || 0} realized cycles
                      </MobileInlineChip>
                      <MobileInlineChip icon={WalletCards} inverted={isDark}>
                        {stats?.openPositionsCount || 0} open holdings
                      </MobileInlineChip>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  {mobileMetricCards.map((card) => (
                    <MobileMetricTile key={card.label} label={card.label} value={card.value} tone={card.tone} />
                  ))}
                </div>
              </MobileSectionCard>

              <div className="grid gap-3">
                {mobileOverviewCards.map((card) => (
                  <MobileInfoCard
                    key={card.title}
                    title={card.title}
                    description={card.description}
                    value={card.value}
                    tone={card.tone}
                  />
                ))}
              </div>

              <MobileSectionCard
                eyebrow="Availability"
                title="CSV export is ready"
                description="Download the active session as one clean CSV file, then keep using the dashboard for charts, filters, and visual review."
              >
                <div className="flex flex-wrap gap-2">
                  <span className="ambient-pill rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">Interactive review</span>
                  <span className="ambient-pill rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">Realized trades included</span>
                  <span className="ambient-pill rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">Open positions included</span>
                </div>
              </MobileSectionCard>

              <CalculationGuideSection compact />
            </div>
          ) : null}

          {activeMobileTab === 'trades' ? (
            <div className="space-y-4">
              <MobileSectionCard
                eyebrow="Trades"
                title="Realized trade review"
                description={`${filteredTrades.length} matched cycle${filteredTrades.length === 1 ? '' : 's'} available for mobile review.`}
                action={
                  <button
                    type="button"
                    onClick={() => setShowTradeFilters((currentValue) => !currentValue)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                      showTradeFilters || hasTradeFiltersApplied
                        ? 'border border-mint-500/30 bg-mint-500/10 text-mint-700 dark:text-mint-200'
                        : 'ambient-pill text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {showTradeFilters ? 'Hide Filters' : 'Show Filters'}
                  </button>
                }
              >
                {showTradeFilters ? (
                  <FilterBar
                    search={tradeSearch}
                    onSearchChange={onTradeSearchChange}
                    searchPlaceholder="Search pair or date"
                    contract={selectedTradeContract}
                    onContractChange={onSelectedTradeContractChange}
                    contracts={contracts}
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={onStartDateChange}
                    onEndDateChange={onEndDateChange}
                    onReset={onResetTradeFilters}
                  />
                ) : null}
              </MobileSectionCard>

              {mobileTradeHighlights.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {mobileTradeHighlights.map((item, index) => (
                    <MobileMetricTile
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      tone={item.tone}
                      className={`min-h-[96px] ${
                        mobileTradeHighlights.length % 2 === 1 && index === mobileTradeHighlights.length - 1 ? 'col-span-2' : ''
                      }`}
                    />
                  ))}
                </div>
              ) : null}

              {visibleMobileTrades.length ? (
                <div className="space-y-3">
                  {visibleMobileTrades.map((trade) => (
                    <MobileTradeCard key={trade.id} trade={trade} showBuyFee={showBuyFee} showSellFee={showSellFee} />
                  ))}
                </div>
              ) : (
                <StatusBanner
                  tone="info"
                  title="No realized trades for this filter"
                  description="Try clearing the search or widening the date range."
                />
              )}

              {filteredTrades.length > visibleMobileTrades.length ? (
                <div className="ambient-surface flex flex-col gap-3 rounded-[24px] px-4 py-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Showing <span className="font-semibold text-slate-900 dark:text-white">{visibleMobileTrades.length}</span> of{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">{filteredTrades.length}</span> trades
                  </p>
                  <button
                    type="button"
                    onClick={onLoadMoreTrades}
                    className="ambient-pill rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-mint-500 hover:text-slate-900 dark:text-slate-200"
                  >
                    {remainingTradeCount > 8 ? 'Load 8 more' : `Load ${remainingTradeCount} more`}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeMobileTab === 'holdings' ? (
            <div className="space-y-4">
              <MobileSectionCard
                eyebrow="Holdings"
                title="Open lot tracker"
                description={`${filteredOpenPositions.length} remaining holding lot${filteredOpenPositions.length === 1 ? '' : 's'} still unmatched.`}
                action={
                  <button
                    type="button"
                    onClick={() => setShowHoldingFilters((currentValue) => !currentValue)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                      showHoldingFilters || hasHoldingFiltersApplied
                        ? 'border border-mint-500/30 bg-mint-500/10 text-mint-700 dark:text-mint-200'
                        : 'ambient-pill text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {showHoldingFilters ? 'Hide Filters' : 'Show Filters'}
                  </button>
                }
              >
                {showHoldingFilters ? (
                  <FilterBar
                    search={openSearch}
                    onSearchChange={onOpenSearchChange}
                    searchPlaceholder="Search pair or buy date"
                    contract={selectedOpenContract}
                    onContractChange={onSelectedOpenContractChange}
                    contracts={contracts}
                    startDate=""
                    endDate=""
                    showDateFilters={false}
                    onReset={onResetHoldingFilters}
                  />
                ) : null}
              </MobileSectionCard>

              {mobileHoldingHighlights.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {mobileHoldingHighlights.map((item, index) => (
                    <MobileMetricTile
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      tone={item.tone}
                      className={`min-h-[96px] ${
                        mobileHoldingHighlights.length % 2 === 1 && index === mobileHoldingHighlights.length - 1 ? 'col-span-2' : ''
                      }`}
                    />
                  ))}
                </div>
              ) : null}

              {visibleMobileOpenPositions.length ? (
                <div className="space-y-3">
                  {visibleMobileOpenPositions.map((position) => (
                    <MobileHoldingCard key={position.id} position={position} />
                  ))}
                </div>
              ) : (
                <StatusBanner
                  tone="info"
                  title="No open holdings for this filter"
                  description="All buys may already be matched, or the pair search has narrowed the list."
                />
              )}

              {filteredOpenPositions.length > visibleMobileOpenPositions.length ? (
                <button
                  type="button"
                  onClick={onLoadMoreHoldings}
                  className="ambient-pill w-full rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-mint-500 hover:text-slate-900 dark:text-slate-200"
                >
                  Load more holdings
                </button>
              ) : null}
            </div>
          ) : null}

          {activeMobileTab === 'analytics' ? (
            <div className="space-y-4">
              <MobileSectionCard eyebrow="Insights" title="Compact analytics" description="Stacked charts tuned for thumb-scrolling and quicker review.">
                <div className="flex items-start gap-3 rounded-[24px] bg-copper-500/10 p-4 text-copper-800 dark:text-copper-100">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Mobile insights mode</p>
                    <p className="mt-1 text-sm leading-6">
                      Charts are stacked and compact here so the portfolio story stays readable without breaking thumb navigation.
                    </p>
                  </div>
                </div>
              </MobileSectionCard>
              <AnalyticsPanel analytics={analytics} compact />
            </div>
          ) : null}

          <MobileBottomNav tabs={MOBILE_TABS} activeTab={activeMobileTab} onChange={handleTabChange} />
        </>
      ) : null}
    </div>
  );
}

export default MobileDashboardView;
