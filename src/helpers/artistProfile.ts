/** Accent used in artist public profile UI (availability, audio player, etc.). */
export const ARTIST_PROFILE_ACCENT = '#00d4c8';

export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function weekdayShortEs(d: Date): string {
  const raw = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace(/\./g, '');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function defaultAvailabilitySelection(days: Date[], blocked: Set<string>): string {
  const firstOpen = days.find((dt) => !blocked.has(localDateKey(dt)));
  return firstOpen ? localDateKey(firstOpen) : localDateKey(days[0]!);
}
