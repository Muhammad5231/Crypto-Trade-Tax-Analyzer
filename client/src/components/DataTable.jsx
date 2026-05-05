import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

function compareValues(leftValue, rightValue) {
  if (leftValue instanceof Date && rightValue instanceof Date) {
    return leftValue.getTime() - rightValue.getTime();
  }

  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return leftValue - rightValue;
  }

  return String(leftValue ?? '').localeCompare(String(rightValue ?? ''));
}

function DataTable({
  columns,
  rows,
  defaultSortKey,
  defaultSortDirection = 'desc',
  pageSize = 8,
  minTableWidth = 'min-w-full',
  emptyTitle,
  emptyDescription,
  footerRow,
  variant = 'default'
}) {
  const [sortKey, setSortKey] = useState(defaultSortKey || columns[0]?.key);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  useEffect(() => {
    setPage(1);
  }, [sortKey, sortDirection]);

  const sortedRows = [...rows].sort((leftRow, rightRow) => {
    const column = columns.find((item) => item.key === sortKey);

    if (!column) {
      return 0;
    }

    const leftValue = column.sortAccessor ? column.sortAccessor(leftRow) : leftRow[sortKey];
    const rightValue = column.sortAccessor ? column.sortAccessor(rightRow) : rightRow[sortKey];
    const comparison = compareValues(leftValue, rightValue);

    return sortDirection === 'asc' ? comparison : comparison * -1;
  });

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paginatedRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);
  const variantClasses =
    variant === 'trade-ledger'
      ? {
          shell: 'overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,22,35,0.98),rgba(10,19,31,0.98))] shadow-[0_24px_70px_rgba(2,6,23,0.28)]',
          table: 'divide-y divide-white/8 text-[15px]',
          head: 'bg-white/[0.03] backdrop-blur-md',
          headCell: 'px-5 py-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300',
          button: 'hover:text-white',
          body: 'divide-y divide-white/6',
          row: 'hover:bg-white/[0.035]',
          zebra: 'bg-white/[0.015]',
          cell: 'px-5 py-5 text-slate-100',
          footer: 'bg-slate-950/30',
          footerCell: 'px-5 py-5 text-[15px] font-semibold text-white'
        }
      : {
          shell: 'ambient-surface-strong overflow-hidden rounded-[24px]',
          table: 'divide-y divide-slate-200 text-sm dark:divide-white/10',
          head: 'ambient-table-head sticky top-0 z-10',
          headCell: 'px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400',
          button: 'hover:text-slate-800 dark:hover:text-white',
          body: 'ambient-table-body divide-y divide-slate-200 dark:divide-white/10',
          row: 'hover:bg-white/20 dark:hover:bg-white/[0.045]',
          zebra: 'bg-slate-100/30 dark:bg-white/[0.02]',
          cell: 'px-4 py-3.5 text-slate-700 dark:text-slate-200',
          footer: 'ambient-table-foot sticky bottom-0 z-10',
          footerCell: 'px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white'
        };

  return (
    <div className="space-y-4">
      <div className={variantClasses.shell}>
        <div className="overflow-x-auto overflow-y-visible scrollbar-thin">
          <table className={`w-full ${minTableWidth} ${variantClasses.table}`}>
            <thead className={`sticky top-0 z-10 ${variantClasses.head}`}>
              <tr>
                {columns.map((column) => {
                  const isSorted = sortKey === column.key;

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      className={`whitespace-nowrap text-left ${variantClasses.headCell} ${
                        column.align === 'right' ? 'text-right' : ''
                      }`}
                    >
                      {column.sortable === false ? (
                        column.label
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (sortKey === column.key) {
                              setSortDirection((currentValue) => (currentValue === 'asc' ? 'desc' : 'asc'));
                            } else {
                              setSortKey(column.key);
                              setSortDirection(column.initialDirection || 'desc');
                            }
                          }}
                          className={`inline-flex w-full items-center gap-2 transition ${variantClasses.button} ${
                            column.align === 'right' ? 'justify-end' : ''
                          }`}
                        >
                          <span>{column.label}</span>
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                          )}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className={variantClasses.body}>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{emptyTitle}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{emptyDescription}</p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`transition ${variantClasses.row} ${
                      index % 2 === 1 ? variantClasses.zebra : ''
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={`${row.id}-${column.key}`}
                        className={`whitespace-nowrap align-top ${variantClasses.cell} ${
                          column.align === 'right' ? 'text-right' : ''
                        } ${typeof column.cellClassName === 'function' ? column.cellClassName(row) : column.cellClassName || ''}`}
                      >
                        {column.render ? column.render(row, (page - 1) * pageSize + index, index) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {footerRow ? (
              <tfoot className={`sticky bottom-0 z-10 ${variantClasses.footer}`}>
                <tr className={variant === 'trade-ledger' ? 'border-t border-white/8' : 'border-t border-slate-300/80 dark:border-white/10'}>
                  {columns.map((column) => (
                    <td
                      key={`footer-${column.key}`}
                      className={`${variantClasses.footerCell} ${
                        column.align === 'right' ? 'text-right' : ''
                      } ${typeof column.footerClassName === 'function' ? column.footerClassName(footerRow) : column.footerClassName || ''}`}
                    >
                      {column.footer ? column.footer(footerRow) : ''}
                    </td>
                  ))}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{paginatedRows.length}</span> of{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{rows.length}</span> rows
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((currentValue) => Math.max(1, currentValue - 1))}
            className="ambient-pill rounded-full px-3 py-1.5 font-semibold text-slate-700 transition hover:border-mint-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200"
          >
            Previous
          </button>
          <span className="ambient-pill rounded-full px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-100">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((currentValue) => Math.min(totalPages, currentValue + 1))}
            className="ambient-pill rounded-full px-3 py-1.5 font-semibold text-slate-700 transition hover:border-mint-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
