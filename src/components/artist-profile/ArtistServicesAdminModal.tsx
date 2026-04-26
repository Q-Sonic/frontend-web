import { useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { FaThumbtack } from 'react-icons/fa6';
import { Button } from '../Button';
import {
  type CreateArtistServiceBody,
  type UpdateArtistServiceBody,
  createArtistService,
  updateArtistService,
  deleteArtistService,
  updateArtistServiceWithFormData,
} from '../../api';
import {
  MAX_PINNED_ITEMS,
  getPinnedItemIds,
  savePinnedItemIds,
  sortPinnedFirst,
  togglePinnedItemId,
} from '../../helpers/pinnedItems';
import type { ArtistServiceRecord } from '../../types';

type ArtistServicesAdminModalProps = {
  isOpen: boolean;
  artistId: string | undefined;
  services: ArtistServiceRecord[];
  onClose: () => void;
  onServicesChange: (next: ArtistServiceRecord[]) => void;
  onPinnedServicesChange?: (ids: string[]) => void;
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

const contractTemplateOptions = [
  { id: '', label: 'Seleccionar contrato' },
  { id: 'contract-standard', label: 'Contrato estandar (ejemplo)' },
  { id: 'contract-festival', label: 'Contrato festival (ejemplo)' },
  { id: 'contract-private-event', label: 'Contrato evento privado (ejemplo)' },
];

const technicalRiderOptions = [
  { id: '', label: 'Seleccionar rider tecnico' },
  { id: 'rider-basic', label: 'Rider basico (ejemplo)' },
  { id: 'rider-full-band', label: 'Rider banda completa (ejemplo)' },
  { id: 'rider-acoustic', label: 'Rider acustico (ejemplo)' },
];

/** Matches public `ArtistServiceCard` shell: teal border, glass fill, hover glow. */
const adminServiceCardShell =
  'group relative overflow-hidden rounded-3xl border border-[#00d4c8]/20 bg-white/[0.04] ' +
  'transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00d4c8]/45 ' +
  'hover:shadow-[0_0_22px_rgba(0,212,200,0.28)]';

export function ArtistServicesAdminModal({
  isOpen,
  artistId,
  services,
  onClose,
  onServicesChange,
  onPinnedServicesChange,
}: ArtistServicesAdminModalProps) {
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [newDetail, setNewDetail] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [riderFile, setRiderFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [pinnedServiceIds, setPinnedServiceIds] = useState<string[]>([]);
  const [openCustomSelect, setOpenCustomSelect] = useState<CustomSelectId | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm);
      setNewDetail('');
      setImageFile(null);
      setContractFile(null);
      setRiderFile(null);
      setPreviewUrl('');
      setError('');
      setIsSaving(false);
      setIsEditorOpen(false);
      setEditorMode('create');
      setOpenCustomSelect(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!artistId) {
      setPinnedServiceIds([]);
      return;
    }
    const existingServiceIds = new Set(services.map((service) => service.id));
    const storedPinned = getPinnedItemIds(artistId, 'services');
    const sanitizedPinned = storedPinned.filter((id) => existingServiceIds.has(id));
    const savedPinned = savePinnedItemIds(artistId, 'services', sanitizedPinned);
    setPinnedServiceIds(savedPinned);
    onPinnedServicesChange?.(savedPinned);
  }, [artistId, services, onPinnedServicesChange]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSaving, onClose]);

  useEffect(() => {
    if (!isEditorOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-custom-select-root="true"]')) {
        setOpenCustomSelect(null);
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [isEditorOpen]);

  const selectedImage = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (form.imageUrl) return form.imageUrl;
    return '';
  }, [form.imageUrl, previewUrl]);

  const orderedServices = useMemo(
    () => sortPinnedFirst(services, pinnedServiceIds),
    [services, pinnedServiceIds],
  );

  if (!isOpen) return null;

  const subtleScrollbarClass =
    'scrollbar-thin [scrollbar-color:rgba(255,255,255,0.20)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30';

  const startCreate = () => {
    setForm(emptyForm);
    setImageFile(null);
    setContractFile(null);
    setRiderFile(null);
    setPreviewUrl('');
    setError('');
    setEditorMode('create');
    setIsEditorOpen(true);
  };

  const startEdit = (service: ArtistServiceRecord) => {
    const serviceWithTemplate = service as ArtistServiceRecord & {
      contractTemplateId?: string;
      technicalRiderTemplateId?: string;
    };
    setForm({
      id: service.id,
      name: service.name,
      price: String(service.price),
      description: service.description ?? '',
      details: service.features ?? [],
      imageUrl: service.imageUrl ?? '',
      contractTemplateId: serviceWithTemplate.contractTemplateId ?? '',
      technicalRiderTemplateId: serviceWithTemplate.technicalRiderTemplateId ?? '',
    });
    setImageFile(null);
    setContractFile(null);
    setRiderFile(null);
    setPreviewUrl('');
    setError('');
    setEditorMode('edit');
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
      setError('Nombre y precio valido son obligatorios.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      if (editorMode === 'edit' && form.id) {
        const updated = (imageFile || contractFile || riderFile)
          ? await updateArtistServiceWithFormData(form.id, updatePayload, imageFile, contractFile, riderFile)
          : await updateArtistService(form.id, updatePayload);
        onServicesChange(services.map((item) => (item.id === updated.id ? updated : item)));
        startEdit(updated);
      } else {
        // Create first with JSON, then upload files on update if present.
        const created = await createArtistService(createPayload);
        const createdWithFiles = (imageFile || contractFile || riderFile)
          ? await updateArtistServiceWithFormData(created.id, {}, imageFile, contractFile, riderFile)
          : created;
        onServicesChange([createdWithFiles, ...services]);
        startEdit(createdWithFiles);
      }
      setIsEditorOpen(false);
      setEditorMode('create');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el servicio.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeService = async (id: string) => {
    setIsSaving(true);
    setError('');
    try {
      await deleteArtistService(id);
      const next = services.filter((item) => item.id !== id);
      onServicesChange(next);
      if (artistId) {
        const nextPinned = pinnedServiceIds.filter((pinnedId) => pinnedId !== id);
        const savedPinned = savePinnedItemIds(artistId, 'services', nextPinned);
        setPinnedServiceIds(savedPinned);
        onPinnedServicesChange?.(savedPinned);
      }
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
        <p className="mb-1.5 text-sm font-medium text-neutral-300">{label}</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenCustomSelect((prev) => (prev === selectId ? null : selectId))}
            className={`flex w-full items-center justify-between rounded-xl border bg-black/20 px-3 py-2.5 text-sm outline-none transition focus-visible:border-[#00d4c8]/50 focus-visible:ring-2 focus-visible:ring-[#00d4c8]/25 ${
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
                      className={`flex w-full items-center px-3 py-2 text-left text-sm transition ${
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

  const toggleServicePin = (serviceId: string) => {
    if (!artistId) return;
    const { nextPinnedIds, exceededLimit } = togglePinnedItemId(pinnedServiceIds, serviceId);
    if (exceededLimit) {
      setError(`Solo puedes fijar hasta ${MAX_PINNED_ITEMS} servicios.`);
      return;
    }
    setError('');
    const savedPinned = savePinnedItemIds(artistId, 'services', nextPinnedIds);
    setPinnedServiceIds(savedPinned);
    onPinnedServicesChange?.(savedPinned);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`w-full max-w-[1180px] max-h-[90vh] overflow-y-auto rounded-3xl border border-[#00d4c8]/35 bg-[#111214] p-5 shadow-[0_0_40px_rgba(0,212,200,0.2)] sm:p-6 md:p-8 ${subtleScrollbarClass}`}
      >
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between gap-4">
            <h3 className="min-w-0 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Administrar Servicios
            </h3>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="shrink-0 rounded-full border border-white/20 p-2.5 text-white/70 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
              aria-label="Cerrar modal"
            >
              <FiX size={20} />
            </button>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
            Añade, edita y gestiona tus servicios
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
          {services.length > 0 && (
            <p className="mr-auto text-sm text-neutral-500">
              {services.length} {services.length === 1 ? 'servicio' : 'servicios'}
            </p>
          )}
          <Button
            className="rounded-full px-5 py-2.5 text-sm font-semibold sm:px-7 sm:py-3 sm:text-base"
            leftIcon={<FiPlus className="text-lg sm:text-xl" aria-hidden />}
            onClick={startCreate}
          >
            Agregar servicios
          </Button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
          <div className={`overflow-x-auto overflow-y-hidden pb-1 ${subtleScrollbarClass}`}>
            <div className="flex min-w-max items-stretch gap-4">
              {orderedServices.map((service) => (
                <article
                  key={service.id}
                  className={`flex w-[min(272px,85vw)] shrink-0 flex-col self-stretch ${adminServiceCardShell}`}
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
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/45 to-transparent" />
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
                    <div className="border-b border-white/10 pb-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleServicePin(service.id)}
                          disabled={isSaving}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                            pinnedServiceIds.includes(service.id)
                              ? 'border-accent/60 bg-accent/20 text-accent'
                              : 'border-white/20 text-neutral-400 hover:border-white/35 hover:text-white'
                          }`}
                        >
                          <FaThumbtack size={11} className="-rotate-45" aria-hidden />
                          {pinnedServiceIds.includes(service.id) ? 'Fijado' : 'Fijar'}
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
                        className="min-h-[38px] flex-1 rounded-full border-white/25 px-3 py-2 text-xs hover:border-white/40 hover:bg-white/[0.06] sm:text-sm"
                        onClick={() => startEdit(service)}
                        disabled={isSaving}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        className="min-h-[38px] flex-1 rounded-full px-3 py-2 text-xs sm:text-sm [&_svg]:size-3.5"
                        leftIcon={<FiTrash2 />}
                        onClick={() => removeService(service.id)}
                        disabled={isSaving}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
              {services.length === 0 && (
                <p className="w-full min-w-[min(100%,280px)] rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-10 text-center text-sm text-neutral-500">
                  Aun no tienes servicios. Usa <span className="text-neutral-300">Agregar servicios</span> para crear
                  el primero.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[860px] rounded-3xl border border-[#00d4c8]/35 bg-[#111214] p-5 shadow-[0_0_40px_rgba(0,212,200,0.18)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h4 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Editando servicios</h4>
                <p className="mt-1 text-sm text-neutral-500">Completa los campos y guarda los cambios.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                disabled={isSaving}
                className="shrink-0 rounded-full border border-white/20 p-2 text-white/70 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
                aria-label="Cerrar editor"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex flex-col items-center gap-3 border-b border-white/10 pb-5">
                  <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-[#00d4c8]/30 bg-black/40 shadow-[0_0_20px_rgba(0,212,200,0.12)]">
                    {selectedImage ? (
                      <img src={selectedImage} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-neutral-500">Sin foto</div>
                    )}
                  </div>
                  <label className="cursor-pointer rounded-full border border-[#00d4c8]/50 bg-[#00d4c8]/15 px-5 py-2 text-sm font-semibold text-white transition hover:border-[#00d4c8]/70 hover:bg-[#00d4c8]/25">
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
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
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
                      onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
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
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full resize-y rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-white outline-none transition focus:border-[#00d4c8]/50 focus:ring-2 focus:ring-[#00d4c8]/25"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div>
                  <p className="text-base font-semibold text-white">Detalles</p>
                  <p className="mt-0.5 text-xs text-neutral-500">Lista de inclusiones o condiciones del servicio.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="max-h-[200px] space-y-2 overflow-y-auto pr-1 scrollbar-thin [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
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
                          className="shrink-0 rounded-lg border border-red-400/40 p-2 text-red-300 transition hover:border-red-400/60 hover:bg-red-500/10"
                          aria-label="Quitar detalle"
                        >
                          <FiTrash2 size={16} />
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
                  <Button onClick={addDetail} disabled={isSaving} className="shrink-0 rounded-full px-5 py-2.5 text-sm">
                    + Agregar item
                  </Button>
                </div>

                <div className="mt-2 space-y-3 border-t border-white/10 pt-4">
                  {renderCustomSelect(
                    'contract',
                    'Contrato (Plantilla)',
                    form.contractTemplateId,
                    contractTemplateOptions,
                    (next) => setForm((prev) => ({ ...prev, contractTemplateId: next })),
                  )}
                  
                  {/* Real Contract PDF Upload */}
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-neutral-300">Adjuntar PDF de Contrato</p>
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-black/20 px-4 py-2.5 text-sm text-white transition hover:border-[#00d4c8]/50 hover:bg-[#00d4c8]/5">
                        {contractFile ? 'Cambiar PDF' : 'Seleccionar PDF'}
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => setContractFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      <span className="truncate text-xs text-neutral-500">
                        {contractFile ? contractFile.name : 'Ningún archivo seleccionado'}
                      </span>
                    </div>
                  </div>

                  {renderCustomSelect(
                    'technicalRider',
                    'Rider tecnico (Plantilla)',
                    form.technicalRiderTemplateId,
                    technicalRiderOptions,
                    (next) => setForm((prev) => ({ ...prev, technicalRiderTemplateId: next })),
                  )}

                  {/* Real Rider PDF Upload */}
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-neutral-300">Adjuntar PDF de Rider</p>
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-black/20 px-4 py-2.5 text-sm text-white transition hover:border-[#00d4c8]/50 hover:bg-[#00d4c8]/5">
                        {riderFile ? 'Cambiar PDF' : 'Seleccionar PDF'}
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => setRiderFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      <span className="truncate text-xs text-neutral-500">
                        {riderFile ? riderFile.name : 'Ningún archivo seleccionado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="rounded-full border-white/25 sm:min-w-[120px]"
                onClick={() => setIsEditorOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button className="rounded-full sm:min-w-[120px]" onClick={saveService} loading={isSaving}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
