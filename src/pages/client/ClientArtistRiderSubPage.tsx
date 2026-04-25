import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ArtistProfileRidersGrid, Skeleton } from '../../components';
import { ClientArtistSectionHeader } from '../../components/client/ClientArtistSectionHeader';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import { buildArtistRiderItems } from '../../helpers/artistRiderSections';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';

export function ClientArtistRiderSubPage() {
  const { id } = useParams<{ id: string }>();
  const { basePath } = useArtistProfileNav();
  const { profile, services, artistDisplayName, loading, error } = useArtistProfileById(id);

  const riderItems = useMemo(() => buildArtistRiderItems(services, profile), [profile, services]);

  if (!id) return <Navigate to="/client" replace />;

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto space-y-8 px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-12">
        <ClientArtistSectionHeader
          titleLead="Rider técnico de"
          artistDisplayName=""
          profile={null}
          basePath={basePath}
          loading
        />
        <Skeleton className="h-8 w-96 rounded-lg" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-12">
        <p className="text-red-400 text-sm leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-9 px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-12">
      <ClientArtistSectionHeader
        titleLead="Rider técnico de"
        artistDisplayName={artistDisplayName}
        profile={profile}
        basePath={basePath}
      />

      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
          Requisitos técnicos por tipo de show
        </h2>
        {riderItems.length > 0 ? (
          <ArtistProfileRidersGrid items={riderItems} />
        ) : (
          <p className="text-sm text-neutral-400 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center">
            Este artista aún no tiene rider técnico disponible.
          </p>
        )}
      </section>
    </div>
  );
}
