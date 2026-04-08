import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { localDateKey } from '../../helpers/artistProfile';

const WEEKDAYS_ES = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'] as const;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isBeforeToday(date: Date): boolean {
  const today = startOfLocalDay(new Date());
  return startOfLocalDay(date) < today;
}

function buildMonthCells(year: number, month: number): { inMonth: boolean; date: Date }[] {
  const first = new Date(year, month, 1);
  const pad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { inMonth: boolean; date: Date }[] = [];
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = pad - 1; i >= 0; i--) {
    const d = prevLast - i;
    cells.push({ inMonth: false, date: new Date(year, month - 1, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ inMonth: true, date: new Date(year, month, d) });
  }
  let next = 1;
  while (cells.length < 42) {
    cells.push({ inMonth: false, date: new Date(year, month + 1, next) });
    next += 1;
  }
  return cells;
}

function formatMonthYearLabel(year: number, month: number): string {
  const raw = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1),
  );
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export type ServiceDatePickerCalendarProps = {
  selectedKeys: Set<string>;
  onToggleKey: (key: string) => void;
  /** Shown inside the card above the day grid (e.g. selected dates summary). */
  selectedSummary?: ReactNode;
};

export function ServiceDatePickerCalendar({
  selectedKeys,
  onToggleKey,
  selectedSummary,
}: ServiceDatePickerCalendarProps) {
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const canGoPrev =
    viewYear > currentYear || (viewYear === currentYear && viewMonth > currentMonth);

  const cells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);

  function goPrevMonth() {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div
      className={
        'rounded-3xl border border-[#00d4c8]/20 bg-gradient-to-b from-white/[0.05] via-[#0a0c0f] to-black/55 ' +
        'p-5 shadow-[0_0_36px_rgba(0,212,200,0.08)] sm:p-6'
      }
      style={{ boxShadow: '0 0 32px rgba(0, 212, 200, 0.07), inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 sm:text-left">
          Calendario
        </p>
        <div className="flex items-center justify-center gap-1 self-center rounded-2xl border border-white/10 bg-black/40 px-1.5 py-1.5 sm:self-end">
          <button
            type="button"
            onClick={goPrevMonth}
            disabled={!canGoPrev}
            className="rounded-xl p-2 text-neutral-300 transition hover:bg-white/10 hover:text-[#00d4c8] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-neutral-300"
            aria-label="Mes anterior"
          >
            <FiChevronLeft size={20} />
          </button>
          <span className="min-w-[9.5rem] text-center text-sm font-semibold text-neutral-100 sm:min-w-[11rem] sm:text-base">
            {formatMonthYearLabel(viewYear, viewMonth)}
          </span>
          <button
            type="button"
            onClick={goNextMonth}
            className="rounded-xl p-2 text-neutral-300 transition hover:bg-white/10 hover:text-[#00d4c8]"
            aria-label="Mes siguiente"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      {selectedSummary ? (
        <div className="mb-4 rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 sm:px-5">
          {selectedSummary}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
        <div className="grid grid-cols-7 gap-px bg-white/[0.08]">
          {WEEKDAYS_ES.map((d) => (
            <div
              key={d}
              className="bg-[#080a0c] px-1 py-2.5 text-center text-[10px] font-bold tracking-wide text-neutral-500 sm:text-[11px]"
            >
              {d}
            </div>
          ))}
          {cells.map((cell, idx) => {
            const key = localDateKey(cell.date);
            const past = isBeforeToday(cell.date);
            const selectable = !past;
            const selected = selectedKeys.has(key);
            const muted = !cell.inMonth;

            const baseCell =
              'min-h-[46px] bg-[#080a0c] px-0.5 py-2 text-sm font-semibold tabular-nums transition sm:min-h-[52px] sm:text-[15px]';
            let extra = '';
            if (past) {
              extra =
                ' cursor-not-allowed text-neutral-600 opacity-35 line-through decoration-neutral-600';
            } else if (selected) {
              extra =
                ' z-[1] cursor-pointer rounded-lg ring-1 ring-[#00d4c8] bg-[#00d4c8]/18 text-white shadow-[0_0_16px_rgba(0,212,200,0.22)]';
            } else if (muted) {
              extra = ' cursor-pointer text-neutral-500 hover:bg-white/[0.06]';
            } else {
              extra = ' cursor-pointer text-neutral-100 hover:bg-white/[0.07]';
            }

            return (
              <button
                key={`${key}-${idx}`}
                type="button"
                disabled={!selectable}
                onClick={() => selectable && onToggleKey(key)}
                className={`${baseCell} ${extra}`}
              >
                {cell.date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
