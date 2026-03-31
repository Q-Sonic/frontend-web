import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { Button } from '../Button';
import {
  createArtistServiceWithFormData,
  deleteArtistService,
  updateArtistServiceWithFormData,
} from '../../api';
import type { ArtistServiceRecord } from '../../types';

type ArtistServicesAdminModalProps = {
  isOpen: boolean;
  services: ArtistServiceRecord[];
  onClose: () => void;
  onServicesChange: (next: ArtistServiceRecord[]) => void;
};

type ServiceFormState = {
  id: string;
  name: string;
  price: string;
  description: string;
  details: string[];
  imageUrl: string;
};

const emptyForm: ServiceFormState = {
  id: '',
  name: '',
  price: '',
  description: '',
  details: [],
  imageUrl: '',
};

export function ArtistServicesAdminModal({
  isOpen,
  services,
  onClose,
  onServicesChange,
}: ArtistServicesAdminModalProps) {
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [newDetail, setNewDetail] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm);
      setNewDetail('');
      setImageFile(null);
      setPreviewUrl('');
      setError('');
      setIsSaving(false);
      setIsEditorOpen(false);
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
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSaving, onClose]);

  const selectedImage = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (form.imageUrl) return form.imageUrl;
    return '';
  }, [form.imageUrl, previewUrl]);

  if (!isOpen) return null;

  const subtleScrollbarClass =
    'scrollbar-thin [scrollbar-color:rgba(255,255,255,0.20)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30';

  const startCreate = () => {
    setForm(emptyForm);
    setImageFile(null);
    setPreviewUrl('');
    setError('');
    setIsEditorOpen(true);
  };

  const startEdit = (service: ArtistServiceRecord) => {
    setForm({
      id: service.id,
      name: service.name,
      price: String(service.price),
      description: service.description ?? '',
      details: service.features ?? [],
      imageUrl: service.imageUrl ?? '',
    });
    setImageFile(null);
    setPreviewUrl('');
    setError('');
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
    if (!name || Number.isNaN(price) || price < 0) {
      setError('Nombre y precio valido son obligatorios.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      if (form.id) {
        const updated = await updateArtistServiceWithFormData(
          form.id,
          {
            name,
            price,
            description: form.description.trim(),
            features: form.details,
          },
          imageFile
        );
        onServicesChange(services.map((item) => (item.id === updated.id ? updated : item)));
        startEdit(updated);
      } else {
        const created = await createArtistServiceWithFormData(
          {
            name,
            price,
            description: form.description.trim(),
            features: form.details,
          },
          imageFile
        );
        onServicesChange([created, ...services]);
        startEdit(created);
      }
      setIsEditorOpen(false);
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
      if (form.id === id) startCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el servicio.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`w-full max-w-[1180px] max-h-[90vh] overflow-y-auto rounded-[26px] border border-[#00d4c8]/45 bg-[#16171b] p-6 shadow-[0_0_45px_rgba(0,212,200,0.18)] ${subtleScrollbarClass}`}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-[42px] font-semibold leading-none text-white">Administrar Servicios</h3>
            <p className="mt-2 text-xl text-white/80">Añade, edita y gestiona tus servicios</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full border border-white/20 p-2 text-white/70 hover:text-white"
            aria-label="Cerrar modal"
          >
            <FiX size={22} />
          </button>
        </div>

        <div className="mb-6 flex justify-end">
          <Button className="rounded-xl px-8 py-3 text-2xl" leftIcon={<FiPlus />} onClick={startCreate}>
            Agregar servicios
          </Button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-[#00d4c8]/35 bg-[#1d1f24] p-3">
          <div className={`overflow-x-auto overflow-y-hidden pb-2 ${subtleScrollbarClass}`}>
            <div className="flex min-w-max gap-3">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="w-[260px] shrink-0 overflow-hidden rounded-xl border border-white/12 bg-[#17191f]"
                >
                  <div className="h-28 bg-black/40">
                    {service.imageUrl ? (
                      <img src={service.imageUrl} alt={service.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-2xl font-semibold text-white">{service.name}</h4>
                      <p className="text-xl font-semibold text-[#00d4c8]">${service.price}</p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-white/70">{service.description || 'Sin descripcion'}</p>
                    {(service.features?.length ?? 0) > 0 && (
                      <ul className="mt-2 space-y-1">
                        {service.features?.slice(0, 3).map((detail) => (
                          <li key={detail} className="truncate text-xs text-white/55">
                            ✓ {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => startEdit(service)} disabled={isSaving}>
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-1"
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
                <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-6 text-center text-sm text-white/60">
                  Aun no tienes servicios.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[860px] rounded-2xl border border-[#00d4c8]/35 bg-[#121317] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-3xl font-semibold text-white">Editando servicios</h4>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                disabled={isSaving}
                className="rounded-full border border-white/20 p-2 text-white/70 hover:text-white"
                aria-label="Cerrar editor"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-3">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-28 w-28 overflow-hidden rounded-full border border-white/20 bg-black/30">
                    {selectedImage ? (
                      <img src={selectedImage} alt="Preview" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <label className="cursor-pointer rounded-lg border border-[#00d4c8]/60 bg-[#00d4c8]/20 px-4 py-2 text-lg font-semibold text-white">
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
                  <p className="mb-1 text-xl text-white">Nombre del servicio</p>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div>
                    <p className="mb-1 text-xl text-white">Precio</p>
                    <input
                      value={form.price}
                      type="number"
                      min={0}
                      step={0.01}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                      className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-white"
                    />
                  </div>
                  <div className="self-end rounded-lg border border-white/30 bg-black/25 px-4 py-2 text-white/80">
                    Por Hora
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xl text-white">Descripcion</p>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-2xl text-white">Detalles</p>
                <div className="rounded-xl bg-white/8 p-3">
                  <div className="space-y-2">
                    {form.details.map((detail, index) => (
                      <div key={`${detail}-${index}`} className="flex items-center gap-2">
                        <input value={detail} readOnly className="w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-white" />
                        <button
                          type="button"
                          onClick={() => removeDetail(index)}
                          className="rounded-md border border-red-400/45 px-2 py-2 text-red-300"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                    {form.details.length === 0 && <p className="text-sm text-white/50">Sin items agregados.</p>}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <input
                      value={newDetail}
                      onChange={(e) => setNewDetail(e.target.value)}
                      placeholder="Nuevo item"
                      className="w-full rounded-lg border border-white/30 bg-transparent px-3 py-2 text-white"
                    />
                  </div>
                  <Button onClick={addDetail} disabled={isSaving} className="rounded-lg px-4 py-2">
                    + Agregar item
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditorOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={saveService} loading={isSaving}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
