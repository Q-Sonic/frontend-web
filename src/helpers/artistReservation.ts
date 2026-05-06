import { ARTIST_SERVICE_LINK_STATE_KEY } from '../components/ArtistServiceCard';
import type { ArtistServiceRecord } from '../types';
import { isArtistServiceBookable } from './artistServiceVisibility';

export type ArtistReservationState = {
  [ARTIST_SERVICE_LINK_STATE_KEY]: ArtistServiceRecord;
  preselectedDateKey?: string;
};

/** First service in the given order that is bookable (contract + rider técnico vinculados). */
export function getPrimaryReservationService(
  services: ArtistServiceRecord[],
): ArtistServiceRecord | null {
  for (const service of services) {
    if (service?.id && isArtistServiceBookable(service)) return service;
  }
  return null;
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
