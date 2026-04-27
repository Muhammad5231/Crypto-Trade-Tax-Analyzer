import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { formatCompactCurrency, formatCurrency } from '../utils/formatters';
import SectionCard from './SectionCard';

const PIE_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef6c57', '#8b5cf6', '#06b6d4'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="ambient-surface-strong rounded-2xl p-3 text-sm">
      {label ? <p className="mb-2 font-semibold text-slate-900 dark:text-white">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((entry) => (
          <p key={entry.dataKey} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="ambient-surface flex h-full min-h-[260px] items-center justify-center rounded-[24px] border-dashed text-sm text-slate-500 dark:text-slate-400">
      {message}
    </div>
  );
}

function AnalyticsPanel({ analytics, compact = false }) {
  const realizedPnlByAsset = analytics?.realizedPnlByAsset || [];
  const openPositionsDistribution = analytics?.openPositionsDistribution || [];
  const monthlyPerformance = analytics?.monthlyPerformance || [];
  const taxBreakdown = analytics?.taxBreakdown || [];

  return (
    <SectionCard
      title="Analytics"
      description="Asset-wise profitability, tax distribution, and open holding concentration."
      compact={compact}
    >
      <div className={`grid gap-5 ${compact ? 'lg:grid-cols-1' : 'xl:grid-cols-2'}`}>
        <div className="ambient-surface rounded-[24px] p-4">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Realized P&amp;L by Spot Pair</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Final post-credit profit contribution by spot pair.
          </p>
          <div className={`mt-4 ${compact ? 'h-64' : 'h-80'}`}>
            {realizedPnlByAsset.length === 0 ? (
              <EmptyChart message="Upload a file to see realized asset performance." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={realizedPnlByAsset}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="contract" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={formatCompactCurrency} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="finalNetProfit" name="Final Net Profit" radius={[12, 12, 0, 0]}>
                    {realizedPnlByAsset.map((entry) => (
                      <Cell key={entry.contract} fill={entry.finalNetProfit >= 0 ? '#10b981' : '#ef6c57'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="ambient-surface rounded-[24px] p-4">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Open Holdings Distribution</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Invested capital still locked in unmatched buy lots.
          </p>
          <div className={`mt-4 ${compact ? 'h-64' : 'h-80'}`}>
            {openPositionsDistribution.length === 0 ? (
              <EmptyChart message="No open spot holdings are currently pending." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={openPositionsDistribution}
                    dataKey="totalInvested"
                    nameKey="contract"
                    innerRadius={68}
                    outerRadius={108}
                    paddingAngle={2}
                  >
                    {openPositionsDistribution.map((entry, index) => (
                      <Cell key={entry.contract} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  {compact ? null : <Legend />}
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="ambient-surface rounded-[24px] p-4">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Tax and Deduction Breakdown</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A direct view of fees, GST, TDS, and 30% crypto tax impact.
          </p>
          <div className={`mt-4 ${compact ? 'h-64' : 'h-72'}`}>
            {taxBreakdown.length === 0 ? (
              <EmptyChart message="Process a report to inspect your tax components." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taxBreakdown}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={formatCompactCurrency} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Amount" radius={[12, 12, 0, 0]} fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="ambient-surface rounded-[24px] p-4">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Monthly Final Net Trend</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Trend line based on realized spot-trade final net profit after tax credit.
          </p>
          <div className={`mt-4 ${compact ? 'h-64' : 'h-72'}`}>
            {monthlyPerformance.length === 0 ? (
              <EmptyChart message="Monthly analytics will appear after processing spot trade history." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyPerformance}>
                  <defs>
                    <linearGradient id="monthlyNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={formatCompactCurrency} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="finalNetProfit"
                    name="Final Net Profit"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#monthlyNet)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export default AnalyticsPanel;
