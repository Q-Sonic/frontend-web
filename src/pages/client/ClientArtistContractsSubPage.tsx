import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  ArtistDocumentLinkedServicesModal,
  ArtistProfileDocumentsServicesTable,
  Skeleton,
} from '../../components';
import { ClientArtistSectionHeader } from '../../components/client/ClientArtistSectionHeader';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import { getPrimaryReservationService } from '../../helpers/artistReservation';
import { normalizeMediaDownloadUrl } from '../../helpers/artistDocumentUrls';
import {
  buildClientContractTableRows,
  getLinkedServicesForClientContractRow,
} from '../../helpers/clientArtistDocuments';
import type { ArtistServiceRecord } from '../../types';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';

const TABLE_PAGE_SIZE = 4;

type AssociationsState =
  | null
  | { documentTitle: string; linkedServices: { id: string; name: string }[] };

export function ClientArtistContractsSubPage() {
  const { id } = useParams<{ id: string }>();
  const { basePath } = useArtistProfileNav();
  const { profile, services, artistDisplayName, loading, error } = useArtistProfileById(id);
  const [page, setPage] = useState(1);
  const [associations, setAssociations] = useState<AssociationsState>(null);

  const reservationService = getPrimaryReservationService(services);
  const reserveHref = reservationService
    ? `${basePath}/services/${reservationService.id}`
    : `${basePath}#documents`;

  const contractRows = useMemo(
    () => (id ? buildClientContractTableRows(services, id) : []),
    [services, id],
  );

  const totalPages = Math.max(1, Math.ceil(contractRows.length / TABLE_PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * TABLE_PAGE_SIZE;
    return contractRows.slice(start, start + TABLE_PAGE_SIZE);
  }, [contractRows, page]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const getDocumentUrl = (row: ArtistServiceRecord) => normalizeMediaDownloadUrl(row.contractPdfUrl);

  const openLinkedServices = (row: ArtistServiceRecord) => {
    setAssociations({
      documentTitle: row.name.trim() || 'Contrato',
      linkedServices: getLinkedServicesForClientContractRow(row, services),
    });
  };

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
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white break-words pr-1">
          Contratos disponibles
        </h2>
        <p className="text-sm text-neutral-400 max-w-3xl leading-relaxed [text-wrap:pretty]">
          Descarga el PDF de cada contrato y revisa qué servicios del artista lo utilizan.
        </p>
        <ArtistProfileDocumentsServicesTable
          services={paginatedRows}
          getDocumentUrl={getDocumentUrl}
          showPaymentColumn={false}
          disableDownloadWhenMissing
          mode="contract-management"
          managementReadOnly
          managementEmptyMessage="Este artista aún no tiene contratos disponibles para descarga."
          getDisplayName={(row) => row.name}
          onShowLinkedServices={openLinkedServices}
        />
        {contractRows.length > TABLE_PAGE_SIZE ? (
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <span className="text-center text-xs text-white/60 sm:mr-2 sm:text-left">
              Página {page} de {totalPages}
            </span>
            <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="min-h-[44px] flex-1 rounded-full border border-white/20 px-3 py-2 text-xs font-medium text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:min-w-[5.5rem] sm:flex-initial sm:py-2"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="min-h-[44px] flex-1 rounded-full border border-white/20 px-3 py-2 text-xs font-medium text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:min-w-[5.5rem] sm:flex-initial sm:py-2"
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <ArtistDocumentLinkedServicesModal
        isOpen={Boolean(associations)}
        variant="contract"
        documentTitle={associations?.documentTitle ?? ''}
        linkedServices={associations?.linkedServices ?? []}
        onClose={() => setAssociations(null)}
        audience="client"
      />
    </div>
  );
}
