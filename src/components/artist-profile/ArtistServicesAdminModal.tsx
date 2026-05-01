import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiFileText, FiPlus, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import { FaThumbtack } from 'react-icons/fa6';
import { Button } from '../Button';
import {
  type CreateArtistServiceBody,
  type UpdateArtistServiceBody,
  createArtistService,
  updateArtistService,
  deleteArtistService,
  updateArtistServiceWithFormData,
  listMyArtistFiles,
  uploadArtistFile,
} from '../../api';
import type { ArtistFileRecord } from '../../types/artistFile';
import type { ArtistServiceRecord } from '../../types';

type ArtistServicesAdminModalProps = {
  isOpen: boolean;
  services: ArtistServiceRecord[];
  onClose: () => void;
  onServicesChange: (next: ArtistServiceRecord[]) => void;
  /** When the admin modal opens, open the editor for this service id (e.g. from profile card). */
  openEditorForServiceId?: string | null;
  onOpenEditorForServiceIdConsumed?: () => void;
};

type ServiceFormState = {
  id: string;
  name: string;
  price: string;
  description: string;
  details: string[];
  imageUrl: string;
  contractTemplateId: string;
  technicalRiderTemplateId: string;
};
type EditorMode = 'create' | 'edit';
type CustomSelectId = 'contract' | 'technicalRider';

type ServiceDocumentUploadTarget = 'contract' | 'technical_rider';

const uploadModalMessages = {
  nameRequired: 'Primero escribe un nombre para este documento.',
  pdfRequiredCreate: 'Adjunta un archivo PDF.',
  pdfTypeInvalid: 'Solo se permiten archivos PDF.',
} as const;

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

function fileLabel(file: ArtistFileRecord): string {
  const base = file.originalName.replace(/\.pdf$/i, '') || file.originalName;
  return base.trim() || file.id;
}

const emptyForm: ServiceFormState = {
  id: '',
  name: '',
  price: '',
  description: '',
  details: [],
  imageUrl: '',
  contractTemplateId: '',
  technicalRiderTemplateId: '',
};

/** Matches public `ArtistServiceCard` shell: teal border, glass fill, hover glow. */
const adminServiceCardShell =
  'group relative overflow-hidden rounded-3xl border border-[#00d4c8]/15 bg-white/[0.03] ' +
  'transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00d4c8]/45 ' +
  'hover:shadow-[0_0_22px_rgba(0,212,200,0.28)]';

export function ArtistServicesAdminModal({
  isOpen,
  services,
  onClose,
  onServicesChange,
  openEditorForServiceId,
  onOpenEditorForServiceIdConsumed,
}: ArtistServicesAdminModalProps) {
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [newDetail, setNewDetail] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [editorError, setEditorError] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [openCustomSelect, setOpenCustomSelect] = useState<CustomSelectId | null>(null);
  const [contractFiles, setContractFiles] = useState<ArtistFileRecord[]>([]);
  const [riderFiles, setRiderFiles] = useState<ArtistFileRecord[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesLoadError, setFilesLoadError] = useState('');
  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    target: ServiceDocumentUploadTarget;
    name: string;
    description: string;
    file: File | null;
  }>({ isOpen: false, target: 'contract', name: '', description: '', file: null });
  const [uploadModalError, setUploadModalError] = useState('');
  const [isSavingUpload, setIsSavingUpload] = useState(false);
  const [pinLoadingServiceIds, setPinLoadingServiceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm);
      setNewDetail('');
      setImageFile(null);
      setPreviewUrl('');
      setError('');
      setEditorError('');
      setIsSaving(false);
      setIsEditorOpen(false);
      setEditorMode('create');
      setOpenCustomSelect(null);
      setContractFiles([]);
      setRiderFiles([]);
      setFilesLoading(false);
      setFilesLoadError('');
      setUploadModal({ isOpen: false, target: 'contract', name: '', description: '', file: null });
      setUploadModalError('');
      setIsSavingUpload(false);
      setPinLoadingServiceIds(new Set());
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isSaving) return;
      if (uploadModal.isOpen) {
        if (!isSavingUpload) {
          setUploadModalError('');
          setUploadModal((prev) => ({ ...prev, isOpen: false, file: null, description: '' }));
        }
        return;
      }
      if (isEditorOpen) {
        setEditorError('');
        setIsEditorOpen(false);
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSaving, isSavingUpload, isEditorOpen, onClose, uploadModal.isOpen]);

  useEffect(() => {
    if (!isEditorOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-custom-select-root="true"]')) {
        setOpenCustomSelect(null);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [isEditorOpen]);

  useEffect(() => {
    if (!isEditorOpen) return;
    let cancelled = false;
    setFilesLoading(true);
    setFilesLoadError('');
    void Promise.all([listMyArtistFiles('contract'), listMyArtistFiles('technical_rider')])
      .then(([contracts, riders]) => {
        if (!cancelled) {
          setContractFiles(contracts);
          setRiderFiles(riders);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFilesLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los documentos.');
        }
      })
      .finally(() => {
        if (!cancelled) setFilesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEditorOpen]);

  const selectedImage = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (form.imageUrl) return form.imageUrl;
    return '';
  }, [form.imageUrl, previewUrl]);

  const orderedServices = useMemo(
    () => {
      const pinned = services.filter((service) => Boolean(service.isPinned));
      const normal = services.filter((service) => !service.isPinned);
      return [...pinned, ...normal];
    },
    [services],
  );

  const contractSelectOptions = useMemo(() => {
    const placeholder = { id: '', label: 'Elegir entre tus contratos guardados…' };
    const fromFiles = contractFiles.map((f) => ({ id: f.id, label: fileLabel(f) }));
    const ids = new Set(fromFiles.map((o) => o.id));
    const extra: Array<{ id: string; label: string }> = [];
    if (form.contractTemplateId && !ids.has(form.contractTemplateId)) {
      extra.push({ id: form.contractTemplateId, label: '(Documento vinculado)' });
    }
    return [placeholder, ...extra, ...fromFiles];
  }, [contractFiles, form.contractTemplateId]);

  const riderSelectOptions = useMemo(() => {
    const placeholder = { id: '', label: 'Elegir entre tus riders guardados…' };
    const fromFiles = riderFiles.map((f) => ({ id: f.id, label: fileLabel(f) }));
    const ids = new Set(fromFiles.map((o) => o.id));
    const extra: Array<{ id: string; label: string }> = [];
    if (form.technicalRiderTemplateId && !ids.has(form.technicalRiderTemplateId)) {
      extra.push({ id: form.technicalRiderTemplateId, label: '(Documento vinculado)' });
    }
    return [placeholder, ...extra, ...fromFiles];
  }, [riderFiles, form.technicalRiderTemplateId]);

  const canSaveUploadModal =
    uploadModal.isOpen &&
    !isSavingUpload &&
    Boolean(uploadModal.name.trim()) &&
    Boolean(uploadModal.file) &&
    uploadModal.file?.type === 'application/pdf';

  const startEdit = useCallback((service: ArtistServiceRecord) => {
    setForm({
      id: service.id,
      name: service.name,
      price: String(service.price),
      description: service.description ?? '',
      details: service.features ?? [],
      imageUrl: service.imageUrl ?? '',
      contractTemplateId: service.contractTemplateId ?? service.contractId ?? '',
      technicalRiderTemplateId: service.technicalRiderTemplateId ?? service.technicalRiderId ?? '',
    });
    setImageFile(null);
    setPreviewUrl('');
    setError('');
    setEditorError('');
    setEditorMode('edit');
    setIsEditorOpen(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !openEditorForServiceId) return;
    const svc = services.find((s) => s.id === openEditorForServiceId);
    if (!svc) {
      onOpenEditorForServiceIdConsumed?.();
      return;
    }
    startEdit(svc);
    onOpenEditorForServiceIdConsumed?.();
  }, [isOpen, openEditorForServiceId, services, onOpenEditorForServiceIdConsumed, startEdit]);

  if (!isOpen) return null;

  const subtleScrollbarClass =
    'scrollbar-thin [scrollbar-color:rgba(255,255,255,0.20)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30';

  const startCreate = () => {
    setForm(emptyForm);
    setImageFile(null);
    setPreviewUrl('');
    setError('');
    setEditorError('');
    setEditorMode('create');
    setIsEditorOpen(true);
  };

  const addDetail = () => {
    const value = newDetail.trim();
    if (!value) return;
    if (form.details.includes(value)) {
      setNewDetail('');
      return;
    }
    setForm((prev) => ({ ...prev, details: [...prev.details, value] }));
    setNewDetail('');
  };

  const removeDetail = (index: number) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.filter((_, idx) => idx !== index),
    }));
  };

  const onImageChange = (file: File | null) => {
    setImageFile(file);
    if (!file) {
      setPreviewUrl('');
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const saveService = async () => {
    const name = form.name.trim();
    const price = Number(form.price);
    const sanitizedDetails = form.details.map((detail) => detail.trim()).filter(Boolean);
    const trimmedDescription = form.description.trim();
    const createPayload: CreateArtistServiceBody = {
      name,
      price,
      contractTemplateId: form.contractTemplateId || undefined,
      technicalRiderTemplateId: form.technicalRiderTemplateId || undefined,
    };
    if (trimmedDescription) createPayload.description = trimmedDescription;
    if (sanitizedDetails.length > 0) createPayload.features = sanitizedDetails;
    const updatePayload: UpdateArtistServiceBody = { ...createPayload };
    if (!name || Number.isNaN(price) || price < 0) {
      setEditorError('Nombre y precio valido son obligatorios.');
      return;
    }
    setIsSaving(true);
    setEditorError('');
    setError('');
    try {
      if (editorMode === 'edit' && form.id) {
        const updated = imageFile
          ? await updateArtistServiceWithFormData(form.id, updatePayload, imageFile, null, null)
          : await updateArtistService(form.id, updatePayload);
        onServicesChange(services.map((item) => (item.id === updated.id ? updated : item)));
        startEdit(updated);
      } else {
        const createdWithFiles = await createArtistService(createPayload, imageFile);
        onServicesChange([createdWithFiles, ...services]);
        startEdit(createdWithFiles);
      }
      setIsEditorOpen(false);
      setEditorMode('create');
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'No se pudo guardar el servicio.');
    } finally {
      setIsSaving(false);
    }
  };

  const openServiceDocumentUploadModal = (target: ServiceDocumentUploadTarget) => {
    setUploadModalError('');
    setUploadModal({
      isOpen: true,
      target,
      name: '',
      description: '',
      file: null,
    });
  };

  const closeServiceDocumentUploadModal = () => {
    setUploadModalError('');
    setUploadModal((prev) => ({ ...prev, isOpen: false, file: null, description: '' }));
  };

  const saveServiceDocumentUploadModal = async () => {
    const name = uploadModal.name.trim();
    if (!name) {
      setUploadModalError(uploadModalMessages.nameRequired);
      return;
    }
    if (!uploadModal.file) {
      setUploadModalError(uploadModalMessages.pdfRequiredCreate);
      return;
    }
    if (uploadModal.file.type !== 'application/pdf') {
      setUploadModalError(uploadModalMessages.pdfTypeInvalid);
      return;
    }
    setIsSavingUpload(true);
    setUploadModalError('');
    try {
      const pdfFile = buildNamedPdfFile(uploadModal.file, name);
      const desc = uploadModal.description.trim();
      const record = await uploadArtistFile(pdfFile, uploadModal.target, {
        displayName: name,
        ...(desc ? { description: desc } : {}),
      });
      const [contracts, riders] = await Promise.all([
        listMyArtistFiles('contract'),
        listMyArtistFiles('technical_rider'),
      ]);
      setContractFiles(contracts);
      setRiderFiles(riders);
      if (uploadModal.target === 'contract') {
        setForm((prev) => ({ ...prev, contractTemplateId: record.id }));
      } else {
        setForm((prev) => ({ ...prev, technicalRiderTemplateId: record.id }));
      }
      closeServiceDocumentUploadModal();
    } catch (err) {
      setUploadModalError(
        err instanceof Error ? err.message : 'No se pudo subir el documento. Inténtalo de nuevo.',
      );
    } finally {
      setIsSavingUpload(false);
    }
  };

  const removeService = async (id: string) => {
    setIsSaving(true);
    setError('');
    try {
      await deleteArtistService(id);
      const next = services.filter((item) => item.id !== id);
      onServicesChange(next);
      if (form.id === id) startCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el servicio.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCustomSelect = (
    selectId: CustomSelectId,
    label: string,
    value: string,
    options: Array<{ id: string; label: string }>,
    onChange: (next: string) => void,
  ) => {
    const selectedOption = options.find((option) => option.id === value) ?? options[0];
    const isOpen = openCustomSelect === selectId;
    const isPlaceholder = !value;
    return (
      <div className="block" data-custom-select-root="true">
        {label ? <p className="mb-1.5 text-sm font-medium text-neutral-300">{label}</p> : null}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenCustomSelect((prev) => (prev === selectId ? null : selectId))}
            className={`touch-manipulation flex min-h-[44px] w-full items-center justify-between rounded-xl border bg-black/20 px-3 py-2.5 text-sm outline-none transition focus-visible:border-[#00d4c8]/50 focus-visible:ring-2 focus-visible:ring-[#00d4c8]/25 ${
              isOpen ? 'border-[#00d4c8]/55' : 'border-white/20'
            }`}
          >
            <span className={isPlaceholder ? 'text-neutral-500' : 'text-white'}>{selectedOption.label}</span>
            <FiChevronDown
              size={17}
              className={`shrink-0 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {isOpen && (
            <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-white/15 bg-[#0f1115] shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
              <div className="max-h-52 overflow-y-auto py-1 scrollbar-thin [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
                {options.map((option) => {
                  const isSelected = option.id === value;
                  return (
                    <button
                      key={option.id || 'placeholder'}
                      type="button"
                      onClick={() => {
                        onChange(option.id);
                        setOpenCustomSelect(null);
                      }}
                      className={`touch-manipulation flex min-h-[44px] w-full items-center px-3 py-2.5 text-left text-sm transition sm:min-h-0 sm:py-2 ${
                        isSelected
                          ? 'bg-[#00d4c8]/20 text-white'
                          : 'text-neutral-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const toggleServicePin = async (service: ArtistServiceRecord) => {
    if (pinLoadingServiceIds.has(service.id)) return;
    const previousPinned = Boolean(service.isPinned);
    setPinLoadingServiceIds((prev) => new Set(prev).add(service.id));
    setError('');
    onServicesChange(
      services.map((item) =>
        item.id === service.id ? { ...item, isPinned: !previousPinned } : item,
      ),
    );
    try {
      const updated = await updateArtistService(service.id, { isPinned: !service.isPinned });
      onServicesChange(services.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      onServicesChange(
        services.map((item) =>
          item.id === service.id ? { ...item, isPinned: previousPinned } : item,
        ),
      );
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado de fijado.');
    } finally {
      setPinLoadingServiceIds((prev) => {
        const next = new Set(prev);
        next.delete(service.id);
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex min-h-0 items-stretch justify-center bg-black/70 p-0 sm:items-center sm:p-4 sm:pt-[max(0.5rem,env(safe-area-inset-top))] sm:pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pl-[max(0.5rem,env(safe-area-inset-left))] sm:pr-[max(0.5rem,env(safe-area-inset-right))]">
      <div
        className={`flex h-full min-h-0 max-h-[100dvh] w-full max-w-full flex-col overflow-hidden rounded-none border-x-0 border-y border-[#00d4c8]/35 bg-[#111214] shadow-none sm:h-auto sm:max-h-[90vh] sm:max-w-[min(1240px,calc(100vw-1.5rem))] sm:rounded-3xl sm:border sm:shadow-[0_0_40px_rgba(0,212,200,0.2)] ${subtleScrollbarClass}`}
      >
        <div className="shrink-0 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-4 sm:pt-6 md:px-8 md:pt-8">
          <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-x-4">
            <h3 className="col-start-1 row-start-1 min-w-0 self-start text-2xl font-semibold tracking-tight text-white sm:self-center sm:text-3xl md:text-4xl">
              Administrar Servicios
            </h3>
            <Button
              className="col-span-2 col-start-1 row-start-2 w-full shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto sm:justify-self-start sm:px-7 sm:py-2.5 sm:text-base"
              leftIcon={<FiPlus className="text-lg sm:text-xl" aria-hidden />}
              onClick={startCreate}
            >
              Agregar servicios
            </Button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="touch-manipulation col-start-2 row-start-1 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center self-start rounded-full border border-white/20 text-white/70 transition hover:border-white/30 hover:bg-white/5 hover:text-white disabled:opacity-50 sm:col-start-3 sm:self-center"
              aria-label="Cerrar modal"
            >
              <FiX size={20} aria-hidden />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-white/10 pt-3">
            <p className="max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
              Añade, edita y gestiona tus servicios
            </p>
            {services.length > 0 ? (
              <span className="shrink-0 text-sm text-neutral-500">
                · {services.length} {services.length === 1 ? 'servicio' : 'servicios'}
              </span>
            ) : null}
          </div>
        </div>

        {error && (
          <p className="mx-4 mb-0 mt-2 shrink-0 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-300 sm:mx-6 md:mx-8">
            {error}
          </p>
        )}

        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-6 sm:pt-4 md:px-8 md:pb-6 md:pt-4 ${subtleScrollbarClass}`}
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-5">
            <div className="grid auto-rows-fr grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[480px]:gap-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
              {orderedServices.map((service) => {
                const isPinUpdating = pinLoadingServiceIds.has(service.id);
                return (
                <article
                  key={service.id}
                  className={`flex h-full min-h-0 min-w-0 flex-col ${adminServiceCardShell}`}
                >
                  <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-neutral-950">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div
                        className="h-full w-full opacity-95"
                        style={{
                          background:
                            'linear-gradient(135deg, #00d4c833 0%, transparent 60%), linear-gradient(225deg, #27272a 0%, #0a0a0a 100%)',
                        }}
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-neutral-950/45 to-transparent" />
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
                    <div className="border-b border-white/10 pb-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleServicePin(service)}
                          disabled={isSaving || isPinUpdating}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                            service.isPinned
                              ? 'border-accent/60 bg-accent/20 text-accent'
                              : 'border-white/20 text-neutral-400 hover:border-white/35 hover:text-white'
                          }`}
                        >
                          {isPinUpdating ? (
                            <span
                              className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"
                              aria-hidden
                            />
                          ) : (
                            <FaThumbtack size={11} className="-rotate-45" aria-hidden />
                          )}
                          {isPinUpdating ? 'Guardando...' : service.isPinned ? 'Fijado' : 'Fijar'}
                        </button>
                        <p className="text-lg font-semibold tabular-nums leading-none text-accent sm:text-xl">
                          ${service.price}
                        </p>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="min-w-0 flex-1 text-base font-semibold leading-snug text-white line-clamp-2 sm:text-lg">
                          {service.name}
                        </h4>
                        <span className="pt-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500 sm:text-xs">
                          por hora
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-neutral-400">
                      {service.description || 'Sin descripcion'}
                    </p>
                    <div className="mt-2 min-h-[3rem] flex-1">
                      {(service.features?.length ?? 0) > 0 ? (
                        <ul className="space-y-1.5">
                          {service.features?.slice(0, 3).map((detail) => (
                            <li key={detail} className="flex gap-2 text-xs leading-snug text-neutral-400 sm:text-sm">
                              <span className="shrink-0 text-accent">✓</span>
                              <span className="min-w-0 line-clamp-1">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <div className="mt-auto flex gap-2 border-t border-white/10 pt-4">
                      <Button
                        variant="outline"
                        className="min-h-[44px] flex-1 rounded-full border-white/20 bg-white/[0.02] px-3 py-2 text-xs hover:border-white/35 hover:bg-white/[0.06] sm:min-h-[38px] sm:text-sm"
                        onClick={() => startEdit(service)}
                        disabled={isSaving}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        className="min-h-[44px] flex-1 rounded-full px-3 py-2 text-xs sm:min-h-[38px] sm:text-sm [&_svg]:size-3.5"
                        leftIcon={<FiTrash2 />}
                        onClick={() => removeService(service.id)}
                        disabled={isSaving}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </article>
                );
              })}
              {services.length === 0 && (
                <p className="col-span-full rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-12 text-center text-sm text-neutral-500 sm:py-14">
                  Aun no tienes servicios. Usa <span className="text-neutral-300">Agregar servicios</span> para crear
                  el primero.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditorOpen && (
        <>
        <div className="fixed inset-0 z-[100] flex min-h-0 items-stretch justify-center bg-black/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4 sm:pt-[max(0.5rem,env(safe-area-inset-top))] sm:pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pl-[max(0.5rem,env(safe-area-inset-left))] sm:pr-[max(0.5rem,env(safe-area-inset-right))]">
          <div className="flex h-full min-h-0 max-h-[100dvh] w-full max-w-full flex-col overflow-hidden rounded-none border-x-0 border-y border-[#00d4c8]/35 bg-[#111214] shadow-none sm:h-auto sm:max-h-[90vh] sm:max-w-[min(1120px,calc(100vw-1.5rem))] sm:rounded-3xl sm:border sm:shadow-[0_0_40px_rgba(0,212,200,0.18)]">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:gap-4 sm:px-7 sm:pb-5 sm:pt-6">
              <div className="min-w-0 pr-2">
                <h4 className="text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-3xl">
                  {editorMode === 'create' ? 'Crear nuevo servicio' : 'Editar servicio'}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500 sm:text-sm">
                  {editorMode === 'create'
                    ? 'Nombre y precio son obligatorios. Puedes añadir foto, descripción y documentos después.'
                    : 'Completa los campos y guarda los cambios.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditorError('');
                  setIsEditorOpen(false);
                }}
                disabled={isSaving}
                className="touch-manipulation inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white/30 hover:bg-white/5 hover:text-white disabled:opacity-50"
                aria-label="Cerrar editor"
              >
                <FiX size={20} aria-hidden />
              </button>
            </div>
            {editorError ? (
              <p
                role="alert"
                className="shrink-0 border-b border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm leading-relaxed text-red-200/95 sm:px-7"
              >
                {editorError}
              </p>
            ) : null}
            <div
              className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-7 sm:py-6 ${subtleScrollbarClass}`}
            >
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:space-y-5 sm:p-6 lg:space-y-6">
                <div className="flex flex-col items-center gap-3 border-b border-white/10 pb-5">
                  <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-[#00d4c8]/30 bg-black/40 shadow-[0_0_20px_rgba(0,212,200,0.12)]">
                    {selectedImage ? (
                      <img src={selectedImage} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-neutral-500">Sin foto</div>
                    )}
                  </div>
                  <label className="touch-manipulation inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-full border border-[#00d4c8]/50 bg-[#00d4c8]/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#00d4c8]/70 hover:bg-[#00d4c8]/25">
                    Cambiar foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-neutral-300">Nombre del servicio</p>
                  <input
                    value={form.name}
                    onChange={(e) => {
                      setEditorError('');
                      setForm((prev) => ({ ...prev, name: e.target.value }));
                    }}
                    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-[#00d4c8]/50 focus:ring-2 focus:ring-[#00d4c8]/25"
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-neutral-300">Precio</p>
                    <input
                      value={form.price}
                      type="number"
                      min={0}
                      step={0.01}
                      onChange={(e) => {
                        setEditorError('');
                        setForm((prev) => ({ ...prev, price: e.target.value }));
                      }}
                      className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-white outline-none transition focus:border-[#00d4c8]/50 focus:ring-2 focus:ring-[#00d4c8]/25"
                    />
                  </div>
                  <div className="self-end rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm text-neutral-400">
                    Por hora
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-neutral-300">Descripcion</p>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => {
                      setEditorError('');
                      setForm((prev) => ({ ...prev, description: e.target.value }));
                    }}
                    className="min-h-[7.5rem] w-full resize-y rounded-xl border border-white/20 bg-black/20 px-3 py-3 text-white outline-none transition focus:border-[#00d4c8]/50 focus:ring-2 focus:ring-[#00d4c8]/25"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:space-y-5 sm:p-6 lg:space-y-6">
                <div>
                  <p className="text-base font-semibold text-white">Detalles</p>
                  <p className="mt-0.5 text-xs text-neutral-500">Lista de inclusiones o condiciones del servicio.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4">
                  <div className="max-h-[min(240px,40dvh)] space-y-2 overflow-y-auto pr-1 scrollbar-thin [scrollbar-color:rgba(255,255,255,0.15)_transparent] sm:max-h-[min(260px,32vh)]">
                    {form.details.map((detail, index) => (
                      <div key={`${detail}-${index}`} className="flex items-center gap-2">
                        <input
                          value={detail}
                          readOnly
                          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeDetail(index)}
                          className="touch-manipulation inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-red-400/40 text-red-300 transition hover:border-red-400/60 hover:bg-red-500/10"
                          aria-label="Quitar detalle"
                        >
                          <FiTrash2 size={18} aria-hidden />
                        </button>
                      </div>
                    ))}
                    {form.details.length === 0 && (
                      <p className="py-2 text-center text-sm text-neutral-500">Sin items agregados.</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <input
                      value={newDetail}
                      onChange={(e) => setNewDetail(e.target.value)}
                      placeholder="Nuevo item"
                      className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#00d4c8]/50 focus:ring-2 focus:ring-[#00d4c8]/25"
                    />
                  </div>
                  <Button
                    onClick={addDetail}
                    disabled={isSaving}
                    className="touch-manipulation min-h-[44px] shrink-0 rounded-full px-5 py-2.5 text-sm sm:min-h-0"
                  >
                    + Agregar item
                  </Button>
                </div>

                <div className="mt-1 space-y-6 border-t border-white/10 pt-7">
                  <div>
                    <p className="text-base font-semibold text-white">Documentos del servicio</p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                      Elige un PDF que ya tengas en Documentos o sube uno nuevo: se guardará allí y quedará
                      vinculado a este servicio.
                    </p>
                  </div>
                  {filesLoadError ? (
                    <p className="text-xs text-red-300/90">{filesLoadError}</p>
                  ) : filesLoading ? (
                    <p className="text-xs text-neutral-500">Cargando documentos…</p>
                  ) : null}

                  <div className="grid gap-6 sm:grid-cols-2 sm:gap-7">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-5 sm:p-6">
                      <div className="mb-5 flex gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#00d4c8]/25 bg-[#00d4c8]/10 text-[#00d4c8]"
                          aria-hidden
                        >
                          <FiFileText size={20} strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">Contrato</p>
                          <p className="mt-0.5 text-xs leading-snug text-neutral-500">
                            Plantilla que verá el contratante.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                            Usar archivo guardado
                          </p>
                          {renderCustomSelect(
                            'contract',
                            '',
                            form.contractTemplateId,
                            contractSelectOptions,
                            (next) => setForm((prev) => ({ ...prev, contractTemplateId: next })),
                          )}
                        </div>
                        <div className="relative flex items-center gap-3 py-1">
                          <div className="h-px flex-1 bg-white/10" aria-hidden />
                          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">
                            o
                          </span>
                          <div className="h-px flex-1 bg-white/10" aria-hidden />
                        </div>
                        <div>
                          <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
                            Subir PDF nuevo
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            fullWidth
                            disabled={isSaving || isSavingUpload}
                            onClick={() => openServiceDocumentUploadModal('contract')}
                            leftIcon={<FiUpload className="text-base text-[#00d4c8]" aria-hidden />}
                            className="rounded-xl border-[#00d4c8]/40 py-2.5 text-sm font-semibold text-white hover:border-[#00d4c8]/65 hover:bg-[#00d4c8]/10 hover:text-white"
                          >
                            Subir contrato
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-5 sm:p-6">
                      <div className="mb-5 flex gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#00d4c8]/25 bg-[#00d4c8]/10 text-[#00d4c8]"
                          aria-hidden
                        >
                          <FiFileText size={20} strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">Rider técnico</p>
                          <p className="mt-0.5 text-xs leading-snug text-neutral-500">
                            Requerimientos técnicos y de montaje.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                            Usar archivo guardado
                          </p>
                          {renderCustomSelect(
                            'technicalRider',
                            '',
                            form.technicalRiderTemplateId,
                            riderSelectOptions,
                            (next) => setForm((prev) => ({ ...prev, technicalRiderTemplateId: next })),
                          )}
                        </div>
                        <div className="relative flex items-center gap-3 py-1">
                          <div className="h-px flex-1 bg-white/10" aria-hidden />
                          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">
                            o
                          </span>
                          <div className="h-px flex-1 bg-white/10" aria-hidden />
                        </div>
                        <div>
                          <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
                            Subir PDF nuevo
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            fullWidth
                            disabled={isSaving || isSavingUpload}
                            onClick={() => openServiceDocumentUploadModal('technical_rider')}
                            leftIcon={<FiUpload className="text-base text-[#00d4c8]" aria-hidden />}
                            className="rounded-xl border-[#00d4c8]/40 py-2.5 text-sm font-semibold text-white hover:border-[#00d4c8]/65 hover:bg-[#00d4c8]/10 hover:text-white"
                          >
                            Subir rider
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 bg-[#111214] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:gap-3 sm:px-7 sm:py-5 sm:pb-5">
              <Button
                variant="outline"
                className="touch-manipulation min-h-[48px] rounded-full border-white/25 sm:min-h-0 sm:min-w-[120px]"
                onClick={() => {
                  setEditorError('');
                  setIsEditorOpen(false);
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                className="touch-manipulation min-h-[48px] rounded-full sm:min-h-0 sm:min-w-[120px]"
                onClick={saveService}
                loading={isSaving}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>

        {uploadModal.isOpen && (
          <div className="fixed inset-0 z-[110] flex min-h-0 items-stretch justify-center bg-black/70 p-0 sm:items-center sm:p-4 sm:pt-[max(0.5rem,env(safe-area-inset-top))] sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pl-[max(0.75rem,env(safe-area-inset-left))] sm:pr-[max(0.75rem,env(safe-area-inset-right))]">
            <div className="flex h-full min-h-0 max-h-[100dvh] w-full max-w-full flex-col overflow-y-auto overscroll-y-contain rounded-none border-x-0 border-y border-[#00d4c8]/30 bg-[#111214] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-none sm:max-h-[min(90dvh,calc(100dvh-2rem))] sm:max-w-[min(480px,calc(100vw-1.5rem))] sm:rounded-2xl sm:border sm:p-6 sm:pb-6 sm:pt-6 sm:shadow-[0_0_35px_rgba(0,212,200,0.15)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold tracking-tight text-white">Subir documento</h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    {uploadModal.target === 'contract' ? 'Contrato (PDF)' : 'Rider técnico (PDF)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeServiceDocumentUploadModal}
                  disabled={isSavingUpload}
                  className="touch-manipulation inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white/35 hover:bg-white/5 hover:text-white disabled:opacity-50"
                  aria-label="Cerrar"
                >
                  <FiX size={20} aria-hidden />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-neutral-300">Nombre</p>
                  <input
                    value={uploadModal.name}
                    onChange={(event) => {
                      setUploadModalError('');
                      setUploadModal((prev) => ({ ...prev, name: event.target.value }));
                    }}
                    className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#00d4c8]/50 focus:ring-2 focus:ring-[#00d4c8]/25"
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-neutral-300">PDF</p>
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[#00d4c8]/40 px-4 py-2.5 text-sm text-[#00d4c8] touch-manipulation transition-colors hover:border-[#00ece0] hover:text-[#00ece0] sm:min-h-0 sm:py-2">
                    <FiUpload size={14} aria-hidden />
                    {uploadModal.file ? uploadModal.file.name : 'Seleccionar PDF'}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      disabled={isSavingUpload}
                      onChange={(event) => {
                        setUploadModalError('');
                        const file = event.target.files?.[0] ?? null;
                        setUploadModal((prev) => ({ ...prev, file }));
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
              {uploadModalError ? (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200/95"
                >
                  {uploadModalError}
                </p>
              ) : null}
              <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="min-h-[48px] rounded-full border-white/25 sm:min-h-0"
                  onClick={closeServiceDocumentUploadModal}
                  disabled={isSavingUpload}
                >
                  Cancelar
                </Button>
                <Button
                  className="min-h-[48px] rounded-full sm:min-h-0"
                  loading={isSavingUpload}
                  disabled={!canSaveUploadModal}
                  onClick={() => void saveServiceDocumentUploadModal()}
                >
                  Guardar Documento
                </Button>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}
