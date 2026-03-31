import { useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiPause, FiPlay } from 'react-icons/fi';
import type { DiscoverArtistCardDisplay } from '../../helpers/discoverArtistCard';

/** Idle + hover aligned with `ArtistGalleryMasonryGrid` client tiles (image hover selection). */
export const discoverArtistCardShellClass =
  'group relative h-full w-full min-h-0 overflow-hidden rounded-[1.25rem] border border-white/10 bg-neutral-950 flex flex-col ' +
  'shadow-[0_2px_12px_rgba(0,0,0,0.4)] transition-all duration-300 ' +
  'hover:z-10 hover:-translate-y-0.5 hover:border-[#00d4c8] hover:shadow-[0_12px_36px_rgba(0,212,200,0.28)]';

type DiscoverArtistCardProps = {
  artist: DiscoverArtistCardDisplay;
  cardKey: string;
  isPlaying: boolean;
  onPlayRequest: () => void;
  onStopRequest: () => void;
  profileHref?: string;
};

export function DiscoverArtistCard({
  artist,
  cardKey,
  isPlaying,
  onPlayRequest,
  onStopRequest,
  profileHref,
}: DiscoverArtistCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const href = profileHref ?? `/client/artists/${artist.id}`;
  const profileDisabled = artist.profileDisabled === true;

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !artist.previewAudioUrl) return;
    if (isPlaying) {
      void el.play().catch(() => onStopRequest());
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [isPlaying, artist.previewAudioUrl, onStopRequest]);

  const togglePreview = useCallback(() => {
    if (!artist.previewAudioUrl) return;
    if (isPlaying) {
      onStopRequest();
    } else {
      onPlayRequest();
    }
  }, [artist.previewAudioUrl, isPlaying, onPlayRequest, onStopRequest]);

  return (
    <article className={discoverArtistCardShellClass}>
      {artist.previewAudioUrl ? (
        <audio
          ref={audioRef}
          src={artist.previewAudioUrl}
          preload="none"
          data-card={cardKey}
          onEnded={() => onStopRequest()}
        />
      ) : null}
      <div className="aspect-4/3 shrink-0 overflow-hidden bg-black/50 relative">
        <img
          src={artist.imageUrl}
          alt=""
          className="w-full h-full object-cover grayscale-[0.25] contrast-[0.95] group-hover:grayscale-0 transition-all duration-300"
        />
      </div>
      <div className="p-4 md:p-5 flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex gap-3 justify-between items-start">
          <div className="min-w-0 flex-1 pr-1">
            <h2 className="font-semibold text-white text-base leading-snug whitespace-normal break-words">
              {artist.name}
            </h2>
            <p className="text-sm text-neutral-400 italic mt-0.5 line-clamp-2">{artist.genreLine}</p>
          </div>
          {artist.priceFromUsd != null && Number.isFinite(artist.priceFromUsd) ? (
            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Tarifa desde</p>
              <p className="text-lg font-semibold text-white tabular-nums">${artist.priceFromUsd} USD</p>
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {artist.previewAudioUrl ? (
              <button
                type="button"
                onClick={togglePreview}
                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#00d4c8] text-[#0a0c10] shadow-[0_0_14px_rgba(0,212,200,0.45)] hover:bg-[#00ece0] transition-colors"
                aria-label={isPlaying ? 'Pausar vista previa' : 'Reproducir vista previa'}
              >
                {isPlaying ? <FiPause size={16} /> : <FiPlay size={16} className="translate-x-px" />}
              </button>
            ) : null}
            <div className="min-w-0 text-xs text-neutral-300 flex items-center gap-1.5">
              {artist.availableToday ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-emerald-400/95 font-medium">Disponible hoy</span>
                </>
              ) : (
                <>
                  <FiClock className="text-[#00d4c8] shrink-0" size={14} aria-hidden />
                  <span className="truncate text-neutral-300">
                    {artist.availableDateLabel ?? 'Consultar fecha'}
                  </span>
                </>
              )}
            </div>
          </div>
          {profileDisabled ? (
            <span
              className="shrink-0 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-neutral-500 cursor-not-allowed select-none"
              aria-disabled
            >
              Ver Perfil
            </span>
          ) : (
            <Link
              to={href}
              className="shrink-0 inline-flex items-center justify-center rounded-lg bg-[#00d4c8] px-3 py-1.5 text-xs font-semibold text-[#0a0c10] shadow-[0_0_12px_rgba(0,212,200,0.25)] hover:bg-[#00ece0] transition-colors"
            >
              Ver Perfil
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
