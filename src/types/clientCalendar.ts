/** Calendar grid / upcoming list for signed contracts (client area). */
export type ClientCalendarEventKind = 'teal' | 'brown' | 'pending' | 'ready';

export type ClientCalendarGridEvent = {
  id: string;
  dayOfMonth: number;
  monthIndex0: number;
  year: number;
  title: string;
  subtitle: string;
  timeLabel?: string;
  kind: ClientCalendarEventKind;
  icon: 'church' | 'mic' | 'building';
};

export type ClientUpcomingEvent = {
  id: string;
  dayLabel: string;
  monthLabel: string;
  title: string;
  artistLabel: string;
  kind: ClientCalendarEventKind;
  statusLabel?: string;
};
