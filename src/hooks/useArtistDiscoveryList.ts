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
        if (cancelled) return;

        // Frontend safety filtering as fallback if backend didn't filter
        let filtered = [...rows];

        if (filters.genre) {
          const g = filters.genre.toLowerCase();
          filtered = filtered.filter((a) => a.genre?.toLowerCase().includes(g));
        }

        if (filters.city) {
          const c = filters.city.toLowerCase();
          filtered = filtered.filter((a) => a.city?.toLowerCase().includes(c));
        }

        if (filters.minPrice != null) {
          filtered = filtered.filter((a) => (a.price ?? 0) >= filters.minPrice!);
        }

        if (filters.maxPrice != null) {
          filtered = filtered.filter((a) => (a.price ?? 0) <= filters.maxPrice!);
        }

        setData(filtered);
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
