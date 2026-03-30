import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Skeleton, SkeletonText } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { addArtistProfileMedia, removeArtistProfileGalleryItem, getArtistProfile, ApiError } from '../../api';
import type { ArtistMediaItem } from '../../types';
import { isBackendRoleArtista } from '../../helpers/role';
import { MEDIA_TYPE_OPTIONS, type MediaTypeOption } from '../../helpers/mediaLimits';
import { withMinimumDelay } from '../../helpers/withMinimumDelay';
import { ARTIST_PROFILE_ACCENT } from '../../helpers/artistProfile';

const shellClass =
  'w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-12';

const panelClass =
  'rounded-2xl border border-white/10 bg-white/[0.03] overflow-visible';

const labelClass = 'block text-sm font-medium text-white/70 mb-2';

const fileInputClass =
  'block w-full text-sm text-white/70 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl ' +
  'file:border file:border-[#00d4c8]/40 file:bg-[#00d4c8]/12 file:text-[#00d4c8] file:font-semibold ' +
  'file:cursor-pointer hover:file:bg-[#00d4c8]/22 disabled:opacity-50';

type GalleryKindFilter = 'all' | MediaTypeOption;

const GALLERY_FILTER_OPTIONS: { key: GalleryKindFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'image', label: 'Imágenes' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
];

function MediaTypeDropdown({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: MediaTypeOption;
  onChange: (next: MediaTypeOption) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = MEDIA_TYPE_OPTIONS.find((o) => o.value === value)!;

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={
          'w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm ' +
          'bg-white/[0.06] border-white/12 text-white shadow-sm ' +
          'hover:border-[#00d4c8]/35 hover:bg-white/[0.08] ' +
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4c8]/50 focus-visible:border-[#00d4c8]/45 ' +
          'disabled:opacity-50 disabled:pointer-events-none transition-colors'
        }
      >
        <span className="min-w-0 truncate">
          <span className="text-white/90">{current.label}</span>
          <span className="text-white/45"> — máximo {current.maxLabel}</span>
        </span>
        <svg
          className={`h-5 w-5 shrink-0 text-[#00d4c8] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-labelledby={id}
          className={
            'absolute left-0 right-0 top-[calc(100%+6px)] z-[100] max-h-[min(280px,70vh)] overflow-y-auto rounded-xl border border-[#00d4c8]/30 ' +
            'bg-[#111113] py-1 shadow-xl shadow-black/50 ring-1 ring-black/40'
          }
        >
          {MEDIA_TYPE_OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={
                    'flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left text-sm transition-colors ' +
                    (active
                      ? 'bg-[#00d4c8]/16 text-[#00d4c8]'
                      : 'text-white/85 hover:bg-white/[0.06] hover:text-white')
                  }
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="font-semibold">{opt.label}</span>
                  <span className={active ? 'text-[#00d4c8]/75 text-xs' : 'text-white/40 text-xs'}>
                    Máximo {opt.maxLabel}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Teal chip buttons aligned with file-picker styling */
const previewChipBtnClass =
  'text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#00d4c8]/40 bg-[#00d4c8]/10 text-[#00d4c8] ' +
  'hover:bg-[#00d4c8]/18 hover:border-[#00d4c8]/65 transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4c8]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c] ' +
  'disabled:opacity-35 disabled:pointer-events-none';

const MAX_FILES_PER_BATCH = 30;

type PendingMediaItem = {
  id: string;
  file: File;
  previewUrl: string;
};

const IMAGE_NAME_RE = /\.(jpe?g|png|gif|webp|bmp|svg|heic|avif|tiff?)$/i;
const AUDIO_NAME_RE = /\.(mp3|wav|webm|ogg|m4a|aac|flac)$/i;
const VIDEO_NAME_RE = /\.(mp4|webm|mov|qt|m4v|avi|mkv)$/i;

/** MIME first; many Windows pickers leave `file.type` empty — fall back to extension. */
function inferredMediaKind(file: File): MediaTypeOption | null {
  const t = (file.type || '').toLowerCase();
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('audio/')) return 'audio';
  if (t.startsWith('video/')) return 'video';
  const name = file.name.toLowerCase();
  if (IMAGE_NAME_RE.test(name)) return 'image';
  if (AUDIO_NAME_RE.test(name)) return 'audio';
  if (VIDEO_NAME_RE.test(name)) return 'video';
  return null;
}

function fileMatchesSelectedType(file: File, selectedType: MediaTypeOption): boolean {
  return inferredMediaKind(file) === selectedType;
}

function makePendingId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ArtistMediaPage() {
  const { user } = useAuth();
  const [mediaList, setMediaList] = useState<ArtistMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [galleryError, setGalleryError] = useState('');
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const [roleBlocked, setRoleBlocked] = useState(false);
  const [selectedType, setSelectedType] = useState<MediaTypeOption>('image');
  const [pendingItems, setPendingItems] = useState<PendingMediaItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [galleryKindFilter, setGalleryKindFilter] = useState<GalleryKindFilter>('all');

  const isArtista = isBackendRoleArtista(user?.role);
  /** Backend should send `uid`; some responses use `id` — keep both for links and guards. */
  const sessionArtistId = user?.uid ?? (user as { id?: string } | null)?.id ?? '';
  const galleryHref = sessionArtistId ? `/artist/${sessionArtistId}/gallery` : '/artist';
  const currentOption = MEDIA_TYPE_OPTIONS.find((o) => o.value === selectedType)!;

  const revokePreviews = useCallback((items: PendingMediaItem[]) => {
    items.forEach((p) => URL.revokeObjectURL(p.previewUrl));
  }, []);

  const pendingRef = useRef(pendingItems);
  pendingRef.current = pendingItems;
  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (!user || !isArtista) {
      if (!user) return;
      if (!isArtista) setRoleBlocked(true);
      setIsLoading(false);
      return;
    }

    setRoleBlocked(false);
    setIsLoading(true);

    let cancelled = false;
    async function load() {
      try {
        const profile = await withMinimumDelay(1000, () => getArtistProfile());
        if (cancelled) return;
        setMediaList(Array.isArray(profile.media) ? profile.media : []);
      } catch {
        if (!cancelled) setMediaList([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, isArtista]);

  function clearPending() {
    revokePreviews(pendingItems);
    setPendingItems([]);
    setSelectedIds(new Set());
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    // FileList is live: clearing `input.value` empties it in many browsers — snapshot first.
    const chosenFiles = input.files?.length ? Array.from(input.files) : [];
    input.value = '';
    if (chosenFiles.length === 0) return;

    const errors: string[] = [];
    const next: PendingMediaItem[] = [];
    let room = MAX_FILES_PER_BATCH - pendingItems.length;
    if (room <= 0) {
      setUploadError(`Máximo ${MAX_FILES_PER_BATCH} archivos en cola. Sube o vacía la lista antes de añadir más.`);
      return;
    }

    for (let i = 0; i < chosenFiles.length; i++) {
      if (room <= 0) {
        errors.push(`Solo se añadieron los primeros archivos (límite ${MAX_FILES_PER_BATCH} en cola).`);
        break;
      }
      const file = chosenFiles[i]!;
      if (!fileMatchesSelectedType(file, selectedType)) {
        errors.push(`“${file.name}” no coincide con el tipo elegido (${currentOption.label}).`);
        continue;
      }
      if (file.size > currentOption.maxBytes) {
        errors.push(`“${file.name}” supera ${currentOption.maxLabel}.`);
        continue;
      }
      next.push({
        id: makePendingId(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
      room -= 1;
    }

    if (next.length === 0 && errors.length === 0) {
      setUploadError('No se seleccionaron archivos válidos.');
      return;
    }

    setUploadError(errors.length > 0 ? errors.join(' ') : '');
    setPendingItems((prev) => [...prev, ...next]);
    setSelectedIds((sel) => {
      const n = new Set(sel);
      next.forEach((item) => n.add(item.id));
      return n;
    });
  }

  function removePendingItem(id: string) {
    setPendingItems((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
    setSelectedIds((sel) => {
      const n = new Set(sel);
      n.delete(id);
      return n;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((sel) => {
      const n = new Set(sel);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function selectAllPending() {
    setSelectedIds(new Set(pendingItems.map((p) => p.id)));
  }

  function deselectAllPending() {
    setSelectedIds(new Set());
  }

  async function uploadFilesForItems(items: PendingMediaItem[]) {
    if (!user || items.length === 0) return;
    setUploadError('');
    setIsUploading(true);
    try {
      const files = items.map((p) => p.file);
      const profile = await addArtistProfileMedia(files);
      setGalleryError('');
      setMediaList(Array.isArray(profile.media) ? profile.media : []);
      const uploadedIds = new Set(items.map((i) => i.id));
      items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
      setPendingItems((prev) => prev.filter((p) => !uploadedIds.has(p.id)));
      setSelectedIds((sel) => {
        const n = new Set(sel);
        uploadedIds.forEach((id) => n.delete(id));
        return n;
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir los archivos.');
    } finally {
      setIsUploading(false);
    }
  }

  function handleConfirmUpload() {
    const items = pendingItems.filter((p) => selectedIds.has(p.id));
    void uploadFilesForItems(items);
  }

  async function handleRemove(url: string) {
    const trimmed = typeof url === 'string' ? url.trim() : '';
    if (!user || !trimmed || removingUrl !== null) return;
    setGalleryError('');
    setRemovingUrl(trimmed);
    try {
      const profile = await removeArtistProfileGalleryItem(trimmed);
      setMediaList(Array.isArray(profile.media) ? profile.media : []);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'No se pudo eliminar el archivo de la galería.';
      setGalleryError(msg);
    } finally {
      setRemovingUrl(null);
    }
  }

  const selectedCount = pendingItems.filter((p) => selectedIds.has(p.id)).length;
  const allSelected = pendingItems.length > 0 && selectedCount === pendingItems.length;

  const filteredGalleryItems = useMemo(() => {
    if (galleryKindFilter === 'all') return mediaList;
    return mediaList.filter((m) => m.type === galleryKindFilter);
  }, [mediaList, galleryKindFilter]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className={shellClass}>
        <div className="space-y-2 mb-8">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-10 w-72 max-w-full rounded-lg" />
        </div>
        <div className={panelClass}>
          <div className="px-5 py-4 border-b border-white/10">
            <Skeleton className="h-6 w-48 rounded" />
          </div>
          <div className="p-5 space-y-4">
            <SkeletonText lines={2} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 p-4 space-y-3">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="rounded-xl border border-white/10 p-4 space-y-3">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            </div>
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (roleBlocked) {
    return (
      <div className={shellClass}>
        <div className={`${panelClass} p-8 text-center max-w-lg mx-auto`}>
          <p className="text-white/70 mb-6">Solo los artistas pueden subir contenido.</p>
          <Link to="/artist">
            <Button variant="primary">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <header className="mb-8 space-y-2">
        <Link
          to={galleryHref}
          className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-[#00d4c8] transition-colors"
        >
          <span aria-hidden>←</span>
          Volver a galería
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Galería · Subir contenido</h1>
        <p className="text-sm text-white/55 max-w-2xl leading-relaxed">
          Añade imágenes, audio o video a tu perfil público. Puedes elegir varios archivos del mismo tipo, revisarlos y subir todos o solo los que marques.
        </p>
      </header>

      <div className="space-y-8">
        <section className={`${panelClass} relative z-30`}>
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: ARTIST_PROFILE_ACCENT }}
              aria-hidden
            />
            <h2 className="text-lg font-semibold text-white tracking-tight">Nuevo archivo</h2>
          </div>
          <div className="p-5 sm:p-6 space-y-5">
            {uploadError && (
              <p
                className="text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3"
                role="alert"
              >
                {uploadError}
              </p>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="media-type" className={labelClass}>
                  Tipo de archivo
                </label>
                <MediaTypeDropdown
                  id="media-type"
                  value={selectedType}
                  disabled={isUploading}
                  onChange={(next) => {
                    setSelectedType(next);
                    clearPending();
                  }}
                />
                <p className="text-white/40 text-xs mt-2">
                  Límite {currentOption.maxLabel}.{' '}
                  {currentOption.value === 'image'
                    ? 'JPEG, PNG, WebP, GIF.'
                    : currentOption.value === 'audio'
                      ? 'MP3, WAV, WebM, OGG.'
                      : 'MP4, WebM.'}
                </p>
              </div>
              <div>
                <label htmlFor="media-file" className={labelClass}>
                  Archivos
                </label>
                <div className="rounded-xl border border-dashed border-[#00d4c8]/22 bg-[#00d4c8]/[0.05] px-4 py-4 sm:py-5 ring-1 ring-inset ring-white/[0.04]">
                  <input
                    id="media-file"
                    type="file"
                    accept={currentOption.accept}
                    multiple
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className={fileInputClass}
                  />
                </div>
                <p className="text-white/40 text-xs mt-2">
                  Puedes elegir uno o varios a la vez (mismo tipo). Cola máxima: {MAX_FILES_PER_BATCH} archivos.
                </p>
              </div>
            </div>

            {pendingItems.length > 0 && (
              <div className="rounded-2xl border border-[#00d4c8]/20 bg-gradient-to-b from-[#00d4c8]/[0.07] to-transparent p-1 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2 sm:px-0 pt-2 sm:pt-0">
                  <div>
                    <p className="text-sm font-semibold text-white tracking-tight">Vista previa</p>
                    <p className="text-xs text-white/45 mt-0.5">
                      {pendingItems.length} en cola · {selectedCount} marcado{selectedCount !== 1 ? 's' : ''} para subir
                    </p>
                    <p className="text-[11px] text-white/35 mt-1.5 max-w-md leading-snug">
                      Marca con el recuadro turquesa los que quieras enviar. «Quitar» en cada tarjeta la saca de la cola; «Cancelar»
                      vacía toda la selección.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button type="button" onClick={selectAllPending} disabled={isUploading || allSelected} className={previewChipBtnClass}>
                      Marcar todos
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllPending}
                      disabled={isUploading || selectedCount === 0}
                      className={previewChipBtnClass}
                    >
                      Desmarcar todos
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {pendingItems.map((item) => {
                    const isSel = selectedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`group/card relative rounded-xl border overflow-hidden bg-black/25 transition-all duration-200 ${
                          isSel
                            ? 'border-[#00d4c8]/60 ring-2 ring-[#00d4c8]/25 shadow-[0_0_20px_rgba(0,212,200,0.12)]'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <label className="absolute left-2 top-2 z-10 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleSelect(item.id)}
                            disabled={isUploading}
                            className="peer sr-only"
                            aria-label={isSel ? 'No incluir al subir' : 'Incluir al subir'}
                          />
                          <span
                            className={
                              'flex h-[22px] w-[22px] items-center justify-center rounded-md border-2 border-white/30 bg-black/55 shadow-sm transition-colors ' +
                              'hover:border-[#00d4c8]/50 peer-checked:border-[#00d4c8] peer-checked:bg-[#00d4c8]/20 ' +
                              '[&_svg]:opacity-0 peer-checked:[&_svg]:opacity-100 ' +
                              'peer-focus-visible:ring-2 peer-focus-visible:ring-[#00d4c8]/55 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0d0d10] ' +
                              'peer-disabled:opacity-40'
                            }
                          >
                            <svg
                              className="h-3.5 w-3.5 text-[#00d4c8] transition-opacity"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removePendingItem(item.id)}
                          disabled={isUploading}
                          className={
                            'absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg ' +
                            'border border-[#00d4c8]/25 bg-black/50 text-[#00d4c8] shadow-sm ' +
                            'hover:border-red-400/55 hover:bg-red-500/15 hover:text-red-300 transition-colors disabled:opacity-40'
                          }
                          aria-label="Quitar de la cola"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>

                        <div className="aspect-square flex items-center justify-center p-2 pt-10">
                          {selectedType === 'image' && (
                            <img
                              src={item.previewUrl}
                              alt=""
                              className="max-h-full max-w-full object-contain rounded-md"
                            />
                          )}
                          {selectedType === 'audio' && (
                            <audio controls src={item.previewUrl} className="w-full mt-4">
                              Audio
                            </audio>
                          )}
                          {selectedType === 'video' && (
                            <video controls src={item.previewUrl} className="w-full max-h-36 rounded-md object-contain">
                              Video
                            </video>
                          )}
                        </div>
                        <div className="px-2 pb-2 pt-1 border-t border-white/5">
                          <p className="text-[11px] text-white/55 truncate" title={item.file.name}>
                            {item.file.name}
                          </p>
                          <p className="text-[10px] text-white/35">{(item.file.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleConfirmUpload}
                      disabled={isUploading || selectedCount === 0}
                      loading={isUploading}
                    >
                      {isUploading
                        ? 'Subiendo…'
                        : allSelected
                          ? `Subir a la galería (${selectedCount})`
                          : `Subir seleccionadas (${selectedCount})`}
                    </Button>
                    <Button type="button" variant="danger" onClick={clearPending} disabled={isUploading}>
                      Cancelar
                    </Button>
                  </div>
                  {selectedCount === 0 && (
                    <p className="text-xs text-amber-200/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      Marca al menos un archivo con el recuadro turquesa para poder subirlo.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={`${panelClass} relative z-10`}>
          <div className="px-5 py-4 border-b border-white/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start sm:gap-x-4 sm:gap-y-2">
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: ARTIST_PROFILE_ACCENT }}
                    aria-hidden
                  />
                  <h2 className="text-lg font-semibold text-white tracking-tight">Tu galería</h2>
                </div>
                <div
                  className="flex flex-wrap items-center justify-start gap-1.5"
                  role="group"
                  aria-label="Filtrar por tipo"
                >
                  {GALLERY_FILTER_OPTIONS.map(({ key, label }) => {
                    const active = galleryKindFilter === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setGalleryKindFilter(key)}
                        className={
                          'whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold tracking-tight transition-colors ' +
                          (active
                            ? 'border-[#00d4c8]/55 bg-[#00d4c8]/14 text-[#00d4c8] shadow-[0_0_16px_rgba(0,212,200,0.12)]'
                            : 'border-white/12 text-white/50 hover:border-white/22 hover:bg-white/[0.05] hover:text-white/80')
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="text-left text-xs text-white/45 sm:text-right shrink-0">
                {galleryKindFilter === 'all' ? (
                  <span>
                    {mediaList.length} elemento{mediaList.length !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span>
                    {filteredGalleryItems.length} visibles
                    {mediaList.length !== filteredGalleryItems.length && (
                      <span className="text-white/30"> · {mediaList.length} en total</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            {galleryError && (
              <p
                className="text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3"
                role="alert"
              >
                {galleryError}
              </p>
            )}
            {mediaList.length > 0 ? (
              filteredGalleryItems.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredGalleryItems.map((item) => (
                  <article
                    key={item.url}
                    className="group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-[#00d4c8]/35 hover:shadow-[0_0_20px_rgba(0,212,200,0.12)]"
                  >
                    <div className="aspect-video bg-black/30 flex items-center justify-center p-2">
                      {item.type === 'image' && (
                        <img
                          src={item.url}
                          alt={item.name ?? 'Imagen'}
                          className="max-h-44 w-full object-contain rounded-lg"
                        />
                      )}
                      {item.type === 'audio' && (
                        <audio controls src={item.url} className="w-full px-2">
                          Audio
                        </audio>
                      )}
                      {item.type === 'video' && (
                        <video controls src={item.url} className="w-full max-h-44 rounded-lg">
                          Video
                        </video>
                      )}
                    </div>
                    <div className="p-4 flex items-start justify-between gap-3 border-t border-white/5">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-[#00d4c8]/90">{item.type}</p>
                        <p className="text-sm text-white/80 truncate mt-0.5">{item.name ?? item.url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRemove(item.url)}
                        disabled={removingUrl !== null}
                        className="shrink-0 text-xs font-semibold text-red-400/90 hover:text-red-300 px-3 py-1.5 rounded-full border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-45 disabled:pointer-events-none"
                      >
                        {removingUrl === item.url ? 'Quitando…' : 'Quitar'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              ) : (
                <p className="text-sm text-white/45 text-center py-10 border border-dashed border-[#00d4c8]/15 rounded-xl bg-[#00d4c8]/[0.03]">
                  No hay archivos de este tipo. Prueba otro filtro o sube contenido nuevo.
                </p>
              )
            ) : (
              <p className="text-sm text-white/45 text-center py-10 border border-dashed border-white/10 rounded-xl">
                Aún no hay archivos. Sube el primero arriba.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
