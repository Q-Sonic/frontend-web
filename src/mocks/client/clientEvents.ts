import type { ClientCalendarGridEvent, ClientUpcomingEvent } from './types';

/** Calendar month shown in the mockup (April 2026). */
export const mockClientCalendarYear = 2026;
export const mockClientCalendarMonthIndex = 3; // April (0-based)

/** Events rendered inside the month grid (mockup). */
export const mockClientCalendarEvents: ClientCalendarGridEvent[] = [
  {
    id: 'e1',
    dayOfMonth: 16,
    monthIndex0: 3,
    year: 2026,
    title: 'Boda Luis & Carolina',
    subtitle: 'Carlos Vega',
    timeLabel: '20:00',
    kind: 'teal',
    icon: 'church',
  },
  {
    id: 'e2',
    dayOfMonth: 21,
    monthIndex0: 3,
    year: 2026,
    title: 'Presentación Fundación',
    subtitle: 'Sin artista',
    kind: 'brown',
    icon: 'mic',
  },
  {
    id: 'e3',
    dayOfMonth: 30,
    monthIndex0: 3,
    year: 2026,
    title: 'Evento empresa x',
    subtitle: 'Renacer Band',
    timeLabel: '20:00',
    kind: 'teal',
    icon: 'building',
  },
];

/** Right column — upcoming list (mockup). */
export const mockClientUpcomingEvents: ClientUpcomingEvent[] = [
  {
    id: 'u1',
    dayLabel: '16',
    monthLabel: 'ABR',
    title: 'Boda Luis & Carolina',
    artistLabel: 'Carlos Vega',
    kind: 'teal',
    statusLabel: 'Confirmado',
  },
  {
    id: 'u2',
    dayLabel: '21',
    monthLabel: 'ABR',
    title: 'Presentación Fundación',
    artistLabel: 'Sin artista',
    kind: 'brown',
  },
  {
    id: 'u3',
    dayLabel: '01',
    monthLabel: 'MAY',
    title: 'Evento empresa x',
    artistLabel: 'Renacer Band',
    kind: 'teal',
    statusLabel: 'Propuesta Enviada',
  },
];
