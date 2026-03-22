import { useEffect, useState } from 'react';
import { getArtistProfileById, getArtistServicesByArtistId, getUser } from '../api';
import type { ArtistProfile, ArtistServiceRecord } from '../types';
import { withMinimumDelay } from '../helpers/withMinimumDelay';

export function useArtistProfileById(artistUid: string | undefined) {
  const [profile, setProfile] = useState<(ArtistProfile & { uid: string }) | null>(null);
  const [services, setServices] = useState<ArtistServiceRecord[]>([]);
  const [artistDisplayName, setArtistDisplayName] = useState<string>('Artista');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        const [profileData, servicesList, userData] = await withMinimumDelay(1000, async () => {
          return Promise.all([
            getArtistProfileById(safeId),
            getArtistServicesByArtistId(safeId),
            getUser(safeId),
          ]);
        });

        if (cancelled) return;
        setProfile(profileData);
        setServices(servicesList);
        setArtistDisplayName(userData?.displayName || userData?.email || 'Artista');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [artistUid]);

  return { profile, services, artistDisplayName, loading, error };
}
