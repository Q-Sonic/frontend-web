import { useEffect, useMemo, useState } from 'react';
import type { UseArtistProfileByIdOptions } from '../../hooks/useArtistProfileById';
import { Navigate, useParams } from 'react-router-dom';
import {
  ArtistProfileDocumentsServicesTable,
  ArtistProfileRidersGrid,
  Skeleton,
} from '../../components';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import { useAuth } from '../../contexts/AuthContext';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';
import { buildArtistRiderItems } from '../../helpers/artistRiderSections';
import { contractPdfUrlForService } from '../../helpers/artistDocumentUrls';
import {
  MAX_PINNED_ITEMS,
  getPinnedItemIds,
  savePinnedItemIds,
  sortPinnedFirst,
  togglePinnedItemId,
} from '../../helpers/pinnedItems';
import { isBackendRoleArtista } from '../../helpers/role';
import type { ArtistServiceRecord } from '../../types';

export function ArtistProfileDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { exitHomePath } = useArtistProfileNav();
  const [infoBanner, setInfoBanner] = useState('');
  const [pinnedRiderIds, setPinnedRiderIds] = useState<string[]>([]);
  const isSelfArtist = !!user?.uid && isBackendRoleArtista(user.role) && user.uid === id;
  const profileLoadOptions: UseArtistProfileByIdOptions | undefined = useMemo(
    () =>
      isSelfArtist && user?.uid
        ? {
            allowEmptyProfileForUid: user.uid,
            fallbackDisplayName: user.displayName?.trim() || user.email?.trim(),
          }
        : undefined,
    [isSelfArtist, user?.uid, user?.displayName, user?.email],
  );
  const { profile, services, loading, error } = useArtistProfileById(id, profileLoadOptions);

  const getDocumentUrl = (service: ArtistServiceRecord) => contractPdfUrlForService(service, profile);
  const handleMissingDocumentClick = () => {
    setInfoBanner('Este artista aun no tiene un PDF cargado. Lo activaremos cuando backend reciba el archivo.');
  };

  const riderItems = useMemo(() => buildArtistRiderItems(services, profile), [profile, services]);
  const orderedRiderItems = useMemo(
    () => sortPinnedFirst(riderItems, pinnedRiderIds),
    [riderItems, pinnedRiderIds],
  );

  useEffect(() => {
    if (!id) {
      setPinnedRiderIds([]);
      return;
    }
    const validIds = new Set(riderItems.map((item) => item.id));
    const storedPinned = getPinnedItemIds(id, 'riders');
    const sanitizedPinned = storedPinned.filter((itemId) => validIds.has(itemId));
    const savedPinned = savePinnedItemIds(id, 'riders', sanitizedPinned);
    setPinnedRiderIds(savedPinned);
  }, [id, riderItems]);

  const handleToggleRiderPin = (riderId: string) => {
    const { nextPinnedIds, exceededLimit } = togglePinnedItemId(pinnedRiderIds, riderId);
    if (exceededLimit) {
      setInfoBanner(`Solo puedes fijar hasta ${MAX_PINNED_ITEMS} riders técnicos.`);
      return;
    }
    setInfoBanner('');
    const savedPinned = savePinnedItemIds(id, 'riders', nextPinnedIds);
    setPinnedRiderIds(savedPinned);
  };

  if (!id) return <Navigate to={exitHomePath} replace />;

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto space-y-8 px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-12">
        <div className="space-y-2">
          <Skeleton className="h-8 w-80 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-2xl rounded" />
        </div>
        <Skeleton className="h-56 rounded-2xl" />
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
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Listado de contratos por servicio
        </h1>
        <p className="text-sm text-white/60 max-w-3xl leading-relaxed">
          Consulta las condiciones clave de cada servicio y descarga el documento técnico del artista.
          {isSelfArtist ? ' Puedes revisar estos archivos tal como los ven tus clientes.' : ''}
        </p>
      </header>

      <section className="space-y-4">
        <ArtistProfileDocumentsServicesTable
          services={services}
          getDocumentUrl={getDocumentUrl}
          onMissingDocumentClick={handleMissingDocumentClick}
          showPaymentColumn={false}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white tracking-tight">Riders Técnicos disponibles</h2>
        {infoBanner && (
          <p className="text-xs text-[#00d4c8] bg-[#00d4c8]/10 border border-[#00d4c8]/30 rounded-lg px-3 py-2">
            {infoBanner}
          </p>
        )}
        <ArtistProfileRidersGrid
          items={orderedRiderItems}
          pinnedIds={pinnedRiderIds}
          onMissingDocumentClick={handleMissingDocumentClick}
          canTogglePin={isSelfArtist}
          onTogglePin={isSelfArtist ? handleToggleRiderPin : undefined}
        />
      </section>
    </div>
  );
}
