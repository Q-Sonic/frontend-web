export type ClientArtistCard = {
  id: string;
  name: string;
  genre: string;
  priceUsd: number;
  /** When set, show clock + date instead of "Disponible hoy" */
  availableDateLabel?: string;
  /** When true, show green dot "Disponible hoy" */
  availableToday: boolean;
  imageUrl: string;
};

export type ClientCalendarEventKind = 'teal' | 'brown';

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
