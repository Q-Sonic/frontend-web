import { useMemo, useState } from 'react';
import type { ArtistProfileListFilters } from '../../api';
import { ClientAreaHeader } from '../../components/client/ClientAreaHeader';
import { ClientFloatingChatButton } from '../../components/client/ClientFloatingChatButton';
import { ClientAreaPageShell } from '../../components/shared/ClientAreaPageShell';
import { DiscoverArtistCard } from '../../components/shared/DiscoverArtistCard';
import { DiscoverFilterBar } from '../../components/shared/DiscoverFilterBar';
import { artistListItemToDiscoverCard } from '../../helpers/discoverArtistCard';
import type { DiscoverArtistCardDisplay } from '../../helpers/discoverArtistCard';
import { useArtistDiscoveryList } from '../../hooks/useArtistDiscoveryList';

export function DashboardPage() {
  const [filters, setFilters] = useState<ArtistProfileListFilters>({});
  const [search, setSearch] = useState('');
  const [playingCardKey, setPlayingCardKey] = useState<string | null>(null);

  const listFilters = useMemo(
    () => ({ ...filters, search: search.trim() || undefined }),
    [filters, search],
  );

  const { artists, loading, error } = useArtistDiscoveryList(listFilters);

  const gridItems: DiscoverArtistCardDisplay[] = useMemo(() => {
    const fromApi = artists.map((item) => artistListItemToDiscoverCard(item));
    return fromApi;
  }, [artists]);

  return (
    <ClientAreaPageShell>
      <div>
        <ClientAreaHeader searchValue={search} onSearchChange={setSearch} />

        <section className="pt-2 pb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Encuentra artistas para tu evento
          </h1>
          <p className="mt-2 text-sm md:text-base text-neutral-500">
            Explora cantantes disponibles cerca de ti, incluidos los artistas que se acaban de unir.
          </p>
        </section>

        <DiscoverFilterBar filters={filters} onChange={setFilters} />

        {error ? (
          <p className="text-sm text-red-400 pb-6" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-neutral-500 pb-8">Cargando artistas…</p>
        ) : null}

        <ul
          className="grid w-full list-none p-0 m-0 gap-5 md:gap-6 items-stretch justify-items-stretch"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
          }}
        >
          {gridItems.map((display, index) => {
            const cardKey = `${display.id}-${index}`;
            const isDemo = display.profileDisabled === true;
            return (
              <li key={cardKey} className="min-w-0 h-full min-h-0">
                <DiscoverArtistCard
                  artist={display}
                  cardKey={cardKey}
                  isPlaying={playingCardKey === cardKey}
                  onPlayRequest={() => setPlayingCardKey(cardKey)}
                  onStopRequest={() => setPlayingCardKey((k) => (k === cardKey ? null : k))}
                  profileHref={isDemo ? undefined : `/client/artists/${display.id}`}
                />
              </li>
            );
          })}
        </ul>
      </div>
      <ClientFloatingChatButton />
    </ClientAreaPageShell>
  );
}
