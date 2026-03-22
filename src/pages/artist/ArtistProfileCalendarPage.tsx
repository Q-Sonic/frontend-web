import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import { localDateKey } from '../../helpers/artistProfile';
import { DEMO_BLOCKED_DATES_MAY_2026 } from '../../mocks/client';
import { Skeleton } from '../../components';

const WEEKDAYS_ES_LONG = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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

function monthLabelEs(year: number, month: number): string {
  const raw = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1),
  );
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function ArtistProfileCalendarPage() {
  const { id } = useParams<{ id: string }>();
  const { profile, artistDisplayName, loading, error } = useArtistProfileById(id);

  /** Default May 2026 so demo blocked dates from the mockup align when API has no blockedDates. */
  const [view, setView] = useState({ y: 2026, m: 4 });

  const blockedSet = useMemo(() => {
    const fromApi = profile?.blockedDates ?? [];
    const set = new Set(fromApi);
    if (set.size === 0 && profile) {
      DEMO_BLOCKED_DATES_MAY_2026.forEach((k) => set.add(k));
    }
    return set;
  }, [profile]);

  const cells = useMemo(() => buildMonthCells(view.y, view.m), [view.y, view.m]);

  const monthOptions = useMemo(() => {
    const out: { y: number; m: number; label: string }[] = [];
    for (let y = 2024; y <= 2028; y++) {
      for (let m = 0; m < 12; m++) {
        out.push({ y, m, label: monthLabelEs(y, m) });
      }
    }
    return out;
  }, []);

  const currentKey = `${view.y}-${view.m}`;

  if (!id) return <Navigate to="/artist" replace />;

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 text-neutral-400 text-sm">
        {error || 'No se pudo cargar el calendario.'}
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-8 pb-16 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Calendario · {artistDisplayName}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Fechas no disponibles según configuración del artista.
        </p>
      </div>

      <div
        className="rounded-2xl border border-white/10 bg-[#121820] p-4 md:p-6 shadow-[0_0_20px_rgba(0,204,203,0.08)]"
        style={{ boxShadow: '0 0 24px rgba(0, 212, 200, 0.06)' }}
      >
        <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
              aria-label="Mes anterior"
              onClick={() => {
                setView((v) => {
                  const d = new Date(v.y, v.m - 1, 1);
                  return { y: d.getFullYear(), m: d.getMonth() };
                });
              }}
            >
              <FiChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
              aria-label="Mes siguiente"
              onClick={() => {
                setView((v) => {
                  const d = new Date(v.y, v.m + 1, 1);
                  return { y: d.getFullYear(), m: d.getMonth() };
                });
              }}
            >
              <FiChevronRight size={22} />
            </button>
          </div>
          <label className="sr-only">Mes</label>
          <select
            className="rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm text-white font-medium min-w-[200px] focus:outline-none focus:ring-2 focus:ring-accent/30"
            value={currentKey}
            onChange={(e) => {
              const [ys, ms] = e.target.value.split('-');
              setView({ y: Number(ys), m: Number(ms) });
            }}
          >
            {monthOptions.map((o) => (
              <option key={`${o.y}-${o.m}`} value={`${o.y}-${o.m}`}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-white/10">
            {WEEKDAYS_ES_LONG.map((d) => (
              <div
                key={d}
                className="bg-[#0f141c] px-1 py-2.5 text-center text-[11px] md:text-xs font-medium text-neutral-400"
              >
                {d}
              </div>
            ))}
            {cells.map((cell, idx) => {
              const key = localDateKey(cell.date);
              const blocked = blockedSet.has(key);
              const dayNum = cell.date.getDate();
              const inMonth = cell.inMonth;

              return (
                <div
                  key={`${key}-${idx}`}
                  className={`min-h-[88px] p-2 flex flex-col bg-[#0f141c] ${
                    inMonth ? '' : 'opacity-45'
                  } ${blocked && inMonth ? 'bg-[#4A151B]/95' : ''}`}
                >
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      inMonth ? 'text-white' : 'text-neutral-600'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {blocked && inMonth ? (
                    <span className="mt-auto text-[10px] md:text-[11px] font-medium text-[#FF4D4D] leading-tight">
                      No Disponible
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
