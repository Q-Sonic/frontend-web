import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  isUnsignedGoogleStorageObjectUrl,
  resolveArtistProfileMediaUrl,
} from '../../helpers/artistDocumentUrls';
import type { ArtistMediaItem } from '../../types';

interface ArtistGalleryMasonryGridProps {
  items: ArtistMediaItem[];
}

function getMediaTypeBadge(type: ArtistMediaItem['type']) {
  if (type === 'video') return 'Video';
  if (type === 'audio') return 'Audio';
  return 'Foto';
}

/**
 * Multi-column flow: each tile keeps the media’s natural aspect ratio (no fixed grid spans).
 * Avoids “holes” from mismatched row/column spans and distortion from object-cover in arbitrary cells.
 */
const masonryShell =
  'columns-2 [column-fill:balance] [column-gap:0.625rem] sm:columns-3 sm:[column-gap:0.75rem] lg:columns-4';

const cardBase =
  'group relative w-full break-inside-avoid overflow-hidden rounded-[1.25rem] border border-white/10 bg-neutral-950 ' +
  'shadow-[0_2px_12px_rgba(0,0,0,0.4)] transition-all duration-300 ' +
  'mb-2.5 sm:mb-3 ' +
  'hover:z-10 hover:-translate-y-0.5 hover:border-[#00d4c8]/40 hover:shadow-[0_10px_28px_rgba(0,212,200,0.16)]';

const EAGER_IMAGE_COUNT = 14;

/** Resolve src: trim → encode literal spaces. Do not append query params: that breaks signed URLs (S3, etc.). */
function imageSrcForPhase(raw: string, phase: 0 | 1): string {
  const t = raw.trim();
  if (phase === 0) return t;
  return t.replace(/\s/g, '%20');
}

function GalleryImage({
  displaySrc,
  proxyLoading,
  showPrivateStorageHint,
  alt,
  gridIndex,
}: {
  displaySrc: string;
  proxyLoading: boolean;
  showPrivateStorageHint: boolean;
  alt: string;
  gridIndex: number;
}) {
  const [phase, setPhase] = useState<0 | 1>(0);
  const [failed, setFailed] = useState(false);

  const src = useMemo(() => {
    if (!displaySrc) return '';
    if (displaySrc.startsWith('blob:')) return displaySrc;
    return imageSrcForPhase(displaySrc, phase);
  }, [displaySrc, phase]);

  const loading: 'eager' | 'lazy' = gridIndex < EAGER_IMAGE_COUNT ? 'eager' : 'lazy';

  if (proxyLoading && !displaySrc) {
    return (
      <div
        className="min-h-[4rem] w-full animate-pulse bg-neutral-900"
        aria-hidden
      />
    );
  }

  if (failed) {
    return (
      <div className="flex min-h-[4rem] w-full flex-col items-center justify-center gap-1 bg-neutral-900 px-2 py-6 text-center">
        {showPrivateStorageHint ? (
          <>
            <span className="text-[11px] text-white/45">Archivo en almacenamiento privado</span>
            <span className="line-clamp-3 max-w-full text-[9px] text-white/25">
              Inicia sesión para verlo aquí. El enlace directo a Google Cloud no está disponible sin firma.
            </span>
          </>
        ) : (
          <>
            <span className="text-[11px] text-white/45">No se pudo cargar</span>
            <span className="line-clamp-2 max-w-full text-[9px] text-white/25">
              Si la URL caducó, vuelve a subir el archivo en multimedia.
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <img
      key={`${src}-${phase}`}
      src={src}
      alt={alt}
      className="mx-auto block h-auto w-full max-h-[min(85vh,520px)] max-w-full bg-neutral-950 object-contain object-center"
      loading={loading}
      decoding="async"
      fetchPriority={gridIndex < 6 ? 'high' : 'auto'}
      onError={() => {
        if (phase < 1) setPhase(1);
        else setFailed(true);
      }}
    />
  );
}

function MediaFill({
  item,
  gridIndex,
  suspendVideoPreview,
}: {
  item: ArtistMediaItem;
  gridIndex: number;
  /** Pause grid preview while the same clip plays in the lightbox (one decoder, smoother playback). */
  suspendVideoPreview?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const { displaySrc, blockUnsignedStorage } = useMemo(() => {
    const resolved = resolveArtistProfileMediaUrl(item.url);
    return {
      displaySrc: resolved,
      blockUnsignedStorage: isUnsignedGoogleStorageObjectUrl(resolved),
    };
  }, [item.url]);

  useEffect(() => {
    const el = videoPreviewRef.current;
    if (!el || item.type !== 'video') return;
    if (suspendVideoPreview) el.pause();
  }, [item.type, suspendVideoPreview]);

  if (item.type === 'video') {
    return (
      <video
        ref={videoPreviewRef}
        src={displaySrc}
        className="mx-auto block h-auto w-full max-h-[min(85vh,520px)] bg-black object-contain object-center"
        muted
        playsInline
        preload={gridIndex < EAGER_IMAGE_COUNT ? 'auto' : 'metadata'}
      />
    );
  }

  if (item.type === 'audio') {
    return (
      <div className="flex min-h-[8rem] w-full flex-col justify-end gap-2 bg-gradient-to-b from-neutral-900 to-black p-2.5 sm:p-3">
        {/* Clicks on controls must not bubble to the card (card opens lightbox). */}
        <div className="w-full" onClick={(e) => e.stopPropagation()}>
          <audio controls className="w-full" src={displaySrc} preload="metadata">
            Audio
          </audio>
        </div>
      </div>
    );
  }

  return (
    <GalleryImage
      displaySrc={displaySrc}
      proxyLoading={false}
      showPrivateStorageHint={blockUnsignedStorage && !isAuthenticated}
      alt={item.name ?? 'Galería'}
      gridIndex={gridIndex}
    />
  );
}

function TileFooter({ item }: { item: ArtistMediaItem }) {
  return (
    <>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/85 via-black/15 to-transparent sm:h-16" />
      <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-end justify-between gap-2 sm:inset-x-2.5 sm:bottom-2.5">
        <span className="shrink-0 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm sm:px-2 sm:text-[10px]">
          {getMediaTypeBadge(item.type)}
        </span>
        <span className="min-w-0 max-w-[62%] truncate text-right text-[9px] text-white/85 drop-shadow-md sm:max-w-[65%] sm:text-[10px]">
          {item.name || 'Sin título'}
        </span>
      </div>
    </>
  );
}

const lightboxBackdropClass =
  'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] sm:bg-black/45 sm:p-6';

function MediaLightbox({ item, onClose }: { item: ArtistMediaItem; onClose: () => void }) {
  const displaySrc = resolveArtistProfileMediaUrl(item.url);
  const title = item.name || 'Sin título';

  return (
    <div
      className={lightboxBackdropClass}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      {item.type === 'image' && (
        <div
          className="relative max-h-[min(92vh,900px)] max-w-[min(96vw,1200px)]"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={displaySrc}
            alt={title}
            className="max-h-[min(92vh,900px)] max-w-[min(96vw,1200px)] rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
          />
        </div>
      )}

      {item.type === 'video' && (
        <div
          className="isolate w-full max-w-[min(96vw,1200px)]"
          onClick={(e) => e.stopPropagation()}
        >
          <video
            src={displaySrc}
            controls
            playsInline
            className="max-h-[min(92vh,900px)] w-full rounded-xl bg-black object-contain [transform:translateZ(0)] backface-hidden"
            preload="metadata"
          >
            Video
          </video>
        </div>
      )}

      {item.type === 'audio' && (
        <div
          className="w-full max-w-md rounded-2xl border border-white/15 bg-neutral-950/95 px-5 py-6 shadow-2xl ring-1 ring-white/10 sm:max-w-lg sm:px-7 sm:py-8"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-5 truncate text-center text-sm font-medium text-white/90 sm:text-base">
            {title}
          </p>
          <audio controls className="w-full" src={displaySrc} preload="metadata">
            Audio
          </audio>
        </div>
      )}
    </div>
  );
}

const mediaCardButtonClass =
  `${cardBase} relative block w-full cursor-pointer p-0 text-left font-inherit appearance-none`;

const audioCardInteractiveClass = `${cardBase} relative cursor-pointer`;

export function ArtistGalleryMasonryGrid({ items }: ArtistGalleryMasonryGridProps) {
  const [lightboxItem, setLightboxItem] = useState<ArtistMediaItem | null>(null);

  useEffect(() => {
    if (!lightboxItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxItem]);

  useEffect(() => {
    if (!lightboxItem) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxItem]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center">
        <p className="text-sm text-white/60">Todavia no hay elementos para este filtro.</p>
      </div>
    );
  }

  return (
    <>
      <div className={masonryShell}>
        {items.map((item, index) => {
          const key = `${index}-${item.url}`;

          const suspendVideoPreview =
            lightboxItem?.type === 'video' && lightboxItem.url === item.url;

          const chrome = (
            <div className="relative">
              <MediaFill
                item={item}
                gridIndex={index}
                suspendVideoPreview={suspendVideoPreview}
              />
              <TileFooter item={item} />
            </div>
          );

          if (item.type === 'audio') {
            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                className={audioCardInteractiveClass}
                onClick={() => setLightboxItem(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLightboxItem(item);
                  }
                }}
              >
                {chrome}
              </div>
            );
          }

          if (item.type === 'image' || item.type === 'video') {
            return (
              <button
                key={key}
                type="button"
                className={mediaCardButtonClass}
                onClick={() => setLightboxItem(item)}
              >
                {chrome}
              </button>
            );
          }

          return null;
        })}
      </div>
      {lightboxItem && (
        <MediaLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}
    </>
  );
}
