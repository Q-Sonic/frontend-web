import type { ClientCalendarGridEvent, ClientUpcomingEvent } from '../mocks/client/types';
import type { SignedCartMockRecord } from './clientServiceCart';

export function parseContractDateKey(key: string): { y: number; m0: number; d: number } | null {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d || m > 12 || d > 31) return null;
  return { y, m0: m - 1, d };
}

function timeFromSignedAt(iso: string): string | undefined {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return undefined;
  return new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function fallbackDateKeyFromSignedAt(iso: string): string | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const dt = new Date(t);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildCalendarGridEventsFromSignedRecords(
  records: SignedCartMockRecord[],
): ClientCalendarGridEvent[] {
  const grid: ClientCalendarGridEvent[] = [];
  for (const record of records) {
    const ready = record.artistSignatureComplete === true;
    const kind = ready ? 'ready' : 'pending';
    const timeLabel = timeFromSignedAt(record.signedAt);
    for (const line of record.lines) {
      const artist = line.artistDisplayName?.trim() || 'Artista';
      let dateKeys =
        line.selectedDateKeys.length > 0 ? [...line.selectedDateKeys].sort() : [];
      if (dateKeys.length === 0) {
        const fb = fallbackDateKeyFromSignedAt(record.signedAt);
        if (fb) dateKeys = [fb];
      }
      for (const dk of dateKeys) {
        const parts = parseContractDateKey(dk);
        if (!parts) continue;
        grid.push({
          id: `signed-${line.id}-${dk}`,
          year: parts.y,
          monthIndex0: parts.m0,
          dayOfMonth: parts.d,
          title: line.serviceName,
          subtitle: artist,
          timeLabel,
          kind,
          icon: 'mic',
        });
      }
    }
  }
  return grid;
}

const MONTH_LABELS = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
] as const;

export function buildUpcomingEventsFromGrid(grid: ClientCalendarGridEvent[]): ClientUpcomingEvent[] {
  const decorated = grid.map((ev) => ({
    ev,
    unix: new Date(ev.year, ev.monthIndex0, ev.dayOfMonth).getTime(),
  }));
  decorated.sort((a, b) => a.unix - b.unix);
  return decorated.slice(0, 40).map(({ ev }) => ({
    id: `up-${ev.id}`,
    dayLabel: String(ev.dayOfMonth).padStart(2, '0'),
    monthLabel: MONTH_LABELS[ev.monthIndex0] ?? '—',
    title: ev.title,
    artistLabel: ev.subtitle,
    kind: ev.kind,
    statusLabel: ev.kind === 'ready' ? 'Listo' : 'Pendiente',
  }));
}
