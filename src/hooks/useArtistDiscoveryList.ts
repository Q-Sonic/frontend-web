import { useEffect, useMemo, useState } from 'react';
import { listArtistProfiles, type ArtistProfileListFilters } from '../api';
import type { ArtistProfileListItem } from '../types';

export function useArtistDiscoveryList(filters: ArtistProfileListFilters) {
  const [data, setData] = useState<ArtistProfileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    listArtistProfiles(filters)
      .then((rows) => {
        if (!cancelled) setData(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar la lista.');
          setData([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterKey]);

  return { artists: data, loading, error };
}
