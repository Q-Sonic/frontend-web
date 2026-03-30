import { useMemo, useState } from 'react';
import { FaBuilding, FaChurch, FaMicrophone } from 'react-icons/fa';
import { ClientAreaHeader } from '../../components/client/ClientAreaHeader';
import { ClientFloatingChatButton } from '../../components/client/ClientFloatingChatButton';
import { ClientAreaPageShell } from '../../components/shared/ClientAreaPageShell';
import {
  mockClientCalendarEvents,
  mockClientCalendarMonthIndex,
  mockClientCalendarYear,
  mockClientUpcomingEvents,
  type ClientCalendarGridEvent,
} from '../../mocks/client';

const WEEKDAYS_ES = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'] as const;

const BROWN_TILE = 'bg-[#4a342c]/90 border-[#a67c52]/45';
const TEAL_TILE = 'bg-accent/25 border-accent/50';

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

function eventMatchesDay(ev: ClientCalendarGridEvent, day: Date): boolean {
  return (
    ev.year === day.getFullYear() &&
    ev.monthIndex0 === day.getMonth() &&
    ev.dayOfMonth === day.getDate()
  );
}

function EventGlyph({ icon }: { icon: ClientCalendarGridEvent['icon'] }) {
  const className = 'shrink-0 text-[11px] opacity-95';
  if (icon === 'church') return <FaChurch className={className} aria-hidden />;
  if (icon === 'mic') return <FaMicrophone className={className} aria-hidden />;
  return <FaBuilding className={className} aria-hidden />;
}

function formatMonthYearLabel(year: number, month: number): string {
  const raw = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1),
  );
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function monthOptions(): { value: string; label: string; year: number; month: number }[] {
  const out: { value: string; label: string; year: number; month: number }[] = [];
  for (let y = 2025; y <= 2027; y++) {
    for (let m = 0; m < 12; m++) {
      out.push({
        value: `${y}-${m}`,
        label: formatMonthYearLabel(y, m),
        year: y,
        month: m,
      });
    }
  }
  return out;
}

export function ClientEventsPage() {
  const options = useMemo(() => monthOptions(), []);
  const initialKey = `${mockClientCalendarYear}-${mockClientCalendarMonthIndex}`;
  const [monthKey, setMonthKey] = useState(initialKey);

  const selected = options.find((o) => o.value === monthKey) ?? options.find((o) => o.value === initialKey)!;
  const { year, month } = selected;

  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  return (
    <ClientAreaPageShell>
      <div
        className="rounded-2xl border border-accent/25 bg-[#0f1215] p-5 md:p-6 shadow-[0_0_18px_rgba(0,204,203,0.12)]"
        style={{ boxShadow: '0 0 24px rgba(0, 204, 203, 0.08), inset 0 1px 0 rgba(255,255,255,0.04)' }}
      >
          <ClientAreaHeader />

          <div className="flex flex-col xl:flex-row xl:items-start gap-8 pt-2">
            <section className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Calendario de eventos
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="sr-only">Mes y año</label>
                  <select
                    value={monthKey}
                    onChange={(e) => setMonthKey(e.target.value)}
                    className="rounded-xl bg-neutral-900/90 border border-white/10 px-3 py-2 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors shadow-[0_0_15px_rgba(0,204,203,0.25)]"
                  >
                    + Crear evento
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 overflow-hidden bg-black/20">
                <div className="grid grid-cols-7 gap-px bg-white/10">
                  {WEEKDAYS_ES.map((d) => (
                    <div
                      key={d}
                      className="bg-[#0f1215] px-1 py-2 text-center text-[11px] font-semibold tracking-wide text-neutral-500"
                    >
                      {d}
                    </div>
                  ))}
                  {cells.map((cell, idx) => {
                    const dayNum = cell.date.getDate();
                    const dayEvents = mockClientCalendarEvents.filter((ev) => eventMatchesDay(ev, cell.date));
                    return (
                      <div
                        key={`${cell.date.toISOString()}-${idx}`}
                        className={`min-h-[104px] p-1.5 flex flex-col gap-1 bg-[#0f1215] ${
                          cell.inMonth ? '' : 'opacity-40'
                        }`}
                      >
                        <span
                          className={`text-xs font-medium tabular-nums ${
                            cell.inMonth ? 'text-white' : 'text-neutral-500'
                          }`}
                        >
                          {dayNum}
                        </span>
                        <div className="flex flex-col gap-1 min-h-0">
                          {dayEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className={`rounded-lg border px-1.5 py-1 text-[10px] leading-snug ${
                                ev.kind === 'brown' ? BROWN_TILE : TEAL_TILE
                              }`}
                            >
                              <div className="flex items-start gap-1">
                                <EventGlyph icon={ev.icon} />
                                <div className="min-w-0">
                                  <p className="font-semibold text-white truncate">{ev.title}</p>
                                  <p className="text-neutral-300/90 truncate">{ev.subtitle}</p>
                                  {ev.timeLabel ? (
                                    <p className="text-neutral-400 mt-0.5 tabular-nums">{ev.timeLabel}</p>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className="w-full xl:w-[320px] shrink-0 xl:sticky xl:top-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Eventos Próximos</h2>
              <ul className="space-y-3">
                {mockClientUpcomingEvents.map((ev) => (
                  <li key={ev.id}>
                    <div
                      className={`rounded-xl border p-3 flex gap-3 ${
                        ev.kind === 'brown'
                          ? `${BROWN_TILE} shadow-[0_0_12px_rgba(166,124,82,0.12)]`
                          : `${TEAL_TILE} shadow-[0_0_15px_rgba(0,204,203,0.12)]`
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center w-14 shrink-0 rounded-lg bg-black/25 px-1 py-2">
                        <span className="text-xl font-bold text-white leading-none">{ev.dayLabel}</span>
                        <span className="text-[10px] font-semibold text-neutral-400 mt-1 tracking-wide">
                          {ev.monthLabel}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white text-sm leading-snug">{ev.title}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{ev.artistLabel}</p>
                        {ev.statusLabel ? (
                          <span className="inline-flex mt-2 rounded-full bg-accent/25 border border-accent/40 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                            {ev.statusLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
      </div>
      <ClientFloatingChatButton />
    </ClientAreaPageShell>
  );
}
