import { TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import AnalyticsPanel from '../components/AnalyticsPanel';
import AppHeader from '../components/AppHeader';
import CalculationGuideSection from '../components/CalculationGuideSection';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import ExportMenu from '../components/ExportMenu';
import FilterBar from '../components/FilterBar';
import ImportIssuesModal from '../components/ImportIssuesModal';
import MetricCard from '../components/MetricCard';
import MobileDashboardView from '../components/MobileDashboardView';
import ProfileSetupModal from '../components/ProfileSetupModal';
import SectionCard from '../components/SectionCard';
import SkeletonGrid from '../components/SkeletonGrid';
import StatusBanner from '../components/StatusBanner';
import ToastStack from '../components/ToastStack';
import UploadDropzone from '../components/UploadDropzone';
import useMediaQuery from '../hooks/useMediaQuery';
import usePersistedState from '../hooks/usePersistedState';
import { getSampleCsvUrl, processTradeFile } from '../services/api';
import { formatCurrency, formatDateTime, formatQuantity } from '../utils/formatters';

const DEFAULT_PROFILE = {
  userName: '',
  exchangeName: '',
  buyFeePercent: '0',
  sellFeePercent: '0.1'
};

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizePercentValue(rawValue, fallbackValue) {
  const parsedValue = Number(rawValue);

  if (
    rawValue === undefined ||
    rawValue === null ||
    String(rawValue).trim() === '' ||
    !Number.isFinite(parsedValue) ||
    parsedValue < 0
  ) {
    return fallbackValue;
  }

  return String(rawValue);
}

function normalizeFeeModel(rawModel) {
  if (
    rawModel?.buyFeePercent !== undefined ||
    rawModel?.sellFeePercent !== undefined ||
    rawModel?.userName !== undefined ||
    rawModel?.exchangeName !== undefined
  ) {
    return {
      userName: String(rawModel?.userName || '').trim(),
      exchangeName: String(rawModel?.exchangeName || '').trim(),
      buyFeePercent: normalizePercentValue(rawModel?.buyFeePercent, DEFAULT_PROFILE.buyFeePercent),
      sellFeePercent: normalizePercentValue(rawModel?.sellFeePercent, DEFAULT_PROFILE.sellFeePercent)
    };
  }

  const legacyFeeRate = normalizePercentValue(rawModel?.feeRatePercent, DEFAULT_PROFILE.sellFeePercent);
  const legacyFeeSide = ['buy', 'sell', 'both'].includes(rawModel?.feeAppliesTo) ? rawModel.feeAppliesTo : 'sell';

  return {
    userName: '',
    exchangeName: '',
    buyFeePercent: legacyFeeSide === 'buy' || legacyFeeSide === 'both' ? legacyFeeRate : DEFAULT_PROFILE.buyFeePercent,
    sellFeePercent: legacyFeeSide === 'sell' || legacyFeeSide === 'both' ? legacyFeeRate : DEFAULT_PROFILE.buyFeePercent
  };
}

function normalizeProfile(rawProfile) {
  return normalizeFeeModel(rawProfile || {});
}

function formatFeeRatePercent(value) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return DEFAULT_PROFILE.buyFeePercent;
  }

  return parsedValue.toFixed(4).replace(/\.?0+$/, '');
}

function getFeeModelSummary(feeModel) {
  return `Buy ${formatFeeRatePercent(feeModel.buyFeePercent)}% / Sell ${formatFeeRatePercent(feeModel.sellFeePercent)}%`;
}

function getProfileUploadPayload(profile) {
  const normalizedProfile = normalizeProfile(profile);

  return {
    userName: normalizedProfile.userName,
    exchangeName: normalizedProfile.exchangeName,
    buyFeePercent: normalizedProfile.buyFeePercent,
    sellFeePercent: normalizedProfile.sellFeePercent
  };
}

function hasProfileDetails(profile) {
  return Boolean(profile.userName && profile.exchangeName);
}

function normalizeReport(rawReport) {
  if (!isPlainObject(rawReport) || !isPlainObject(rawReport.summary) || !isPlainObject(rawReport.meta)) {
    return null;
  }

  const meta = {
    ...rawReport.meta,
    contracts: Array.isArray(rawReport.meta.contracts) ? rawReport.meta.contracts : [],
    feeModel: normalizeFeeModel(rawReport.meta.feeModel)
  };

  const analytics = isPlainObject(rawReport.analytics)
    ? {
        ...rawReport.analytics,
        realizedPnlByAsset: Array.isArray(rawReport.analytics.realizedPnlByAsset) ? rawReport.analytics.realizedPnlByAsset : [],
        openPositionsDistribution: Array.isArray(rawReport.analytics.openPositionsDistribution)
          ? rawReport.analytics.openPositionsDistribution
          : [],
        monthlyPerformance: Array.isArray(rawReport.analytics.monthlyPerformance) ? rawReport.analytics.monthlyPerformance : [],
        taxBreakdown: Array.isArray(rawReport.analytics.taxBreakdown) ? rawReport.analytics.taxBreakdown : []
      }
    : {
        realizedPnlByAsset: [],
        openPositionsDistribution: [],
        monthlyPerformance: [],
        taxBreakdown: []
      };

  return {
    ...rawReport,
    summary: rawReport.summary,
    meta,
    warnings: Array.isArray(rawReport.warnings) ? rawReport.warnings : [],
    realizedTrades: Array.isArray(rawReport.realizedTrades) ? rawReport.realizedTrades : [],
    openPositions: Array.isArray(rawReport.openPositions) ? rawReport.openPositions : [],
    analytics
  };
}

function getDateSortValue(value) {
  if (!value) {
    return 0;
  }

  const normalizedValue =
    typeof value === 'string' && value.includes(' ') && !value.includes('T') ? value.replace(' ', 'T') : value;
  const timestamp = new Date(normalizedValue).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function renderStackedDateTime(value) {
  const formattedValue = formatDateTime(value);
  const [datePart, timePart] = String(formattedValue).split(', ');

  return (
    <div className="min-w-[7.75rem] leading-none">
      <div className="font-medium text-white">{datePart || formattedValue}</div>
      {timePart ? <div className="mt-2 text-[13px] text-slate-400">{timePart}</div> : null}
    </div>
  );
}

function renderPairCell(contract) {
  const pairLabel = String(contract || '').replace(/_/g, '/');
  return (
    <div className="min-w-[6.75rem] leading-none">
      <div className="font-semibold text-white">{contract}</div>
      <div className="mt-2 text-[13px] text-slate-400">{pairLabel}</div>
    </div>
  );
}

function renderFeeBreakdownCell(row) {
  const parts = [];

  if (Number(row.buySideFee || 0) > 0) {
    parts.push(`B ${formatCurrency(row.buySideFee)}`);
  }

  if (Number(row.sellSideFee || 0) > 0) {
    parts.push(`S ${formatCurrency(row.sellSideFee)}`);
  }

  return (
    <div className="min-w-[6.5rem]">
      <div>{formatCurrency(row.fees)}</div>
      {parts.length ? <div className="mt-2 text-[12px] text-slate-400">{parts.join(' · ')}</div> : null}
    </div>
  );
}

function SnapshotFeatureCard({ eyebrow, title, value, description, tone = 'neutral' }) {
  const toneClasses = {
    positive: 'border-mint-500/20 bg-mint-500/10',
    negative: 'border-coral-500/20 bg-coral-500/10',
    accent: 'border-sky-500/20 bg-sky-500/10',
    neutral: 'ambient-surface'
  };

  return (
    <div className={`rounded-[26px] border p-5 shadow-soft backdrop-blur-xl ${toneClasses[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{eyebrow}</p>
      <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">{title}</p>
      <p className="mt-3 font-display text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

function DashboardPage() {
  const inputRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [theme, setTheme] = usePersistedState('crypto-tax-theme', 'dark');
  const [report, setReport] = usePersistedState('crypto-tax-last-report', null);
  const [storedProfile, setStoredProfile] = usePersistedState('crypto-tax-profile', DEFAULT_PROFILE);
  const [activeMobileTab, setActiveMobileTab] = usePersistedState('crypto-tax-mobile-tab', 'overview');
  const [currentFileName, setCurrentFileName] = useState('');
  const [lastUploadedFile, setLastUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState(() => normalizeProfile(storedProfile));
  const [tradeSearch, setTradeSearch] = useState('');
  const [openSearch, setOpenSearch] = useState('');
  const [selectedTradeContract, setSelectedTradeContract] = useState('ALL');
  const [selectedOpenContract, setSelectedOpenContract] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mobileTradeVisibleCount, setMobileTradeVisibleCount] = useState(8);
  const [mobileOpenVisibleCount, setMobileOpenVisibleCount] = useState(10);
  const [toasts, setToasts] = useState([]);
  const [importIssuesModal, setImportIssuesModal] = useState(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (!toasts.length) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToasts((currentValue) => currentValue.slice(1));
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  useEffect(() => {
    setMobileTradeVisibleCount(8);
  }, [tradeSearch, selectedTradeContract, startDate, endDate, report?.realizedTrades?.length]);

  useEffect(() => {
    setMobileOpenVisibleCount(10);
  }, [openSearch, selectedOpenContract, report?.openPositions?.length]);

  const safeReport = useMemo(() => normalizeReport(report), [report]);
  const profile = useMemo(() => normalizeProfile(storedProfile), [storedProfile]);
  const hasSavedProfile = hasProfileDetails(profile);
  const isDarkTheme = theme === 'dark';

  useEffect(() => {
    if (
      storedProfile?.userName !== profile.userName ||
      storedProfile?.exchangeName !== profile.exchangeName ||
      storedProfile?.buyFeePercent !== profile.buyFeePercent ||
      storedProfile?.sellFeePercent !== profile.sellFeePercent
    ) {
      setStoredProfile(profile);
    }
  }, [profile, setStoredProfile, storedProfile]);

  useEffect(() => {
    setProfileDraft(profile);
  }, [profile]);

  useEffect(() => {
    if (!hasSavedProfile) {
      setProfileModalOpen(true);
    }
  }, [hasSavedProfile]);

  useEffect(() => {
    if (report && !safeReport) {
      setReport(null);
      setCurrentFileName('');
      setLastUploadedFile(null);
      setProfileModalOpen(true);
    }
  }, [report, safeReport, setReport]);

  function pushToast(title, description, tone = 'success') {
    setToasts((currentValue) => [
      ...currentValue,
      {
        id: `${Date.now()}-${Math.random()}`,
        title,
        description,
        tone
      }
    ]);
  }

  function handleProfileDraftChange(field, value) {
    setProfileDraft((currentValue) => ({
      ...currentValue,
      [field]: value
    }));
  }

  async function processSelectedFile(file, activeProfile = profile) {
    if (!file) {
      return;
    }

    setProcessing(true);
    setCurrentFileName(file.name);

    try {
      const nextReport = await processTradeFile(file, getProfileUploadPayload(activeProfile));
      setImportIssuesModal(null);

      nextReport.meta = {
        ...nextReport.meta,
        sourceFile: file.name
      };

      startTransition(() => {
        setReport(nextReport);
        setTradeSearch('');
        setOpenSearch('');
        setSelectedTradeContract('ALL');
        setSelectedOpenContract('ALL');
        setStartDate('');
        setEndDate('');
        setActiveMobileTab('overview');
      });

      pushToast(
        'Processing complete',
        `${nextReport.meta.validTrades} trades analyzed across ${nextReport.meta.contractCount} spot pairs.`
      );

      if (nextReport.warnings?.length) {
        pushToast('Warnings captured', `${nextReport.warnings.length} rows or conditions need attention.`, 'warning');
      }
    } catch (error) {
      const issues = Array.isArray(error?.issues) ? error.issues : [];
      const message = error.message || 'Unable to process the uploaded file.';

      if (issues.length) {
        setImportIssuesModal({
          title: 'CSV import needs attention',
          message,
          issues
        });
        pushToast('Import blocked', `${issues.length} CSV issue${issues.length === 1 ? '' : 's'} need review.`, 'error');
      } else {
        pushToast('Upload failed', message, 'error');
      }
    } finally {
      setProcessing(false);
    }
  }

  async function handleFileSelected(file) {
    if (!file) {
      return;
    }

    if (!hasSavedProfile) {
      setProfileModalOpen(true);
      pushToast('Profile required', 'Save your trader profile before processing spot trades.', 'warning');
      return;
    }

    setLastUploadedFile(file);
    await processSelectedFile(file);
  }

  async function recalculateCurrentFile() {
    if (!lastUploadedFile || processing) {
      return;
    }

    await processSelectedFile(lastUploadedFile);
  }

  async function saveProfile() {
    const nextProfile = normalizeProfile(profileDraft);

    if (!nextProfile.userName) {
      pushToast('User name required', 'Please add a user name to continue.', 'warning');
      return;
    }

    if (!nextProfile.exchangeName) {
      pushToast('Exchange name required', 'Please add the spot exchange name to continue.', 'warning');
      return;
    }

    const feeChanged =
      nextProfile.buyFeePercent !== profile.buyFeePercent || nextProfile.sellFeePercent !== profile.sellFeePercent;

    setStoredProfile(nextProfile);
    setProfileModalOpen(false);
    pushToast(
      'Profile saved',
      `${nextProfile.userName} on ${nextProfile.exchangeName} is now the active spot-trading profile.`
    );

    if (lastUploadedFile && feeChanged) {
      await processSelectedFile(lastUploadedFile, nextProfile);
      return;
    }

    if (safeReport && feeChanged) {
      pushToast(
        'Re-upload needed',
        'The saved profile changed your fee model. Re-upload the CSV to refresh calculations in this restored session.',
        'warning'
      );
    }
  }

  function downloadSample() {
    window.open(getSampleCsvUrl(), '_blank', 'noopener,noreferrer');
  }

  function clearReport() {
    setReport(null);
    setCurrentFileName('');
    setLastUploadedFile(null);
    setActiveMobileTab('overview');
    pushToast('Workspace cleared', 'The locally stored processed report has been removed.');
  }

  function openProfileModal() {
    setProfileDraft(profile);
    setProfileModalOpen(true);
  }

  function triggerUpload() {
    if (!hasSavedProfile) {
      openProfileModal();
      pushToast('Profile required', 'Save your trader profile before uploading a CSV.', 'warning');
      return;
    }

    const targetId = isMobile ? 'mobile-upload-panel' : 'upload-panel';
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => inputRef.current?.click(), 180);
  }

  const contracts = safeReport?.meta?.contracts || [];
  const warnings = safeReport?.warnings || [];
  const tradeSearchValue = tradeSearch.trim().toLowerCase();
  const openSearchValue = openSearch.trim().toLowerCase();

  const filteredTrades = useMemo(() => {
    return [...(safeReport?.realizedTrades || [])]
      .filter((trade) => {
        const matchesSearch =
          !tradeSearchValue ||
          `${trade.contract} ${trade.buyDateTime} ${trade.sellDateTime}`.toLowerCase().includes(tradeSearchValue);
        const matchesContract = selectedTradeContract === 'ALL' || trade.contract === selectedTradeContract;
        const matchesStart = !startDate || trade.sellDate >= startDate;
        const matchesEnd = !endDate || trade.sellDate <= endDate;

        return matchesSearch && matchesContract && matchesStart && matchesEnd;
      })
      .sort((left, right) => {
        const sellDifference = getDateSortValue(right.sellDateTime) - getDateSortValue(left.sellDateTime);

        if (sellDifference !== 0) {
          return sellDifference;
        }

        const buyDifference = getDateSortValue(right.buyDateTime) - getDateSortValue(left.buyDateTime);

        if (buyDifference !== 0) {
          return buyDifference;
        }

        return String(left.contract ?? '').localeCompare(String(right.contract ?? ''));
      });
  }, [safeReport?.realizedTrades, tradeSearchValue, selectedTradeContract, startDate, endDate]);

  const filteredOpenPositions = useMemo(() => {
    return [...(safeReport?.openPositions || [])]
      .filter((position) => {
        const matchesSearch =
          !openSearchValue || `${position.contract} ${position.buyDateTime}`.toLowerCase().includes(openSearchValue);
        const matchesContract = selectedOpenContract === 'ALL' || position.contract === selectedOpenContract;

        return matchesSearch && matchesContract;
      })
      .sort((left, right) => getDateSortValue(right.buyDateTime) - getDateSortValue(left.buyDateTime));
  }, [safeReport?.openPositions, openSearchValue, selectedOpenContract]);

  const summary = safeReport?.summary;
  const stats = safeReport?.meta;
  const topAsset = safeReport?.analytics?.realizedPnlByAsset?.[0];
  const largestOpenPosition = [...(safeReport?.openPositions || [])].sort(
    (left, right) => right.totalInvested - left.totalInvested
  )[0];
  const totalOpenExposure = (safeReport?.openPositions || []).reduce(
    (total, position) => total + Number(position.totalInvested || 0),
    0
  );
  const totalTaxLoad = summary
    ? (summary.totalFeesPaid || 0) +
      (summary.totalGstOnFees || 0) +
      (summary.totalTdsDeducted || 0) +
      (summary.totalTaxAmount || (summary.totalCryptoTax || 0) + (summary.totalCessAmount || 0))
    : 0;
  const activeSourceFile = currentFileName || safeReport?.meta?.sourceFile || 'No source attached';
  const appliedFeeModel = safeReport?.meta?.feeModel || profile;
  const feeModelHelper = `${appliedFeeModel.exchangeName || 'Exchange profile'} · ${getFeeModelSummary(appliedFeeModel)}`;
  const snapshotComparisonBase = Math.max(
    Math.abs(summary?.finalNetProfit || 0),
    Math.abs(summary?.grossProfit || 0),
    totalTaxLoad,
    totalOpenExposure,
    1
  );
  const snapshotProfile = summary
    ? [
        {
          label: 'Final Net',
          value: formatCurrency(summary.finalNetProfit),
          strength: (Math.abs(summary.finalNetProfit) / snapshotComparisonBase) * 100,
          barStyle: {
            background:
              summary.finalNetProfit >= 0
                ? 'linear-gradient(90deg, rgba(117, 241, 193, 0.95) 0%, rgba(45, 212, 191, 0.94) 55%, rgba(56, 189, 248, 0.92) 100%)'
                : 'linear-gradient(90deg, rgba(255, 155, 138, 0.94) 0%, rgba(248, 113, 113, 0.92) 52%, rgba(251, 146, 60, 0.9) 100%)'
          }
        },
        {
          label: 'Tax Drag',
          value: formatCurrency(totalTaxLoad),
          strength: (totalTaxLoad / snapshotComparisonBase) * 100,
          barStyle: {
            background:
              'linear-gradient(90deg, rgba(96, 165, 250, 0.94) 0%, rgba(99, 102, 241, 0.92) 54%, rgba(167, 139, 250, 0.88) 100%)'
          }
        },
        {
          label: 'Open Exposure',
          value: formatCurrency(totalOpenExposure),
          strength: (totalOpenExposure / snapshotComparisonBase) * 100,
          barStyle: {
            background:
              'linear-gradient(90deg, rgba(52, 211, 153, 0.94) 0%, rgba(34, 211, 238, 0.92) 52%, rgba(96, 165, 250, 0.88) 100%)'
          }
        }
      ]
    : [];
  const metricCards = summary
    ? [
        {
          label: 'Total Buy Value',
          value: formatCurrency(summary.totalBuyValue),
          helper: 'FIFO matched cost basis',
          tone: 'neutral'
        },
        {
          label: 'Total Sell Value',
          value: formatCurrency(summary.totalSellValue),
          helper: 'Eligible realized turnover',
          tone: 'accent'
        },
        {
          label: 'Gross Profit',
          value: formatCurrency(summary.grossProfit),
          helper: 'Before deductions and taxes',
          tone: summary.grossProfit >= 0 ? 'positive' : 'negative'
        },
        {
          label: 'Total Fees Paid',
          value: formatCurrency(summary.totalFeesPaid),
          helper: feeModelHelper,
          tone: 'neutral'
        },
        {
          label: 'GST on Fees',
          value: formatCurrency(summary.totalGstOnFees),
          helper: '18% modeled on exchange/service fees',
          tone: 'neutral'
        },
        {
          label: 'TDS Deducted',
          value: formatCurrency(summary.totalTdsDeducted),
          helper: '1% on transfer value; threshold rules may vary',
          tone: 'accent'
        },
        {
          label: 'Base VDA Tax (30%)',
          value: formatCurrency(summary.totalCryptoTax),
          helper: 'Base 30% rate on positive realized gains',
          tone: 'neutral'
        },
        {
          label: 'Health & Education Cess (4%)',
          value: formatCurrency(summary.totalCessAmount || 0),
          helper: 'Calculated strictly on the 30% base tax amount',
          tone: 'neutral'
        },
        {
          label: 'Final Net Profit',
          value: formatCurrency(summary.finalNetProfit),
          helper: 'Net in hand plus TDS credit',
          tone: summary.finalNetProfit >= 0 ? 'positive' : 'negative'
        }
      ]
    : [];

  const mobileMetricCards = summary
    ? [
        {
          label: 'Sell Value',
          value: formatCurrency(summary.totalSellValue),
          tone: 'accent'
        },
        {
          label: 'Gross Profit',
          value: formatCurrency(summary.grossProfit),
          tone: summary.grossProfit >= 0 ? 'positive' : 'negative'
        },
        {
          label: 'Tax Load',
          value: formatCurrency(totalTaxLoad),
          tone: 'neutral'
        },
        {
          label: 'Open Exposure',
          value: formatCurrency(totalOpenExposure),
          tone: totalOpenExposure > 0 ? 'accent' : 'neutral'
        }
      ]
    : [];

  const mobileOverviewCards = summary
    ? [
        {
          title: 'Top Asset',
          description: topAsset
            ? `${topAsset.contract} is contributing the strongest final net performance.`
            : 'Upload data to reveal the strongest spot pair.',
          value: topAsset ? `${topAsset.contract} - ${formatCurrency(topAsset.finalNetProfit)}` : 'No realized data',
          tone: topAsset?.finalNetProfit >= 0 ? 'positive' : 'neutral'
        },
        {
          title: 'Largest Open Lot',
          description: largestOpenPosition
            ? 'Highest invested unsold position in the current report.'
            : 'No unmatched buy lots are pending.',
          value: largestOpenPosition
            ? `${largestOpenPosition.contract} - ${formatCurrency(largestOpenPosition.totalInvested)}`
            : 'Fully matched',
          tone: largestOpenPosition ? 'accent' : 'neutral'
        },
        {
          title: 'Tax Load',
          description: 'Combined cost of fees, GST, TDS, base crypto tax, and 4% cess in this report.',
          value: formatCurrency(totalTaxLoad),
          tone: totalTaxLoad > 0 ? 'accent' : 'neutral'
        },
        {
          title: 'Current Session',
          description: safeReport?.meta?.sourceFile ? `Imported from ${safeReport.meta.sourceFile}` : 'No source file attached.',
          value: safeReport?.meta?.processedAt || 'Waiting',
          tone: 'neutral'
        }
      ]
    : [];

  const tradeColumns = [
    {
      key: 'rowNumber',
      label: '#',
      sortable: false,
      render: (_row, absoluteIndex) => <span className="font-medium text-slate-200">{absoluteIndex + 1}</span>,
      cellClassName: 'min-w-[2.5rem]',
      footer: () => 'Totals'
    },
    {
      key: 'contract',
      label: 'Pair',
      render: (row) => renderPairCell(row.contract),
      initialDirection: 'asc',
      cellClassName: 'min-w-[7.5rem]',
      footer: () => ''
    },
    {
      key: 'buyDateTime',
      label: 'Buy Date',
      sortAccessor: (row) => getDateSortValue(row.buyDateTime),
      render: (row) => renderStackedDateTime(row.buyDateTime),
      cellClassName: 'min-w-[9rem]',
      footer: () => '-'
    },
    {
      key: 'sellDateTime',
      label: 'Sell Date',
      sortAccessor: (row) => getDateSortValue(row.sellDateTime),
      render: (row) => renderStackedDateTime(row.sellDateTime),
      cellClassName: 'min-w-[9rem]',
      footer: () => '-'
    },
    {
      key: 'matchedQty',
      label: 'Qty',
      align: 'right',
      render: (row) => formatQuantity(row.matchedQty),
      sortAccessor: (row) => row.matchedQty,
      footer: (row) => formatQuantity(row.matchedQty)
    },
    {
      key: 'buyValue',
      label: 'Buy Value (INR)',
      align: 'right',
      render: (row) => formatCurrency(row.buyValue),
      footer: (row) => formatCurrency(row.buyValue)
    },
    {
      key: 'sellValue',
      label: 'Sell Value (INR)',
      align: 'right',
      render: (row) => formatCurrency(row.sellValue),
      footer: (row) => formatCurrency(row.sellValue)
    },
    {
      key: 'grossProfit',
      label: 'Gross Profit (INR)',
      align: 'right',
      render: (row) => formatCurrency(row.grossProfit),
      footer: (row) => formatCurrency(row.grossProfit),
      cellClassName: (row) => (row.grossProfit >= 0 ? 'font-semibold text-mint-300' : 'font-semibold text-coral-300'),
      footerClassName: (row) => (row.grossProfit >= 0 ? 'text-mint-300' : 'text-coral-300')
    },
    {
      key: 'fees',
      label: 'Fees (INR)',
      align: 'right',
      render: (row) => renderFeeBreakdownCell(row),
      footer: (row) => formatCurrency(row.fees)
    },
    {
      key: 'gstOnFees',
      label: 'GST (INR)',
      align: 'right',
      render: (row) => formatCurrency(row.gstOnFees),
      footer: (row) => formatCurrency(row.gstOnFees)
    },
    {
      key: 'tds',
      label: 'TDS (INR)',
      align: 'right',
      render: (row) => formatCurrency(row.tds),
      footer: (row) => formatCurrency(row.tds)
    },
    {
      key: 'finalNetProfit',
      label: 'Final Net (INR)',
      align: 'right',
      render: (row) => formatCurrency(row.finalNetProfit),
      footer: (row) => formatCurrency(row.finalNetProfit),
      cellClassName: (row) => (row.finalNetProfit >= 0 ? 'font-bold text-mint-300' : 'font-bold text-coral-300'),
      footerClassName: (row) => (row.finalNetProfit >= 0 ? 'text-mint-300' : 'text-coral-300')
    }
  ];

  const openColumns = [
    {
      key: 'contract',
      label: 'Pair',
      render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{row.contract}</span>,
      initialDirection: 'asc',
      footer: (row) => row.label
    },
    {
      key: 'buyDateTime',
      label: 'Buy Date',
      render: (row) => renderStackedDateTime(row.buyDateTime),
      sortAccessor: (row) => getDateSortValue(row.buyDateTime),
      cellClassName: 'min-w-[10rem]'
    },
    {
      key: 'unsoldQty',
      label: 'Unsold Qty',
      align: 'right',
      render: (row) => formatQuantity(row.unsoldQty)
    },
    {
      key: 'avgBuyPrice',
      label: 'Avg Buy Price',
      align: 'right',
      render: (row) => formatCurrency(row.avgBuyPrice),
      footer: (row) => formatCurrency(row.avgBuyPrice)
    },
    {
      key: 'totalInvested',
      label: 'Total Invested',
      align: 'right',
      render: (row) => formatCurrency(row.totalInvested),
      footer: (row) => formatCurrency(row.totalInvested),
      cellClassName: 'font-semibold text-slate-900 dark:text-white'
    }
  ];

  const realizedTotals = useMemo(() => {
    if (!filteredTrades.length) {
      return null;
    }

    return filteredTrades.reduce(
      (accumulator, trade) => ({
        label: 'Totals',
        matchedQty: accumulator.matchedQty + trade.matchedQty,
        buyValue: accumulator.buyValue + trade.buyValue,
        sellValue: accumulator.sellValue + trade.sellValue,
        grossProfit: accumulator.grossProfit + trade.grossProfit,
        buySideFee: accumulator.buySideFee + (trade.buySideFee || 0),
        sellSideFee: accumulator.sellSideFee + (trade.sellSideFee || 0),
        fees: accumulator.fees + trade.fees,
        gstOnFees: accumulator.gstOnFees + trade.gstOnFees,
        tds: accumulator.tds + trade.tds,
        cryptoTax: accumulator.cryptoTax + trade.cryptoTax,
        cessAmount: accumulator.cessAmount + (trade.cessAmount || 0),
        totalTaxAmount: accumulator.totalTaxAmount + (trade.totalTaxAmount || trade.cryptoTax + (trade.cessAmount || 0)),
        finalNetProfit: accumulator.finalNetProfit + trade.finalNetProfit
      }),
      {
        label: 'Totals',
        matchedQty: 0,
        buyValue: 0,
        sellValue: 0,
        grossProfit: 0,
        buySideFee: 0,
        sellSideFee: 0,
        fees: 0,
        gstOnFees: 0,
        tds: 0,
        cryptoTax: 0,
        cessAmount: 0,
        totalTaxAmount: 0,
        finalNetProfit: 0
      }
    );
  }, [filteredTrades]);

  const openPositionTotals = useMemo(() => {
    if (!filteredOpenPositions.length) {
      return null;
    }

    const totals = filteredOpenPositions.reduce(
      (accumulator, position) => ({
        label: 'Totals',
        unsoldQty: accumulator.unsoldQty + position.unsoldQty,
        totalInvested: accumulator.totalInvested + position.totalInvested
      }),
      {
        label: 'Totals',
        unsoldQty: 0,
        totalInvested: 0
      }
    );

    return {
      ...totals,
      avgBuyPrice: totals.unsoldQty > 0 ? totals.totalInvested / totals.unsoldQty : 0
    };
  }, [filteredOpenPositions]);

  const visibleMobileTrades = filteredTrades.slice(0, mobileTradeVisibleCount);
  const visibleMobileOpenPositions = filteredOpenPositions.slice(0, mobileOpenVisibleCount);
  const mobileTradeHighlights = realizedTotals
    ? [
        {
          label: 'Filtered Gross',
          value: formatCurrency(realizedTotals.grossProfit),
          tone: realizedTotals.grossProfit >= 0 ? 'positive' : 'negative'
        },
        {
          label: 'Filtered Final',
          value: formatCurrency(realizedTotals.finalNetProfit),
          tone: realizedTotals.finalNetProfit >= 0 ? 'positive' : 'negative'
        },
        {
          label: 'Rows',
          value: String(filteredTrades.length),
          tone: 'neutral'
        }
      ]
    : [];
  const mobileHoldingHighlights = openPositionTotals
    ? [
        {
          label: 'Open Lots',
          value: String(filteredOpenPositions.length),
          tone: 'neutral'
        },
        {
          label: 'Avg Buy',
          value: formatCurrency(openPositionTotals.avgBuyPrice),
          tone: 'neutral'
        },
        {
          label: 'Invested',
          value: formatCurrency(openPositionTotals.totalInvested),
          tone: openPositionTotals.totalInvested > 0 ? 'accent' : 'neutral'
        }
      ]
    : [];

  const desktopActions = useMemo(
    () => ({
      sourceFile: currentFileName || safeReport?.meta?.sourceFile,
      processedAt: safeReport?.meta?.processedAt
    }),
    [currentFileName, safeReport]
  );

  return (
    <>
      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((currentValue) => currentValue.filter((toast) => toast.id !== id))}
      />

      <ProfileSetupModal
        open={profileModalOpen}
        canDismiss={hasSavedProfile}
        profileDraft={profileDraft}
        onProfileDraftChange={handleProfileDraftChange}
        onSave={saveProfile}
        onClose={() => setProfileModalOpen(false)}
      />

      <ImportIssuesModal
        open={Boolean(importIssuesModal)}
        title={importIssuesModal?.title || ''}
        message={importIssuesModal?.message || ''}
        issues={importIssuesModal?.issues || []}
        onClose={() => setImportIssuesModal(null)}
      />

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const [file] = [...event.target.files];
          handleFileSelected(file);
          event.target.value = '';
        }}
      />

      {isMobile ? (
        <MobileDashboardView
          theme={theme}
          onToggleTheme={() => setTheme((currentValue) => (currentValue === 'dark' ? 'light' : 'dark'))}
          onUploadClick={triggerUpload}
          onDownloadSample={downloadSample}
          onOpenProfile={openProfileModal}
          onRecalculateCurrentFile={lastUploadedFile ? recalculateCurrentFile : null}
          onClearReport={clearReport}
          report={safeReport}
          processing={processing}
          summary={summary}
          stats={stats}
          warnings={warnings}
          profile={profile}
          sourceFile={currentFileName || safeReport?.meta?.sourceFile}
          processedAt={safeReport?.meta?.processedAt}
          activeMobileTab={activeMobileTab}
          onActiveMobileTabChange={setActiveMobileTab}
          mobileMetricCards={mobileMetricCards}
          mobileOverviewCards={mobileOverviewCards}
          mobileTradeHighlights={mobileTradeHighlights}
          mobileHoldingHighlights={mobileHoldingHighlights}
          tradeSearch={tradeSearch}
          onTradeSearchChange={setTradeSearch}
          selectedTradeContract={selectedTradeContract}
          onSelectedTradeContractChange={setSelectedTradeContract}
          contracts={contracts}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onResetTradeFilters={() => {
            setTradeSearch('');
            setSelectedTradeContract('ALL');
            setStartDate('');
            setEndDate('');
          }}
          openSearch={openSearch}
          onOpenSearchChange={setOpenSearch}
          selectedOpenContract={selectedOpenContract}
          onSelectedOpenContractChange={setSelectedOpenContract}
          onResetHoldingFilters={() => {
            setOpenSearch('');
            setSelectedOpenContract('ALL');
          }}
          filteredTrades={filteredTrades}
          visibleMobileTrades={visibleMobileTrades}
          onLoadMoreTrades={() => setMobileTradeVisibleCount((currentValue) => currentValue + 8)}
          filteredOpenPositions={filteredOpenPositions}
          visibleMobileOpenPositions={visibleMobileOpenPositions}
          onLoadMoreHoldings={() => setMobileOpenVisibleCount((currentValue) => currentValue + 10)}
          analytics={safeReport?.analytics}
        />
      ) : (
        <>
          <AppHeader
            theme={theme}
            onToggleTheme={() => setTheme((currentValue) => (currentValue === 'dark' ? 'light' : 'dark'))}
            onUploadClick={triggerUpload}
            onDownloadSample={downloadSample}
            onClear={clearReport}
            hasReport={Boolean(safeReport)}
            report={safeReport}
            stats={stats}
            sourceFile={desktopActions.sourceFile}
            processedAt={desktopActions.processedAt}
          />

          <div className="space-y-6">
            <UploadDropzone
              inputRef={inputRef}
              onFileSelected={handleFileSelected}
              onDownloadSample={downloadSample}
              onOpenProfile={openProfileModal}
              onRecalculate={lastUploadedFile ? recalculateCurrentFile : null}
              isProcessing={processing}
              currentFileName={currentFileName || safeReport?.meta?.sourceFile}
              stats={stats}
              profile={profile}
            />

            <CalculationGuideSection />

            {processing ? <SkeletonGrid /> : null}

            {warnings.length ? (
              <StatusBanner
                tone="warning"
                title={`${warnings.length} validation warning${warnings.length > 1 ? 's' : ''}`}
                description="The engine skipped malformed rows and flagged unmatched sell quantities without stopping the full report."
                items={warnings.slice(0, 5)}
              />
            ) : null}

            {!safeReport && !processing ? <EmptyState onUploadClick={triggerUpload} onDownloadSample={downloadSample} /> : null}

            {safeReport ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {metricCards.map((card) => (
                    <MetricCard key={card.label} label={card.label} value={card.value} helper={card.helper} tone={card.tone} />
                  ))}
                </div>

                <SectionCard
                  title="Report Snapshot"
                  description="A high-confidence overview of realized performance, tax pressure, open capital, and current processing state before you dive into tables."
                  actions={<ExportMenu report={safeReport} sourceFile={activeSourceFile} processedAt={safeReport?.meta?.processedAt} buttonLabel="Exports" compact />}
                >
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                    <div
                      className={`relative overflow-hidden rounded-[30px] border p-6 shadow-soft ${
                        isDarkTheme
                          ? 'border-white/10 bg-gradient-to-br from-slate-900 via-[#10243a] to-[#0b1624] text-white'
                          : 'border-slate-200/80 bg-gradient-to-br from-white via-[#f3f8ff] to-[#edf8f4] text-slate-950'
                      }`}
                    >
                      <div
                        className={`pointer-events-none absolute -right-10 top-4 h-40 w-40 rounded-full blur-3xl ${
                          isDarkTheme ? 'bg-sky-500/18' : 'bg-sky-400/18'
                        }`}
                      />
                      <div
                        className={`pointer-events-none absolute bottom-0 left-0 h-44 w-44 rounded-full blur-3xl ${
                          isDarkTheme ? 'bg-mint-500/16' : 'bg-mint-400/20'
                        }`}
                      />
                      <div className="relative">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isDarkTheme ? 'text-mint-300' : 'text-mint-700'}`}>
                              Portfolio Health
                            </p>
                            <p className="mt-3 font-display text-4xl font-bold">{formatCurrency(summary.finalNetProfit)}</p>
                            <p className={`mt-3 max-w-xl text-sm leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                              This surface blends realized P&amp;L, tax drag, and open capital so the full session state stays clear
                              before you move into detailed FIFO review.
                            </p>
                          </div>
                          <div className="flex w-full flex-col gap-3 lg:max-w-[17rem] lg:items-end">
                            <div
                              className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] lg:self-end ${
                                summary.finalNetProfit >= 0
                                  ? isDarkTheme
                                    ? 'bg-mint-500/20 text-mint-100'
                                    : 'bg-mint-500/14 text-mint-800 ring-1 ring-mint-500/20'
                                  : isDarkTheme
                                    ? 'bg-coral-500/20 text-coral-100'
                                    : 'bg-coral-500/14 text-coral-800 ring-1 ring-coral-500/20'
                              }`}
                            >
                              {summary.finalNetProfit >= 0 ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                              ) : (
                                <TrendingDown className="h-3.5 w-3.5" />
                              )}
                              <span>{summary.finalNetProfit >= 0 ? 'Net Positive' : 'Net Negative'}</span>
                            </div>
                            <div
                              className={`w-full rounded-[22px] border px-4 py-3 text-sm ${
                                isDarkTheme ? 'border-white/10 bg-white/[0.08]' : 'border-slate-200/80 bg-white/80 shadow-[0_16px_35px_rgba(148,163,184,0.12)]'
                              }`}
                            >
                              <p className={`text-[11px] uppercase tracking-[0.18em] ${isDarkTheme ? 'text-slate-300' : 'text-slate-500'}`}>
                                Processed Session
                              </p>
                              <p className={`mt-2 max-w-[15rem] truncate font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                                {activeSourceFile}
                              </p>
                              <p className={`mt-1 text-xs ${isDarkTheme ? 'text-slate-300' : 'text-slate-500'}`}>
                                {safeReport?.meta?.processedAt || 'Waiting for import'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          <div
                            className={`rounded-[22px] px-4 py-4 ${
                              isDarkTheme ? 'bg-white/10' : 'border border-slate-200/70 bg-white/78 shadow-[0_18px_38px_rgba(148,163,184,0.1)]'
                            }`}
                          >
                            <p className={`text-[11px] uppercase tracking-[0.18em] ${isDarkTheme ? 'text-slate-300' : 'text-slate-500'}`}>Gross Profit</p>
                            <p className="mt-2 font-display text-2xl font-bold">{formatCurrency(summary.grossProfit)}</p>
                          </div>
                          <div
                            className={`rounded-[22px] px-4 py-4 ${
                              isDarkTheme ? 'bg-white/10' : 'border border-slate-200/70 bg-white/78 shadow-[0_18px_38px_rgba(148,163,184,0.1)]'
                            }`}
                          >
                            <p className={`text-[11px] uppercase tracking-[0.18em] ${isDarkTheme ? 'text-slate-300' : 'text-slate-500'}`}>Tax Load</p>
                            <p className="mt-2 font-display text-2xl font-bold">{formatCurrency(totalTaxLoad)}</p>
                          </div>
                          <div
                            className={`rounded-[22px] px-4 py-4 ${
                              isDarkTheme ? 'bg-white/10' : 'border border-slate-200/70 bg-white/78 shadow-[0_18px_38px_rgba(148,163,184,0.1)]'
                            }`}
                          >
                            <p className={`text-[11px] uppercase tracking-[0.18em] ${isDarkTheme ? 'text-slate-300' : 'text-slate-500'}`}>Open Exposure</p>
                            <p className="mt-2 font-display text-2xl font-bold">{formatCurrency(totalOpenExposure)}</p>
                          </div>
                        </div>

                        <div className={`mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
                          <span
                            className={`rounded-full px-3 py-2 ${
                              isDarkTheme ? 'bg-white/10' : 'border border-slate-200/70 bg-white/80 shadow-[0_10px_24px_rgba(148,163,184,0.08)]'
                            }`}
                          >
                            {stats?.validTrades || 0} valid trades
                          </span>
                          <span
                            className={`rounded-full px-3 py-2 ${
                              isDarkTheme ? 'bg-white/10' : 'border border-slate-200/70 bg-white/80 shadow-[0_10px_24px_rgba(148,163,184,0.08)]'
                            }`}
                          >
                            {stats?.realizedTradesCount || 0} realized cycles
                          </span>
                          <span
                            className={`rounded-full px-3 py-2 ${
                              isDarkTheme ? 'bg-white/10' : 'border border-slate-200/70 bg-white/80 shadow-[0_10px_24px_rgba(148,163,184,0.08)]'
                            }`}
                          >
                            {stats?.openPositionsCount || 0} open holdings
                          </span>
                          <span
                            className={`rounded-full px-3 py-2 ${
                              isDarkTheme ? 'bg-white/10' : 'border border-slate-200/70 bg-white/80 shadow-[0_10px_24px_rgba(148,163,184,0.08)]'
                            }`}
                          >
                            {warnings.length} warnings
                          </span>
                        </div>

                        <div
                          className={`mt-6 grid gap-3 rounded-[26px] border p-4 lg:grid-cols-[0.9fr_1.1fr] ${
                            isDarkTheme ? 'border-white/10 bg-white/6' : 'border-slate-200/80 bg-white/84 shadow-[0_22px_48px_rgba(148,163,184,0.12)]'
                          }`}
                        >
                          <div>
                            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDarkTheme ? 'text-slate-300' : 'text-slate-500'}`}>
                              Session Readout
                            </p>
                            <p className={`mt-3 text-sm leading-7 ${isDarkTheme ? 'text-slate-200' : 'text-slate-600'}`}>
                              Use this quick profile to compare how much of the session is being driven by realized profit,
                              tax drag, and capital still sitting in unmatched buy lots.
                            </p>
                          </div>
                          <div className="space-y-3">
                            {snapshotProfile.map((item) => (
                              <div key={item.label}>
                                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                  <span className={`font-medium ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>{item.label}</span>
                                  <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{item.value}</span>
                                </div>
                                <div
                                  className={`h-2 overflow-hidden rounded-full ${
                                    isDarkTheme ? 'bg-slate-700/70 ring-1 ring-white/5' : 'bg-slate-200 ring-1 ring-slate-300/60'
                                  }`}
                                >
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      ...item.barStyle,
                                      width: `${item.strength > 0 ? Math.max(item.strength, 10) : 0}%`
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <SnapshotFeatureCard
                        eyebrow="Best Performer"
                        title="Top Asset"
                        description={topAsset ? 'Best final net contributor across realized trades.' : 'Waiting for realized trades.'}
                        value={topAsset ? `${topAsset.contract} - ${formatCurrency(topAsset.finalNetProfit)}` : 'No data'}
                        tone={topAsset?.finalNetProfit >= 0 ? 'positive' : 'neutral'}
                      />
                      <SnapshotFeatureCard
                        eyebrow="Open Exposure"
                        title="Largest Open Holding"
                        description={largestOpenPosition ? 'Highest capital still locked in open spot holdings.' : 'No open holdings pending.'}
                        value={
                          largestOpenPosition
                            ? `${largestOpenPosition.contract} - ${formatCurrency(largestOpenPosition.totalInvested)}`
                            : 'Fully matched'
                        }
                        tone={largestOpenPosition ? 'accent' : 'neutral'}
                      />
                      <SnapshotFeatureCard
                        eyebrow="Workspace"
                        title="CSV Export"
                        description="Download the active session as one spreadsheet-ready file with realized spot trades and open holdings."
                        value="Ready"
                        tone="accent"
                      />
                    </div>
                  </div>
                </SectionCard>

                <AnalyticsPanel analytics={safeReport.analytics} />

                <SectionCard
                  title="Realized Trades"
                  description="Spot trade cycles matched with FIFO logic and fully expanded tax deductions."
                  actions={
                    <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white dark:bg-white dark:text-slate-900">
                      {filteredTrades.length} rows
                    </span>
                  }
                >
                  <div className="space-y-4">
                    <FilterBar
                      search={tradeSearch}
                      onSearchChange={setTradeSearch}
                      searchPlaceholder="Search pair or date"
                      contract={selectedTradeContract}
                      onContractChange={setSelectedTradeContract}
                      contracts={contracts}
                      startDate={startDate}
                      endDate={endDate}
                      onStartDateChange={setStartDate}
                      onEndDateChange={setEndDate}
                      onReset={() => {
                        setTradeSearch('');
                        setSelectedTradeContract('ALL');
                        setStartDate('');
                        setEndDate('');
                      }}
                    />
                    <DataTable
                      columns={tradeColumns}
                      rows={filteredTrades}
                      footerRow={realizedTotals}
                      defaultSortKey="sellDateTime"
                      defaultSortDirection="desc"
                      minTableWidth="min-w-[1180px]"
                      variant="trade-ledger"
                      emptyTitle="No realized trades match this filter"
                      emptyDescription="Try clearing search text, choosing a different pair, or widening the date range."
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Open Holdings"
                  description="Remaining unmatched spot buys, shown as currently unsold holdings."
                  actions={
                    <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white dark:bg-white dark:text-slate-900">
                      {filteredOpenPositions.length} rows
                    </span>
                  }
                >
                  <div className="space-y-4">
                    <FilterBar
                      search={openSearch}
                      onSearchChange={setOpenSearch}
                      searchPlaceholder="Search pair or buy date"
                      contract={selectedOpenContract}
                      onContractChange={setSelectedOpenContract}
                      contracts={contracts}
                      startDate=""
                      endDate=""
                      showDateFilters={false}
                      onReset={() => {
                        setOpenSearch('');
                        setSelectedOpenContract('ALL');
                      }}
                    />
                    <DataTable
                      columns={openColumns}
                      rows={filteredOpenPositions}
                      footerRow={openPositionTotals}
                      defaultSortKey="buyDateTime"
                      defaultSortDirection="asc"
                      minTableWidth="min-w-[760px]"
                      emptyTitle="No open holdings available"
                      emptyDescription="All matched buys were fully sold, or the current filters have hidden the remaining holdings."
                    />
                  </div>
                </SectionCard>
              </>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}

export default DashboardPage;
