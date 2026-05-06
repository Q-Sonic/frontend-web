import { useCallback, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ArtistDocumentLinkedServicesModal, ArtistProfileRidersGrid, Skeleton } from '../../components';
import type { ArtistRiderItem } from '../../components';
import { ClientArtistSectionHeader } from '../../components/client/ClientArtistSectionHeader';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import { getPrimaryReservationService } from '../../helpers/artistReservation';
import {
  buildClientRiderCatalogItems,
  getLinkedServicesForClientRiderRow,
} from '../../helpers/clientArtistDocuments';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';

type RiderAssociationsState =
  | null
  | { documentTitle: string; linkedServices: { id: string; name: string }[] };

export function ClientArtistRiderSubPage() {
  const { id } = useParams<{ id: string }>();
  const { basePath } = useArtistProfileNav();
  const { profile, services, artistDisplayName, loading, error } = useArtistProfileById(id);
  const reservationService = getPrimaryReservationService(services);
  const reserveHref = reservationService
    ? `${basePath}/services/${reservationService.id}`
    : `${basePath}#documents`;
  const [associations, setAssociations] = useState<RiderAssociationsState>(null);

  const riderItems = useMemo(() => buildClientRiderCatalogItems(services, profile), [profile, services]);

  const openLinkedServices = useCallback(
    (item: ArtistRiderItem) => {
      setAssociations({
        documentTitle: item.title.trim() || 'Rider técnico',
        linkedServices: getLinkedServicesForClientRiderRow(item.id, services),
      });
    },
    [services],
  );

  const getOnViewLinkedServices = useCallback(
    (item: ArtistRiderItem) => () => openLinkedServices(item),
    [openLinkedServices],
  );

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
        reserveHref={reserveHref}
      />

      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white break-words pr-1">
          Riders técnicos disponibles
        </h2>
        <p className="text-sm text-neutral-400 max-w-3xl leading-relaxed [text-wrap:pretty]">
          Descarga cada rider en PDF y consulta a qué servicios aplica.
        </p>
        {riderItems.length > 0 ? (
          <ArtistProfileRidersGrid items={riderItems} getOnViewLinkedServices={getOnViewLinkedServices} />
        ) : (
          <p className="text-sm text-neutral-400 rounded-2xl border border-white/10 bg-white/3 px-4 py-8 text-center">
            Este artista aún no tiene rider técnico disponible.
          </p>
        )}
      </section>

      <ArtistDocumentLinkedServicesModal
        isOpen={Boolean(associations)}
        variant="rider"
        documentTitle={associations?.documentTitle ?? ''}
        linkedServices={associations?.linkedServices ?? []}
        onClose={() => setAssociations(null)}
        audience="client"
      />
    </div>
  );
}
