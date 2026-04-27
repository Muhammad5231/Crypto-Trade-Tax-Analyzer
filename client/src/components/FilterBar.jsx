import { Search, SlidersHorizontal } from 'lucide-react';
import { useDeferredValue } from 'react';

function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  contract,
  onContractChange,
  contracts,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
  showDateFilters = true
}) {
  const deferredSearch = useDeferredValue(search);

  return (
    <div className="ambient-surface rounded-[24px] p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        <span className="ambient-pill rounded-full px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
          Searching: {deferredSearch || 'all'}
        </span>
      </div>
      <div className={`grid gap-3 md:grid-cols-2 ${showDateFilters ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
        <label className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="ambient-input w-full rounded-2xl px-11 py-3 text-sm text-slate-700 outline-none transition focus:border-mint-500 dark:text-slate-100"
          />
        </label>

        <select
          value={contract}
          onChange={(event) => onContractChange(event.target.value)}
          className="ambient-input w-full rounded-2xl px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-mint-500 dark:text-slate-100"
        >
          <option value="ALL">All pairs</option>
          {contracts.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {showDateFilters ? (
          <>
            <input
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange?.(event.target.value)}
              className="ambient-input w-full rounded-2xl px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-mint-500 dark:text-slate-100"
            />

            <div className="grid gap-3 sm:flex">
              <input
                type="date"
                value={endDate}
                onChange={(event) => onEndDateChange?.(event.target.value)}
                className="ambient-input w-full rounded-2xl px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-mint-500 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={onReset}
                className="ambient-pill rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-mint-500 hover:text-slate-900 dark:text-slate-200"
              >
                Reset
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="ambient-pill rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-mint-500 hover:text-slate-900 dark:text-slate-200"
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
