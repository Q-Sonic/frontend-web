import { useEffect, useMemo, useState } from 'react';
import type { UseArtistProfileByIdOptions } from '../../hooks/useArtistProfileById';
import { Navigate, useParams } from 'react-router-dom';
import { FiDownload, FiEdit2, FiPlus, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import {
  ArtistProfileDocumentsServicesTable,
  ArtistProfileRidersGrid,
  Skeleton,
} from '../../components';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import { useAuth } from '../../contexts/AuthContext';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';
import { updateArtistProfileWithFormData } from '../../api';
import { DEFAULT_RIDER_SECTIONS, buildArtistRiderItems } from '../../helpers/artistRiderSections';
import { contractPdfUrlForService, technicalRiderPdfFromProfile } from '../../helpers/artistDocumentUrls';
import {
  MAX_PINNED_ITEMS,
  getPinnedItemIds,
  savePinnedItemIds,
  sortPinnedFirst,
  togglePinnedItemId,
} from '../../helpers/pinnedItems';
import { isBackendRoleArtista } from '../../helpers/role';
import type { ArtistServiceRecord } from '../../types';

const TABLE_PAGE_SIZE = 4;
type DocumentModalTarget = 'contract' | 'rider';

type EditableDocument = {
  name: string;
  description: string;
  documentUrl: string;
};

type DocumentModalState = {
  isOpen: boolean;
  target: DocumentModalTarget;
  mode: 'create' | 'edit';
  itemId: string | null;
  name: string;
  description: string;
  file: File | null;
};

export function ArtistProfileDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { exitHomePath } = useArtistProfileNav();
  const [infoBanner, setInfoBanner] = useState('');
  const [isUploadingRider, setIsUploadingRider] = useState(false);
  const [riderDocumentOverride, setRiderDocumentOverride] = useState<string | null>(null);
  const [pinnedRiderIds, setPinnedRiderIds] = useState<string[]>([]);
  const [contractsPage, setContractsPage] = useState(1);
  const [ridersPage, setRidersPage] = useState(1);
  const [contractOverrides, setContractOverrides] = useState<Record<string, EditableDocument>>({});
  const [riderOverrides, setRiderOverrides] = useState<Record<string, EditableDocument>>({});
  const [manualContracts, setManualContracts] = useState<ArtistServiceRecord[]>([]);
  const [manualRiders, setManualRiders] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      bulletItems: string[];
      imageUrl?: string;
      documentUrl?: string;
    }>
  >([]);
  const [documentModal, setDocumentModal] = useState<DocumentModalState>({
    isOpen: false,
    target: 'contract',
    mode: 'create',
    itemId: null,
    name: '',
    description: '',
    file: null,
  });
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

  const getDocumentUrl = (service: ArtistServiceRecord) =>
    contractOverrides[service.id]?.documentUrl ?? contractPdfUrlForService(service, profile);
  const getContractDisplayName = (service: ArtistServiceRecord) => contractOverrides[service.id]?.name ?? service.name;
  const getRiderDisplayName = (riderId: string, fallback: string) => riderOverrides[riderId]?.name ?? fallback;
  const handleMissingDocumentClick = () => {
    setInfoBanner('Este artista aun no tiene un PDF cargado. Lo activaremos cuando backend reciba el archivo.');
  };
  const handleDeleteDocument = (_service: ArtistServiceRecord) => {
    setInfoBanner('Eliminacion de PDF pendiente de integracion con backend.');
  };

  const profileWithRiderOverride = useMemo(() => {
    if (!profile || riderDocumentOverride === null) return profile;
    return {
      ...profile,
      technicalRiderUrl: riderDocumentOverride || undefined,
      riderUrl: riderDocumentOverride || undefined,
    };
  }, [profile, riderDocumentOverride]);

  const riderItems = useMemo(
    () => buildArtistRiderItems(services, profileWithRiderOverride),
    [profileWithRiderOverride, services],
  );
  const orderedRiderItems = useMemo(
    () => sortPinnedFirst(riderItems, pinnedRiderIds),
    [riderItems, pinnedRiderIds],
  );
  const riderTableRows = useMemo(() => {
    if (orderedRiderItems.length > 0) return orderedRiderItems;
    const profileRiderUrl = technicalRiderPdfFromProfile(profileWithRiderOverride);
    return DEFAULT_RIDER_SECTIONS.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      bulletItems: [...section.bulletItems],
      imageUrl: '',
      documentUrl: profileRiderUrl,
    }));
  }, [orderedRiderItems, profileWithRiderOverride]);
  const allContractRows = useMemo(() => [...services, ...manualContracts], [manualContracts, services]);
  const allRiderRows = useMemo(() => [...riderTableRows, ...manualRiders], [manualRiders, riderTableRows]);
  const totalContractsPages = Math.max(1, Math.ceil(allContractRows.length / TABLE_PAGE_SIZE));
  const totalRidersPages = Math.max(1, Math.ceil(allRiderRows.length / TABLE_PAGE_SIZE));
  const paginatedServices = useMemo(() => {
    const start = (contractsPage - 1) * TABLE_PAGE_SIZE;
    return allContractRows.slice(start, start + TABLE_PAGE_SIZE);
  }, [allContractRows, contractsPage]);
  const paginatedRiderRows = useMemo(() => {
    const start = (ridersPage - 1) * TABLE_PAGE_SIZE;
    return allRiderRows.slice(start, start + TABLE_PAGE_SIZE);
  }, [allRiderRows, ridersPage]);

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

  useEffect(() => {
    setContractsPage((prev) => Math.min(prev, totalContractsPages));
  }, [totalContractsPages]);

  useEffect(() => {
    setRidersPage((prev) => Math.min(prev, totalRidersPages));
  }, [totalRidersPages]);

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

  const handleUploadRiderDocument = async (file: File) => {
    if (!isSelfArtist) return;
    setIsUploadingRider(true);
    setInfoBanner('');
    try {
      const formData = new FormData();
      formData.append('rider', file);
      const updatedProfile = await updateArtistProfileWithFormData(formData);
      const nextRiderUrl = technicalRiderPdfFromProfile(updatedProfile) ?? '';
      setRiderDocumentOverride(nextRiderUrl);
      setInfoBanner('Rider técnico actualizado correctamente.');
    } catch (err) {
      setInfoBanner(err instanceof Error ? err.message : 'No se pudo subir el PDF del rider técnico.');
    } finally {
      setIsUploadingRider(false);
    }
  };

  const handleDeleteRiderDocument = () => {
    setInfoBanner(
      'No hay endpoint documentado para eliminar el rider técnico. Por ahora solo esta disponible subir/reemplazar PDF.',
    );
  };

  const openCreateDocumentModal = (target: DocumentModalTarget) => {
    setDocumentModal({
      isOpen: true,
      target,
      mode: 'create',
      itemId: null,
      name: '',
      description: '',
      file: null,
    });
  };

  const openEditContractModal = (service: ArtistServiceRecord) => {
    const currentDocument = contractOverrides[service.id];
    setDocumentModal({
      isOpen: true,
      target: 'contract',
      mode: 'edit',
      itemId: service.id,
      name: currentDocument?.name ?? service.name,
      description: currentDocument?.description ?? service.description ?? '',
      file: null,
    });
  };

  const openEditRiderModal = (row: { id: string; title: string; description?: string }) => {
    const currentDocument = riderOverrides[row.id];
    setDocumentModal({
      isOpen: true,
      target: 'rider',
      mode: 'edit',
      itemId: row.id,
      name: currentDocument?.name ?? row.title,
      description: currentDocument?.description ?? row.description ?? '',
      file: null,
    });
  };

  const closeDocumentModal = () => {
    setDocumentModal((prev) => ({ ...prev, isOpen: false, file: null }));
  };

  const saveDocumentModal = () => {
    const name = documentModal.name.trim();
    const description = documentModal.description.trim();
    if (!name || !description || !documentModal.file) {
      setInfoBanner('Completa nombre, descripción y adjunta un PDF.');
      return;
    }
    if (documentModal.file.type !== 'application/pdf') {
      setInfoBanner('Solo se permiten archivos PDF.');
      return;
    }
    const documentUrl = URL.createObjectURL(documentModal.file);
    if (documentModal.target === 'contract') {
      if (documentModal.mode === 'create') {
        const now = new Date().toISOString();
        const newRow: ArtistServiceRecord = {
          id: `contract-manual-${Date.now()}`,
          artistId: id ?? 'unknown',
          name,
          description,
          price: 0,
          features: [],
          imageUrl: '',
          createdAt: now,
          updatedAt: now,
          contractPdfUrl: documentUrl,
        };
        setManualContracts((prev) => [newRow, ...prev]);
      } else if (documentModal.itemId) {
        setContractOverrides((prev) => ({
          ...prev,
          [documentModal.itemId]: { name, description, documentUrl },
        }));
      }
      setInfoBanner('Contrato actualizado en la tabla (modo temporal frontend).');
    } else {
      if (documentModal.mode === 'create') {
        setManualRiders((prev) => [
          {
            id: `rider-manual-${Date.now()}`,
            title: name,
            description,
            bulletItems: [],
            imageUrl: '',
            documentUrl,
          },
          ...prev,
        ]);
      } else if (documentModal.itemId) {
        setRiderOverrides((prev) => ({
          ...prev,
          [documentModal.itemId]: { name, description, documentUrl },
        }));
      }
      setInfoBanner('Rider técnico actualizado en la tabla (modo temporal frontend).');
    }
    closeDocumentModal();
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
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Contratos para los servicios
        </h1>
        <p className="text-sm text-white/60 max-w-3xl leading-relaxed">
          Consulta las condiciones clave de cada servicio y descarga el documento técnico del artista.
          {isSelfArtist ? ' Puedes revisar estos archivos tal como los ven tus clientes.' : ''}
        </p>
      </header>

      <section className="space-y-4">
        {isSelfArtist ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => openCreateDocumentModal('contract')}
              className="inline-flex items-center gap-2 rounded-full border border-[#00d4c8]/40 px-4 py-2 text-sm font-medium text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0]"
            >
              <FiPlus size={15} aria-hidden />
              Agregar contrato
            </button>
          </div>
        ) : null}
        <ArtistProfileDocumentsServicesTable
          services={paginatedServices}
          getDocumentUrl={getDocumentUrl}
          getDisplayName={getContractDisplayName}
          onMissingDocumentClick={handleMissingDocumentClick}
          showPaymentColumn={false}
          mode={isSelfArtist ? 'contract-management' : 'default'}
          onModifyDocument={isSelfArtist ? openEditContractModal : undefined}
          onDeleteDocument={isSelfArtist ? handleDeleteDocument : undefined}
          disableDownloadWhenMissing={!isSelfArtist}
        />
        {allContractRows.length > TABLE_PAGE_SIZE && (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-white/60 mr-2">
              Página {contractsPage} de {totalContractsPages}
            </span>
            <button
              type="button"
              onClick={() => setContractsPage((prev) => Math.max(1, prev - 1))}
              disabled={contractsPage === 1}
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setContractsPage((prev) => Math.min(totalContractsPages, prev + 1))}
              disabled={contractsPage === totalContractsPages}
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-white tracking-tight">Riders Técnicos disponibles</h2>
        </div>
        {isSelfArtist ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => openCreateDocumentModal('rider')}
              className="inline-flex items-center gap-2 rounded-full border border-[#00d4c8]/40 px-4 py-2 text-sm font-medium text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0]"
            >
              <FiPlus size={15} aria-hidden />
              Agregar rider
            </button>
          </div>
        ) : null}
        {infoBanner && (
          <p className="text-xs text-[#00d4c8] bg-[#00d4c8]/10 border border-[#00d4c8]/30 rounded-lg px-3 py-2">
            {infoBanner}
          </p>
        )}
        {isSelfArtist ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="min-w-[660px] w-full text-sm">
                <thead className="bg-white/[0.04] text-neutral-300">
                  <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium [&>th]:text-neutral-400">
                    <th>Nombre del rider</th>
                    <th>Descargar</th>
                    <th>Modificar</th>
                    <th className="w-[70px] text-center"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedRiderRows.map((item) => (
                    <tr key={item.id} className="[&>td]:px-4 [&>td]:py-3 text-neutral-200">
                      <td className="font-medium text-white">{getRiderDisplayName(item.id, item.title)}</td>
                      <td>
                        {(riderOverrides[item.id]?.documentUrl ?? item.documentUrl) ? (
                          <a
                            href={riderOverrides[item.id]?.documentUrl ?? item.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[#00d4c8] hover:text-[#00ece0] transition-colors"
                          >
                            <FiDownload size={14} aria-hidden />
                            Descargar
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={handleMissingDocumentClick}
                            className="inline-flex items-center gap-2 rounded-full border border-[#00d4c8]/40 px-3 py-1 text-[#00d4c8] hover:border-[#00ece0] hover:text-[#00ece0] transition-colors"
                          >
                            <FiDownload size={14} aria-hidden />
                            Descargar
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => openEditRiderModal(item)}
                          className="inline-flex items-center gap-2 rounded-full border border-[#00d4c8]/40 px-3 py-1 text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0]"
                        >
                          <FiEdit2 size={14} aria-hidden />
                          Modificar
                        </button>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={handleDeleteRiderDocument}
                          className="inline-flex items-center rounded-full border border-red-500/35 p-2 text-red-300 transition-colors hover:border-red-400/60 hover:text-red-200"
                          aria-label={`Eliminar PDF del rider ${item.title}`}
                          title="Eliminar PDF"
                        >
                          <FiTrash2 size={14} aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          
        ) : (
          <ArtistProfileRidersGrid
            items={orderedRiderItems}
            pinnedIds={pinnedRiderIds}
            onMissingDocumentClick={handleMissingDocumentClick}
            canTogglePin={isSelfArtist}
            onTogglePin={isSelfArtist ? handleToggleRiderPin : undefined}
          />
        )}
        {isSelfArtist && allRiderRows.length > TABLE_PAGE_SIZE && (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-white/60 mr-2">
              Página {ridersPage} de {totalRidersPages}
            </span>
            <button
              type="button"
              onClick={() => setRidersPage((prev) => Math.max(1, prev - 1))}
              disabled={ridersPage === 1}
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setRidersPage((prev) => Math.min(totalRidersPages, prev + 1))}
              disabled={ridersPage === totalRidersPages}
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </section>

      {documentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-[560px] rounded-2xl border border-[#00d4c8]/30 bg-[#111214] p-5 shadow-[0_0_35px_rgba(0,212,200,0.15)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold tracking-tight text-white">
                  {documentModal.mode === 'create' ? 'Agregar documento' : 'Modificar documento'}
                </h3>
                <p className="mt-1 text-sm text-neutral-400">
                  {documentModal.target === 'contract' ? 'Contrato del servicio' : 'Rider técnico'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDocumentModal}
                className="shrink-0 rounded-full border border-white/20 p-2 text-white/70 transition hover:border-white/35 hover:bg-white/5 hover:text-white"
                aria-label="Cerrar modal de documento"
              >
                <FiX size={17} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-sm font-medium text-neutral-300">Nombre</p>
                <input
                  value={documentModal.name}
                  onChange={(event) => setDocumentModal((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#00d4c8]/50 focus:ring-2 focus:ring-[#00d4c8]/25"
                />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-neutral-300">Descripcion</p>
                <textarea
                  rows={3}
                  value={documentModal.description}
                  onChange={(event) => setDocumentModal((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full resize-y rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#00d4c8]/50 focus:ring-2 focus:ring-[#00d4c8]/25"
                />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-neutral-300">PDF</p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#00d4c8]/40 px-4 py-2 text-sm text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0]">
                  <FiUpload size={14} aria-hidden />
                  {documentModal.file ? documentModal.file.name : 'Seleccionar PDF'}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setDocumentModal((prev) => ({ ...prev, file }));
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDocumentModal}
                className="rounded-full border border-white/25 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveDocumentModal}
                className="rounded-full border border-[#00d4c8]/40 bg-[#00d4c8]/20 px-4 py-2 text-sm font-medium text-[#00ece0] transition-colors hover:border-[#00ece0] hover:text-white"
              >
                Guardar documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
