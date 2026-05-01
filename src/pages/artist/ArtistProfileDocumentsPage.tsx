import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UseArtistProfileByIdOptions } from '../../hooks/useArtistProfileById';
import { Navigate, useParams } from 'react-router-dom';
import { FiDownload, FiEdit2, FiLink2, FiList, FiPlus, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import {
  ArtistDocumentLinkServiceModal,
  ArtistDocumentLinkedServicesModal,
  ArtistProfileDocumentsServicesTable,
  ArtistProfileRidersGrid,
  Skeleton,
} from '../../components';
import { ClientConfirmDialog } from '../../components/client/ClientConfirmDialog';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import { useAuth } from '../../contexts/AuthContext';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';
import { deleteArtistFile, listMyArtistFiles, updateArtistFile, uploadArtistFile } from '../../api';
import { DEFAULT_RIDER_SECTIONS, buildArtistRiderItems } from '../../helpers/artistRiderSections';
import { contractPdfUrlForService, normalizeMediaDownloadUrl } from '../../helpers/artistDocumentUrls';
import {
  MAX_PINNED_ITEMS,
  getPinnedItemIds,
  savePinnedItemIds,
  sortPinnedFirst,
  togglePinnedItemId,
} from '../../helpers/pinnedItems';
import { isBackendRoleArtista } from '../../helpers/role';
import type { ArtistFileRecord } from '../../types/artistFile';
import type { ArtistServiceRecord } from '../../types';

const TABLE_PAGE_SIZE = 4;
type DocumentModalTarget = 'contract' | 'rider';

type DocumentModalState = {
  isOpen: boolean;
  target: DocumentModalTarget;
  mode: 'create' | 'edit';
  itemId: string | null;
  name: string;
  description: string;
  file: File | null;
};

type RiderTableRow = {
  id: string;
  title: string;
  description: string;
  bulletItems: string[];
  imageUrl?: string;
  documentUrl?: string;
};

type DeleteArtistFileConfirm =
  | null
  | { kind: 'contract'; fileId: string; displayName: string }
  | { kind: 'rider'; fileId: string; displayName: string };

type DocumentAssociationsModal =
  | null
  | {
      variant: 'contract' | 'rider';
      documentTitle: string;
      linkedServices: { id: string; name: string }[];
    };

type LinkServiceModalState =
  | null
  | {
      variant: 'contract' | 'rider';
      fileId: string;
      documentTitle: string;
    };

/** Modal validation / save errors (cleared when the user edits the form or closes the modal). */
const documentModalMessages = {
  /** Contrato y rider técnico comparten la misma validación. */
  nameRequired: 'Primero escribe un nombre para este documento.',
  pdfRequiredCreate: 'Debes seleccionar un documento para continuar.',
  pdfTypeInvalid: 'El documento elegido no cumple el formato permitido.',
} as const;

function artistFileDisplayBaseName(file: ArtistFileRecord): string {
  const fromApi = file.name?.trim();
  if (fromApi) return fromApi;
  const base = file.originalName.replace(/\.pdf$/i, '') || file.originalName;
  return base;
}

function artistFileToContractTableRow(file: ArtistFileRecord): ArtistServiceRecord {
  const baseName = artistFileDisplayBaseName(file);
  const now = new Date().toISOString();
  return {
    id: file.id,
    artistId: file.artistId,
    name: baseName,
    description: file.description?.trim() ?? '',
    price: 0,
    features: [],
    imageUrl: '',
    createdAt: now,
    updatedAt: now,
    contractPdfUrl: file.url,
  };
}

function artistFileToRiderTableRow(file: ArtistFileRecord): RiderTableRow {
  const baseTitle = artistFileDisplayBaseName(file);
  return {
    id: file.id,
    title: baseTitle,
    description: file.description?.trim() ?? '',
    bulletItems: [],
    imageUrl: '',
    documentUrl: normalizeMediaDownloadUrl(file.url),
  };
}

function sanitizePdfDisplayBase(displayBaseName: string): string {
  return displayBaseName.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'documento';
}

function displayNameToOriginalPdfFilename(displayBaseName: string): string {
  return `${sanitizePdfDisplayBase(displayBaseName)}.pdf`;
}

function buildNamedPdfFile(source: File, displayBaseName: string): File {
  const target = displayNameToOriginalPdfFilename(displayBaseName);
  if (source.name.toLowerCase() === target.toLowerCase()) return source;
  return new File([source], target, { type: 'application/pdf' });
}

export function ArtistProfileDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { exitHomePath } = useArtistProfileNav();
  const [infoBanner, setInfoBanner] = useState('');
  const [pinnedRiderIds, setPinnedRiderIds] = useState<string[]>([]);
  const [contractsPage, setContractsPage] = useState(1);
  const [ridersPage, setRidersPage] = useState(1);
  const [contractFiles, setContractFiles] = useState<ArtistFileRecord[]>([]);
  const [riderFiles, setRiderFiles] = useState<ArtistFileRecord[]>([]);
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const [documentModalError, setDocumentModalError] = useState('');
  const [editBaseline, setEditBaseline] = useState({ name: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteArtistFileConfirm>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [associationsModal, setAssociationsModal] = useState<DocumentAssociationsModal>(null);
  const [linkServiceModal, setLinkServiceModal] = useState<LinkServiceModalState>(null);
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
  const { profile, services, loading, error, refetch } = useArtistProfileById(id, profileLoadOptions);

  const dismissInfoBanner = useCallback(() => {
    setInfoBanner('');
  }, []);

  const isDocumentEditDirty = useMemo(() => {
    if (documentModal.mode !== 'edit' || !documentModal.isOpen) return false;
    return (
      documentModal.name.trim() !== editBaseline.name ||
      documentModal.description.trim() !== editBaseline.description.trim() ||
      documentModal.file !== null
    );
  }, [documentModal, editBaseline]);

  const canSaveDocument = useMemo(() => {
    if (!documentModal.isOpen || isSavingDocument) return false;
    const trimmedName = documentModal.name.trim();
    if (!trimmedName) return false;
    if (documentModal.mode === 'create') {
      return Boolean(documentModal.file);
    }
    if (!isDocumentEditDirty) return false;
    if (documentModal.file && documentModal.file.type !== 'application/pdf') return false;
    return true;
  }, [documentModal, isDocumentEditDirty, isSavingDocument]);

  const reloadArtistFileLists = useCallback(async () => {
    if (!isSelfArtist) return;
    try {
      const [contracts, riders] = await Promise.all([
        listMyArtistFiles('contract'),
        listMyArtistFiles('technical_rider'),
      ]);
      setContractFiles(contracts);
      setRiderFiles(riders);
    } catch (err) {
      setInfoBanner(err instanceof Error ? err.message : 'No se pudieron cargar los documentos del artista.');
    }
  }, [isSelfArtist]);

  useEffect(() => {
    if (!isSelfArtist) {
      setContractFiles([]);
      setRiderFiles([]);
      return;
    }
    void reloadArtistFileLists();
  }, [isSelfArtist, reloadArtistFileLists]);

  const contractRowsFromFiles = useMemo(
    () => contractFiles.map(artistFileToContractTableRow),
    [contractFiles],
  );
  const allContractRows = useMemo(
    () => (isSelfArtist ? contractRowsFromFiles : services),
    [contractRowsFromFiles, isSelfArtist, services],
  );

  const getDocumentUrl = (service: ArtistServiceRecord) => {
    if (isSelfArtist) {
      return normalizeMediaDownloadUrl(service.contractPdfUrl);
    }
    return contractPdfUrlForService(service, profile);
  };

  const getContractDisplayName = (service: ArtistServiceRecord) => service.name;

  const openContractLinkedServicesModal = (row: ArtistServiceRecord) => {
    dismissInfoBanner();
    const fileId = row.id;
    const linked = services.filter((s) => (s.contractId ?? s.contractTemplateId) === fileId);
    setAssociationsModal({
      variant: 'contract',
      documentTitle: getContractDisplayName(row).trim() || 'Contrato',
      linkedServices: linked
        .map((s) => ({ id: s.id, name: s.name.trim() }))
        .filter((s) => s.name.length > 0),
    });
  };

  const openRiderLinkedServicesModal = (row: RiderTableRow) => {
    dismissInfoBanner();
    const linked = services.filter((s) => (s.technicalRiderId ?? s.technicalRiderTemplateId) === row.id);
    setAssociationsModal({
      variant: 'rider',
      documentTitle: row.title.trim() || 'Rider técnico',
      linkedServices: linked
        .map((s) => ({ id: s.id, name: s.name.trim() }))
        .filter((s) => s.name.length > 0),
    });
  };

  const closeAssociationsModal = () => {
    setAssociationsModal(null);
  };

  const openContractLinkServiceModal = (row: ArtistServiceRecord) => {
    dismissInfoBanner();
    setAssociationsModal(null);
    setLinkServiceModal({
      variant: 'contract',
      fileId: row.id,
      documentTitle: getContractDisplayName(row).trim() || 'Contrato',
    });
  };

  const openRiderLinkServiceModal = (row: RiderTableRow) => {
    dismissInfoBanner();
    setAssociationsModal(null);
    setLinkServiceModal({
      variant: 'rider',
      fileId: row.id,
      documentTitle: row.title.trim() || 'Rider técnico',
    });
  };

  const closeLinkServiceModal = () => {
    setLinkServiceModal(null);
  };

  const handleMissingDocumentClick = () => {
    setInfoBanner('Este artista aún no tiene un contrato o rider técnico cargado para este ítem.');
  };

  const requestDeleteContract = (service: ArtistServiceRecord) => {
    if (!isSelfArtist) return;
    const displayName = getContractDisplayName(service).trim() || 'este contrato';
    setDeleteConfirm({ kind: 'contract', fileId: service.id, displayName });
  };

  const requestDeleteRider = (row: RiderTableRow) => {
    if (!isSelfArtist) return;
    const displayName = row.title.trim() || 'este rider técnico';
    setDeleteConfirm({ kind: 'rider', fileId: row.id, displayName });
  };

  const cancelDeleteArtistFile = () => {
    if (deleteInProgress) return;
    setDeleteConfirm(null);
  };

  const confirmDeleteArtistFile = async () => {
    if (!deleteConfirm || deleteInProgress) return;
    setDeleteInProgress(true);
    setInfoBanner('');
    try {
      await deleteArtistFile(deleteConfirm.fileId);
      setInfoBanner(
        deleteConfirm.kind === 'contract' ? 'Contrato eliminado.' : 'Rider técnico eliminado.',
      );
      setDeleteConfirm(null);
      await reloadArtistFileLists();
      refetch();
    } catch (err) {
      setInfoBanner(
        err instanceof Error
          ? err.message
          : deleteConfirm.kind === 'contract'
            ? 'No se pudo eliminar el contrato.'
            : 'No se pudo eliminar el rider.',
      );
    } finally {
      setDeleteInProgress(false);
    }
  };

  const riderItems = useMemo(() => buildArtistRiderItems(services, profile), [profile, services]);
  const orderedRiderItems = useMemo(
    () => sortPinnedFirst(riderItems, pinnedRiderIds),
    [riderItems, pinnedRiderIds],
  );

  const riderTableRowsForVisitor = useMemo(() => {
    if (orderedRiderItems.length > 0) return orderedRiderItems;
    const profileRiderUrl = normalizeMediaDownloadUrl(
      profile?.technicalRiderUrl ?? profile?.riderUrl,
    );
    return DEFAULT_RIDER_SECTIONS.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      bulletItems: [...section.bulletItems],
      imageUrl: '',
      documentUrl: profileRiderUrl,
    }));
  }, [orderedRiderItems, profile?.riderUrl, profile?.technicalRiderUrl]);

  const riderTableRowsForSelf = useMemo(() => riderFiles.map(artistFileToRiderTableRow), [riderFiles]);

  const allRiderRows: RiderTableRow[] = useMemo(
    () => (isSelfArtist ? riderTableRowsForSelf : riderTableRowsForVisitor),
    [isSelfArtist, riderTableRowsForSelf, riderTableRowsForVisitor],
  );

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

  const openCreateDocumentModal = (target: DocumentModalTarget) => {
    dismissInfoBanner();
    setDocumentModalError('');
    setEditBaseline({ name: '', description: '' });
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
    dismissInfoBanner();
    setDocumentModalError('');
    const file = contractFiles.find((f) => f.id === service.id);
    const rawName = (file ? artistFileDisplayBaseName(file) : service.name.trim()) || service.name;
    const name = rawName.trim();
    const description = file?.description ?? service.description ?? '';
    setEditBaseline({ name, description });
    setDocumentModal({
      isOpen: true,
      target: 'contract',
      mode: 'edit',
      itemId: service.id,
      name,
      description,
      file: null,
    });
  };

  const openEditRiderModal = (row: RiderTableRow) => {
    dismissInfoBanner();
    setDocumentModalError('');
    const file = riderFiles.find((f) => f.id === row.id);
    const rawName = (file ? artistFileDisplayBaseName(file) : row.title.trim()) || row.title;
    const name = rawName.trim();
    const description = file?.description ?? row.description ?? '';
    setEditBaseline({ name, description });
    setDocumentModal({
      isOpen: true,
      target: 'rider',
      mode: 'edit',
      itemId: row.id,
      name,
      description,
      file: null,
    });
  };

  const closeDocumentModal = (clearPageBanner = false) => {
    setDocumentModalError('');
    if (clearPageBanner) dismissInfoBanner();
    setDocumentModal((prev) => ({ ...prev, isOpen: false, file: null, description: '' }));
  };

  const saveDocumentModal = async () => {
    if (!isSelfArtist) return;
    if (!canSaveDocument) return;
    const name = documentModal.name.trim();
    if (!name) {
      setDocumentModalError(documentModalMessages.nameRequired);
      return;
    }
    if (documentModal.mode === 'create' && !documentModal.file) {
      setDocumentModalError(documentModalMessages.pdfRequiredCreate);
      return;
    }
    if (documentModal.file && documentModal.file.type !== 'application/pdf') {
      setDocumentModalError(documentModalMessages.pdfTypeInvalid);
      return;
    }

    const fileType = documentModal.target === 'contract' ? 'contract' : 'technical_rider';

    setIsSavingDocument(true);
    setDocumentModalError('');
    setInfoBanner('');
    try {
      const descTrim = documentModal.description.trim();
      const descOptional = descTrim.length > 0 ? descTrim : undefined;
      if (documentModal.mode === 'create') {
        const pdfFile = buildNamedPdfFile(documentModal.file!, name);
        await uploadArtistFile(pdfFile, fileType, {
          displayName: name,
          ...(descOptional ? { description: descOptional } : {}),
        });
        setInfoBanner(
          documentModal.target === 'contract'
            ? 'Contrato subido correctamente.'
            : 'Rider técnico subido correctamente.',
        );
      } else if (documentModal.itemId) {
        const nameChanged = name !== editBaseline.name;
        const descriptionChanged =
          documentModal.description.trim() !== editBaseline.description.trim();
        const hasNewFile = documentModal.file !== null;

        if (hasNewFile) {
          const pdfFile = buildNamedPdfFile(documentModal.file!, name);
          await updateArtistFile(documentModal.itemId, {
            file: pdfFile,
            name,
            ...(descriptionChanged ? { description: documentModal.description.trim() } : {}),
          });
        } else if (nameChanged || descriptionChanged) {
          await updateArtistFile(documentModal.itemId, {
            name,
            ...(descriptionChanged ? { description: documentModal.description.trim() } : {}),
          });
        }

        setInfoBanner(
          documentModal.target === 'contract'
            ? 'Contrato actualizado correctamente.'
            : 'Rider técnico actualizado correctamente.',
        );
      }
      await reloadArtistFileLists();
      refetch();
      closeDocumentModal();
    } catch (err) {
      setDocumentModalError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el documento. Revisa la conexión e inténtalo de nuevo.',
      );
    } finally {
      setIsSavingDocument(false);
    }
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
        <h1 className="text-xl font-semibold text-white tracking-tight sm:text-2xl">
          Contratos para los servicios
        </h1>
        <p className="text-sm text-white/60 max-w-3xl leading-relaxed">
          Consulta las condiciones clave de cada servicio y descarga el documento técnico del artista.
          {isSelfArtist ? ' Puedes revisar estos contratos y riders tal como los ven tus clientes.' : ''}
        </p>
      </header>

      {infoBanner ? (
        <p className="text-xs text-[#00d4c8] bg-[#00d4c8]/10 border border-[#00d4c8]/30 rounded-lg px-3 py-2 leading-relaxed break-words">
          {infoBanner}
        </p>
      ) : null}

      <section className="space-y-4">
        {isSelfArtist ? (
          <div className="flex w-full justify-center sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => openCreateDocumentModal('contract')}
              className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full border border-[#00d4c8]/40 px-4 py-2.5 text-sm font-medium text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0] sm:w-auto sm:min-h-0 sm:py-2"
            >
              <FiPlus size={15} aria-hidden />
              Agregar Contrato
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
          managementEmptyMessage={
            isSelfArtist
              ? 'Aún no hay contratos subidos. Pulsa «Agregar Contrato» para añadir el primero.'
              : undefined
          }
          onModifyDocument={isSelfArtist ? openEditContractModal : undefined}
          onDeleteDocument={isSelfArtist ? requestDeleteContract : undefined}
          onDismissBanner={isSelfArtist ? dismissInfoBanner : undefined}
          onShowLinkedServices={isSelfArtist ? openContractLinkedServicesModal : undefined}
          onLinkService={isSelfArtist ? openContractLinkServiceModal : undefined}
          disableDownloadWhenMissing={!isSelfArtist}
        />
        {allContractRows.length > TABLE_PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2">
            <span className="w-full text-center text-xs text-white/60 sm:mr-2 sm:w-auto sm:text-left">
              Página {contractsPage} de {totalContractsPages}
            </span>
            <button
              type="button"
              onClick={() => {
                dismissInfoBanner();
                setContractsPage((prev) => Math.max(1, prev - 1));
              }}
              disabled={contractsPage === 1}
              className="min-h-[40px] min-w-[5.5rem] rounded-full border border-white/20 px-3 py-2 text-xs text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:min-w-0 sm:py-1"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => {
                dismissInfoBanner();
                setContractsPage((prev) => Math.min(totalContractsPages, prev + 1));
              }}
              disabled={contractsPage === totalContractsPages}
              className="min-h-[40px] min-w-[5.5rem] rounded-full border border-white/20 px-3 py-2 text-xs text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:min-w-0 sm:py-1"
            >
              Siguiente
            </button>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white tracking-tight sm:text-2xl">Riders Técnicos disponibles</h2>
        </div>
        {isSelfArtist ? (
          <div className="flex w-full justify-center sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => openCreateDocumentModal('rider')}
              className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full border border-[#00d4c8]/40 px-4 py-2.5 text-sm font-medium text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0] sm:w-auto sm:min-h-0 sm:py-2"
            >
              <FiPlus size={15} aria-hidden />
              Agregar Rider
            </button>
          </div>
        ) : null}
        {isSelfArtist ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {paginatedRiderRows.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-neutral-400">
                  Aún no hay riders técnicos. Pulsa «Agregar Rider» para añadir el primero.
                </p>
              </div>
            ) : (
              <div className="-mx-1 overflow-x-auto touch-pan-x px-1 sm:mx-0 sm:px-0">
                <table className="min-w-[920px] w-full text-sm">
                  <thead className="bg-white/[0.04] text-neutral-300">
                    <tr className="[&>th]:px-2.5 [&>th]:py-2.5 [&>th]:text-left [&>th]:text-xs [&>th]:font-medium [&>th]:text-neutral-400 sm:[&>th]:px-4 sm:[&>th]:py-3 sm:[&>th]:text-sm">
                      <th>Nombre del rider</th>
                      <th>Servicios vinculados</th>
                      <th>Asociar a servicio</th>
                      <th>Descargar</th>
                      <th>Modificar</th>
                      <th className="w-[70px] text-center"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedRiderRows.map((item) => (
                      <tr
                        key={item.id}
                        className="[&>td]:px-2.5 [&>td]:py-2.5 [&>td]:text-xs text-neutral-200 sm:[&>td]:px-4 sm:[&>td]:py-3 sm:[&>td]:text-sm"
                      >
                        <td className="font-medium text-white">{item.title}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => openRiderLinkedServicesModal(item)}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#00d4c8]/40 px-2.5 py-1.5 text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0] sm:min-h-0 sm:gap-2 sm:px-3 sm:py-1"
                          >
                            <FiList size={14} aria-hidden />
                            Ver
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => openRiderLinkServiceModal(item)}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#00d4c8]/40 px-2.5 py-1.5 text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0] sm:min-h-0 sm:gap-2 sm:px-3 sm:py-1"
                          >
                            <FiLink2 size={14} aria-hidden />
                            Asociar
                          </button>
                        </td>
                        <td>
                          {item.documentUrl ? (
                            <a
                              href={item.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => dismissInfoBanner()}
                              className="inline-flex min-h-[40px] items-center gap-1.5 text-[#00d4c8] hover:text-[#00ece0] transition-colors sm:min-h-0 sm:gap-2"
                            >
                              <FiDownload size={14} aria-hidden />
                              Descargar
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                dismissInfoBanner();
                                handleMissingDocumentClick();
                              }}
                              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#00d4c8]/40 px-2.5 py-1.5 text-[#00d4c8] hover:border-[#00ece0] hover:text-[#00ece0] transition-colors sm:min-h-0 sm:gap-2 sm:px-3 sm:py-1"
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
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#00d4c8]/40 px-2.5 py-1.5 text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0] sm:min-h-0 sm:gap-2 sm:px-3 sm:py-1"
                          >
                            <FiEdit2 size={14} aria-hidden />
                            Modificar
                          </button>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => requestDeleteRider(item)}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-red-500/35 p-2 text-red-300 transition-colors hover:border-red-400/60 hover:text-red-200 sm:min-h-0 sm:min-w-0"
                            aria-label={`Eliminar rider técnico ${item.title}`}
                            title="Eliminar rider técnico"
                          >
                            <FiTrash2 size={14} aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2">
            <span className="w-full text-center text-xs text-white/60 sm:mr-2 sm:w-auto sm:text-left">
              Página {ridersPage} de {totalRidersPages}
            </span>
            <button
              type="button"
              onClick={() => {
                dismissInfoBanner();
                setRidersPage((prev) => Math.max(1, prev - 1));
              }}
              disabled={ridersPage === 1}
              className="min-h-[40px] min-w-[5.5rem] rounded-full border border-white/20 px-3 py-2 text-xs text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:min-w-0 sm:py-1"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => {
                dismissInfoBanner();
                setRidersPage((prev) => Math.min(totalRidersPages, prev + 1));
              }}
              disabled={ridersPage === totalRidersPages}
              className="min-h-[40px] min-w-[5.5rem] rounded-full border border-white/20 px-3 py-2 text-xs text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:min-w-0 sm:py-1"
            >
              Siguiente
            </button>
          </div>
        )}
      </section>

      <ClientConfirmDialog
        isOpen={Boolean(deleteConfirm)}
        title={
          deleteConfirm?.kind === 'contract'
            ? 'Eliminar Contrato'
            : deleteConfirm?.kind === 'rider'
              ? 'Eliminar Rider técnico'
              : ''
        }
        message={
          deleteConfirm?.kind === 'contract' ? (
            <div className="space-y-3">
              <p className="m-0">
                ¿Estás seguro de que deseas eliminar el Contrato{' '}
                <strong className="font-semibold text-white">«{deleteConfirm.displayName}»</strong>?
              </p>
              <p className="m-0 text-white/70">
                Se eliminará el contrato y se desvinculará de los servicios que lo usaban.
              </p>
            </div>
          ) : deleteConfirm?.kind === 'rider' ? (
            <div className="space-y-3">
              <p className="m-0">
                ¿Estás seguro de que deseas eliminar el Rider técnico{' '}
                <strong className="font-semibold text-white">«{deleteConfirm.displayName}»</strong>?
              </p>
              <p className="m-0 text-white/70">
                Se eliminará el rider técnico de forma permanente.
              </p>
            </div>
          ) : (
            ''
          )
        }
        cancelLabel="Cancelar"
        confirmLabel="Eliminar"
        confirmVariant="danger"
        isBusy={deleteInProgress}
        onCancel={cancelDeleteArtistFile}
        onConfirm={() => void confirmDeleteArtistFile()}
      />

      <ArtistDocumentLinkedServicesModal
        isOpen={Boolean(associationsModal)}
        variant={associationsModal?.variant ?? 'contract'}
        documentTitle={associationsModal?.documentTitle ?? ''}
        linkedServices={associationsModal?.linkedServices ?? []}
        onClose={closeAssociationsModal}
        audience="artist"
      />

      {linkServiceModal ? (
        <ArtistDocumentLinkServiceModal
          isOpen
          variant={linkServiceModal.variant}
          fileId={linkServiceModal.fileId}
          documentTitle={linkServiceModal.documentTitle}
          services={services}
          onClose={closeLinkServiceModal}
          onSuccess={(message) => {
            setInfoBanner(message);
            refetch();
          }}
        />
      ) : null}

      {documentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
          <div className="flex max-h-[min(96dvh,900px)] w-full max-w-[min(calc(100vw-1.5rem),600px)] flex-col overflow-hidden rounded-2xl border border-[#00d4c8]/30 bg-[#111214] shadow-[0_0_35px_rgba(0,212,200,0.15)]">
            <div className="shrink-0 p-4 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                  {documentModal.mode === 'create' ? 'Agregar Documento' : 'Modificar Documento'}
                </h3>
                <p className="mt-1 text-sm text-neutral-400">
                  {documentModal.target === 'contract' ? 'Contrato del servicio' : 'Rider técnico'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => closeDocumentModal(true)}
                className="shrink-0 rounded-full border border-white/20 p-2.5 text-white/70 transition hover:border-white/35 hover:bg-white/5 hover:text-white sm:p-2"
                aria-label="Cerrar modal de documento"
              >
                <FiX size={17} />
              </button>
            </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6">
            <div className="space-y-4 pb-2">
              <div>
                <p className="mb-1.5 text-sm font-medium text-neutral-300">Nombre</p>
                <input
                  value={documentModal.name}
                  onChange={(event) => {
                    setDocumentModalError('');
                    setDocumentModal((prev) => ({ ...prev, name: event.target.value }));
                  }}
                  aria-invalid={documentModalError === documentModalMessages.nameRequired}
                  className={`w-full rounded-xl border bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:ring-2 ${
                    documentModalError === documentModalMessages.nameRequired
                      ? 'border-red-400/55 focus:border-red-400/70 focus:ring-red-400/20'
                      : 'border-white/20 focus:border-[#00d4c8]/50 focus:ring-[#00d4c8]/25'
                  }`}
                />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-neutral-300">Descripción (opcional)</p>
                <textarea
                  value={documentModal.description}
                  onChange={(event) => {
                    setDocumentModalError('');
                    setDocumentModal((prev) => ({ ...prev, description: event.target.value }));
                  }}
                  rows={3}
                  placeholder="Notas o contexto sobre este documento"
                  className="w-full resize-y rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#00d4c8]/50 focus:ring-2 focus:ring-[#00d4c8]/25"
                />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-neutral-300">
                  {documentModal.target === 'contract' ? 'Contrato' : 'Rider técnico'}
                </p>
                <label className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#00d4c8]/40 px-3 py-2.5 text-center text-sm text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0] sm:inline-flex sm:min-h-0 sm:w-auto sm:justify-start sm:px-4 sm:py-2">
                  <FiUpload size={14} aria-hidden className="shrink-0" />
                  <span className="min-w-0 truncate">
                    {documentModal.file ? documentModal.file.name : 'Seleccionar Documento'}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => {
                      setDocumentModalError('');
                      const file = event.target.files?.[0] ?? null;
                      setDocumentModal((prev) => ({ ...prev, file }));
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
            {documentModalError ? (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200/95 leading-relaxed"
              >
                {documentModalError}
              </p>
            ) : null}
            </div>
            <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-5 sm:pt-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => closeDocumentModal(true)}
                disabled={isSavingDocument}
                className="min-h-[44px] w-full rounded-full border border-white/25 px-4 py-2.5 text-sm text-white/80 transition hover:border-white/40 hover:text-white disabled:opacity-50 sm:min-h-0 sm:w-auto sm:py-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingDocument || !canSaveDocument}
                onClick={() => void saveDocumentModal()}
                className="min-h-[44px] w-full rounded-full border border-[#00d4c8]/40 bg-[#00d4c8]/20 px-4 py-2.5 text-sm font-medium text-[#00ece0] transition-colors hover:border-[#00ece0] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:w-auto sm:py-2"
              >
                {isSavingDocument ? 'Guardando…' : 'Guardar Documento'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
