import { ARTIST_SERVICE_LINK_STATE_KEY } from '../components/ArtistServiceCard';
import type { ArtistServiceRecord } from '../types';

export type ArtistReservationState = {
  [ARTIST_SERVICE_LINK_STATE_KEY]: ArtistServiceRecord;
  preselectedDateKey?: string;
};

export function getPrimaryReservationService(
  services: ArtistServiceRecord[],
): ArtistServiceRecord | null {
  return services.find((service) => !!service?.id) ?? null;
}

export function buildReservationNavigationState(
  service: ArtistServiceRecord,
  preselectedDateKey?: string,
): ArtistReservationState {
  const state: ArtistReservationState = {
    [ARTIST_SERVICE_LINK_STATE_KEY]: service,
  };
  if (preselectedDateKey) state.preselectedDateKey = preselectedDateKey;
  return state;
}
