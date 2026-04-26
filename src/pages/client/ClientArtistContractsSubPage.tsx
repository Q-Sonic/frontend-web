import { Navigate, useParams } from 'react-router-dom';
import { ArtistProfileDocumentsServicesTable, Skeleton } from '../../components';
import { ClientArtistSectionHeader } from '../../components/client/ClientArtistSectionHeader';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import { contractPdfUrlForService } from '../../helpers/artistDocumentUrls';
import { getPrimaryReservationService } from '../../helpers/artistReservation';
import type { ArtistServiceRecord } from '../../types';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';

export function ClientArtistContractsSubPage() {
  const { id } = useParams<{ id: string }>();
  const { basePath } = useArtistProfileNav();
  const { profile, services, artistDisplayName, loading, error } = useArtistProfileById(id);
  const reservationService = getPrimaryReservationService(services);
  const reserveHref = reservationService
    ? `${basePath}/services/${reservationService.id}`
    : `${basePath}#documents`;

  const getDocumentUrl = (service: ArtistServiceRecord) => contractPdfUrlForService(service, profile);

  if (!id) return <Navigate to="/client" replace />;

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto space-y-8 px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-12">
        <ClientArtistSectionHeader
          titleLead="Contratos de"
          artistDisplayName=""
          profile={null}
          basePath={basePath}
          loading
        />
        <Skeleton className="h-8 w-80 rounded-lg" />
        <Skeleton className="h-56 rounded-2xl" />
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
    <div className="w-full max-w-[1600px] mx-auto space-y-8 px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-12">
      <ClientArtistSectionHeader
        titleLead="Contratos de"
        artistDisplayName={artistDisplayName}
        profile={profile}
        basePath={basePath}
        reserveHref={reserveHref}
      />

      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
          Listado de contratos por servicio
        </h2>
        <ArtistProfileDocumentsServicesTable
          services={services}
          getDocumentUrl={getDocumentUrl}
          showPaymentColumn={false}
          disableDownloadWhenMissing
        />
      </section>
    </div>
  );
}
