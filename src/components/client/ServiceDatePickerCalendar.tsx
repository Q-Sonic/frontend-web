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
  /** Dates the artist has marked as unavailable (from their calendar settings). */
  blockedDates?: string[];
  /** Dates with confirmed contracts (ACCEPTED/COMPLETED). */
  reservedDates?: string[];
  /** Dates with pending contracts (PENDING/PENDING_ARTIST_SIGNATURE). */
  pendingDates?: string[];
};

export function ServiceDatePickerCalendar({
  selectedKeys,
  onToggleKey,
  selectedSummary,
  blockedDates,
  reservedDates,
  pendingDates,
}: ServiceDatePickerCalendarProps) {
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const canGoPrev =
    viewYear > currentYear || (viewYear === currentYear && viewMonth > currentMonth);

  const cells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);

  // Build lookup sets for O(1) access
  const blockedSet = useMemo(() => new Set(blockedDates ?? []), [blockedDates]);
  const reservedSet = useMemo(() => new Set(reservedDates ?? []), [reservedDates]);
  const pendingSet = useMemo(() => new Set(pendingDates ?? []), [pendingDates]);

  const hasAvailabilityData = blockedSet.size > 0 || reservedSet.size > 0 || pendingSet.size > 0;

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
        'rounded-2xl border border-[#00d4c8]/20 bg-gradient-to-b from-white/[0.05] via-[#0a0c0f] to-black/55 shadow-[0_0_36px_rgba(0,212,200,0.08)] ' +
        'p-4 sm:rounded-3xl sm:p-7 lg:p-8'
      }
      style={{ boxShadow: '0 0 32px rgba(0, 212, 200, 0.07), inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      <div className="mb-4 flex flex-col gap-2.5 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 sm:text-left sm:text-xs">
          Calendario
        </p>
        <div className="flex min-w-0 max-w-full items-center justify-center gap-0.5 self-stretch rounded-xl border border-white/10 bg-black/40 px-1 py-1.5 sm:gap-1 sm:self-end sm:rounded-2xl sm:px-2 sm:py-2">
          <button
            type="button"
            onClick={goPrevMonth}
            disabled={!canGoPrev}
            className="touch-manipulation rounded-lg p-2.5 text-neutral-300 transition hover:bg-white/10 hover:text-[#00d4c8] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-neutral-300 sm:rounded-xl"
            aria-label="Mes anterior"
          >
            <FiChevronLeft size={22} className="max-[380px]:h-5 max-[380px]:w-5" />
          </button>
          <span className="min-w-0 flex-1 truncate text-center text-[13px] font-semibold leading-tight text-neutral-100 sm:min-w-[10rem] sm:flex-none sm:text-base lg:min-w-[12rem] lg:text-lg">
            {formatMonthYearLabel(viewYear, viewMonth)}
          </span>
          <button
            type="button"
            onClick={goNextMonth}
            className="touch-manipulation rounded-lg p-2.5 text-neutral-300 transition hover:bg-white/10 hover:text-[#00d4c8] sm:rounded-xl"
            aria-label="Mes siguiente"
          >
            <FiChevronRight size={22} className="max-[380px]:h-5 max-[380px]:w-5" />
          </button>
        </div>
      </div>

      {selectedSummary ? (
        <div className="mb-4 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-3 text-sm sm:mb-5 sm:rounded-2xl sm:px-6 sm:py-4 sm:text-base">
          {selectedSummary}
        </div>
      ) : null}

      <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-white/10 bg-black/25 [-webkit-overflow-scrolling:touch] sm:overflow-hidden sm:rounded-2xl">
        <div className="grid min-w-[280px] grid-cols-7 gap-px bg-white/[0.08] sm:min-w-0">
          {WEEKDAYS_ES.map((d) => (
            <div
              key={d}
              className="bg-[#080a0c] px-0.5 py-2.5 text-center text-[9px] font-bold leading-tight tracking-wide text-neutral-500 max-[380px]:px-0 sm:py-3.5 sm:text-[11px] sm:text-xs lg:text-sm"
            >
              {d}
            </div>
          ))}
          {cells.map((cell, idx) => {
            const key = localDateKey(cell.date);
            const past = isBeforeToday(cell.date);
            const isBlocked = blockedSet.has(key);
            const isReserved = reservedSet.has(key);
            const isPending = pendingSet.has(key);
            const unavailable = isBlocked || isReserved || isPending;
            const selectable = !past && !unavailable;
            const selected = selectedKeys.has(key);
            const muted = !cell.inMonth;

            const baseCell =
              'relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 bg-[#080a0c] px-0.5 py-1.5 text-sm font-semibold tabular-nums transition ' +
              'touch-manipulation sm:min-h-[58px] sm:py-2.5 sm:text-base lg:min-h-[64px] lg:text-lg';

            let extra = '';
            let dot: string | null = null;
            let title = '';

            if (past) {
              extra = ' cursor-not-allowed text-neutral-600 opacity-35 line-through decoration-neutral-600';
            } else if (isReserved) {
              extra = ' cursor-not-allowed opacity-60';
              dot = 'bg-red-400';
              title = 'Fecha reservada';
            } else if (isPending) {
              extra = ' cursor-not-allowed opacity-70';
              dot = 'bg-amber-400';
              title = 'Fecha con solicitud pendiente';
            } else if (isBlocked) {
              extra = ' cursor-not-allowed opacity-50 text-neutral-600';
              dot = 'bg-neutral-500';
              title = 'Fecha no disponible';
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
                title={title || undefined}
                className={`${baseCell} ${extra}`}
              >
                <span>{cell.date.getDate()}</span>
                {dot && (
                  <span
                    className={`h-1 w-1 rounded-full ${dot}`}
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend — only shown when availability data is available */}
      {hasAvailabilityData && (
        <div className="mt-3 flex flex-col gap-2 px-0.5 text-[11px] text-neutral-500 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2 sm:px-1 sm:text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00d4c8]" />
            Disponible
          </span>
          {pendingSet.size > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Solicitud pendiente
            </span>
          )}
          {reservedSet.size > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Reservado
            </span>
          )}
          {blockedSet.size > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-500" />
              No disponible
            </span>
          )}
        </div>
      )}
    </div>
  );
}
