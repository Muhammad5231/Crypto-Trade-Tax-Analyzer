import { Calculator, ChevronDown, CircleAlert, CirclePercent, FileText, Scale } from 'lucide-react';

const OFFICIAL_SOURCES = [
  {
    label: 'Section 115BBH',
    href: 'https://www.incometaxindia.gov.in/w/section-115bbh-2'
  },
  {
    label: 'Section 194S',
    href: 'https://incometaxindia.gov.in/Acts/Income-tax%20Act%2C%201961/2025/102120000000091302.htm'
  },
  {
    label: 'CBDT Circular 13/2022',
    href: 'https://incometaxindia.gov.in/Communications/Circular/Circular-No-13-2022.pdf'
  },
  {
    label: 'CBIC GST rates',
    href: 'https://cbic-gst.gov.in/gst-goods-services-rates.html'
  }
];

function GuideBlock({ icon: Icon, title, items }) {
  return (
    <article className="ambient-surface rounded-[24px] p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint-500/10 text-mint-700 dark:text-mint-200">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function CalculationGuideSection({ compact = false }) {
  return (
    <section className="glass-panel overflow-hidden">
      <details className="group">
        <summary className={`relative cursor-pointer list-none ${compact ? 'px-4 py-4' : 'px-5 py-5 sm:px-6'}`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-mint-500/8 via-transparent to-sky-500/8" />
          <div className="relative min-w-0">
            <div className="absolute right-0 top-0 flex shrink-0 items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 transition group-open:border-mint-500/40 group-open:text-slate-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:group-open:text-white">
              <span>{compact ? 'Open' : 'Read guide'}</span>
              <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
            </div>
            <div className={compact ? 'pr-24' : 'pr-28'}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mint-600 dark:text-mint-300">Documentation</p>
              <h2 className={`mt-1 font-display font-bold tracking-tight text-slate-900 dark:text-white ${compact ? 'text-xl' : 'text-2xl'}`}>
                How this dashboard calculates
              </h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Easy-English notes for FIFO matching, saved exchange fees, GST on fees, and the India crypto spot-tax model used by this app as of April 28, 2026.
            </p>
          </div>
        </summary>

        <div className={`${compact ? 'border-t border-slate-200/70 p-4 dark:border-white/10' : 'border-t border-slate-200/70 p-5 sm:p-6 dark:border-white/10'}`}>
          <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'xl:grid-cols-2'}`}>
            <GuideBlock
              icon={Calculator}
              title="1. FIFO trade matching"
              items={[
                'Each sell is matched with the oldest available buy of the same spot pair.',
                'This is FIFO: first in, first out.',
                'If a buy is only partly used, the remaining quantity stays in Open Holdings.',
                'If a sell cannot be matched safely, the app shows a warning instead of forcing a fake result.'
              ]}
            />

            <GuideBlock
              icon={CirclePercent}
              title="2. Exchange fees and GST"
              items={[
                'The app uses your saved exchange profile for buy fee percent and sell fee percent.',
                'Buy fee is applied to matched buy value. Sell fee is applied to matched sell value.',
                'If your buy fee is 0, the dashboard can hide buy-fee columns to keep the table clean.',
                'GST is calculated on exchange or service fees, not on the full trade value.'
              ]}
            />

            <GuideBlock
              icon={Scale}
              title="3. India 2026 spot-tax model"
              items={[
                'Section 115BBH applies a 30% base tax on positive VDA gains.',
                'The app also adds a 4% Health and Education Cess on that 30% base tax amount.',
                'This app follows the practical rule that cost of acquisition is the main deductible amount in this crypto gain model.',
                'Section 194S applies 1% TDS on transfer consideration, subject to legal threshold rules.',
                'For fee GST, this dashboard uses an 18% exchange-service assumption based on GST service-rate guidance.'
              ]}
            />

            <GuideBlock
              icon={FileText}
              title="4. What the final numbers mean"
              items={[
                'Gross Profit = Sell Value - Buy Value.',
                'Total Fees = Buy Fee + Sell Fee.',
                'Net in Hand removes fees, GST, TDS, and tax from the realized cycle.',
                'Final Net adds TDS back for review, because TDS is withheld tax credit and not an exchange cost.'
              ]}
            />
          </div>

          <div className="mt-4 rounded-[24px] border border-copper-400/20 bg-copper-500/10 p-4 text-sm leading-6 text-copper-900 dark:text-copper-100">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Important note</p>
                <p className="mt-1">
                  This section is a product guide, not legal advice. Surcharge, cess, threshold edge cases, exchange-specific settlement behavior, and taxpayer-specific treatment may still need a professional review.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {OFFICIAL_SOURCES.map((source) => (
              <a
                key={source.label}
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="ambient-pill rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-mint-500 hover:text-slate-900 dark:text-slate-200"
              >
                {source.label}
              </a>
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}

export default CalculationGuideSection;
