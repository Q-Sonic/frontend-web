import { useEffect, useState } from 'react';
import { getArtistProfileById, getArtistServicesByArtistId, getUser, fetchBookedDates } from '../api';
import { ApiError } from '../api/client';
import type { ArtistProfile, ArtistServiceRecord } from '../types';
import { withMinimumDelay } from '../helpers/withMinimumDelay';

export type UseArtistProfileByIdOptions = {
  /**
   * When `GET artist-profiles/:id` returns 404 (or empty data) and matches this uid,
   * use an empty profile so the owner can open edit modals and complete onboarding.
   */
  allowEmptyProfileForUid?: string;
  /** Used when `getUser` fails or has no display name (e.g. new account). */
  fallbackDisplayName?: string;
};

function emptyArtistProfile(uid: string): ArtistProfile & { uid: string } {
  return {
    uid,
    biography: '',
    city: '',
    socialNetworks: {},
    media: [],
    blockedDates: [],
  };
}

export function useArtistProfileById(
  artistUid: string | undefined,
  options?: UseArtistProfileByIdOptions,
) {
  const [profile, setProfile] = useState<(ArtistProfile & { uid: string }) | null>(null);
  const [services, setServices] = useState<ArtistServiceRecord[]>([]);
  const [artistDisplayName, setArtistDisplayName] = useState<string>('Artista');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [version, setVersion] = useState(0);

  const refetch = () => setVersion(v => v + 1);

  const allowEmpty = options?.allowEmptyProfileForUid;
  const fallbackName = options?.fallbackDisplayName;

  useEffect(() => {
    if (!artistUid) {
      setLoading(false);
      return;
    }

    const safeId = artistUid;
    setLoading(true);
    setError('');

    let cancelled = false;
    async function load() {
      try {
        await withMinimumDelay(1000, async () => {
          let profileData: (ArtistProfile & { uid: string }) | null = null;

          try {
            const fetched = await getArtistProfileById(safeId);
            if (fetched && typeof fetched === 'object') {
              profileData = { ...fetched, uid: fetched.uid ?? safeId };
            }
          } catch (err) {
            const is404 = err instanceof ApiError && err.status === 404;
            if (is404 && allowEmpty === safeId) {
              profileData = emptyArtistProfile(safeId);
            } else {
              throw err;
            }
          }

          if (!profileData) {
            if (allowEmpty === safeId) {
              profileData = emptyArtistProfile(safeId);
            } else {
              throw new Error('Perfil no encontrado.');
            }
          }

          const [servicesList, userData, booked] = await Promise.all([
            getArtistServicesByArtistId(safeId).catch(() => [] as ArtistServiceRecord[]),
            getUser(safeId).catch(() => null),
            fetchBookedDates(safeId).catch(() => [] as string[]),
          ]);

          if (cancelled) return;

          setProfile(profileData);
          setServices(servicesList ?? []);
          setBookedDates(booked ?? []);
          setArtistDisplayName(
            userData?.displayName?.trim() ||
              userData?.email?.trim() ||
              fallbackName?.trim() ||
              'Artista',
          );
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil.');
        setProfile(null);
        setServices([]);
        setBookedDates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [artistUid, allowEmpty, fallbackName, version]);

  return { profile, services, bookedDates, artistDisplayName, loading, error, refetch };
}
