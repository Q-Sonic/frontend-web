import { useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiPause, FiPlay } from 'react-icons/fi';
import type { DiscoverArtistCardDisplay } from '../../helpers/discoverArtistCard';

/** Idle + hover aligned with `ArtistGalleryMasonryGrid` client tiles (image hover selection). */
export const discoverArtistCardShellClass =
  'group relative h-full w-full min-h-0 overflow-hidden rounded-[1.1rem] border border-white/10 bg-neutral-950 flex flex-col ' +
  'shadow-[0_2px_12px_rgba(0,0,0,0.35)] transition-all duration-300 ' +
  'hover:z-10 hover:-translate-y-0.5 hover:border-[#00d4c8] hover:shadow-[0_10px_30px_rgba(0,212,200,0.2)]';

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
  const imageRef = useRef<HTMLImageElement | null>(null);
  const href = profileHref ?? `/client/artists/${artist.id}`;
  const profileDisabled = artist.profileDisabled === true;
  const initials = artist.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

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
      <div className="aspect-16/10 shrink-0 overflow-hidden bg-[radial-gradient(circle_at_top,#1f2937,#09090b_65%)] relative">
        <img
          ref={imageRef}
          src={artist.imageUrl}
          alt=""
          className="w-full h-full object-cover grayscale-[0.1] contrast-100 group-hover:scale-[1.02] group-hover:grayscale-0 transition-all duration-300"
          onError={() => {
            if (!imageRef.current) return;
            imageRef.current.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-4xl font-semibold tracking-wide text-white/20">
          {initials || 'AR'}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/70 to-transparent" />
      </div>
      <div className="p-4 md:p-4.5 flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex gap-3 justify-between items-start">
          <div className="min-w-0 flex-1 pr-1">
            <h2 className="font-semibold text-white text-[15px] leading-snug whitespace-normal wrap-break-word">
              {artist.name}
            </h2>
            <p className="text-[13px] text-neutral-400 mt-0.5 line-clamp-2">{artist.genreLine}</p>
          </div>
          {artist.priceFromUsd != null && Number.isFinite(artist.priceFromUsd) ? (
            <div className="text-right shrink-0 rounded-lg border border-white/10 bg-white/3 px-2.5 py-1">
              <p className="text-[9px] uppercase tracking-wide text-neutral-500">Desde</p>
              <p className="text-base font-semibold text-white tabular-nums">${artist.priceFromUsd}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-white/8">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {artist.previewAudioUrl ? (
              <button
                type="button"
                onClick={togglePreview}
                className="shrink-0 flex h-8.5 w-8.5 items-center justify-center rounded-full bg-[#00d4c8] text-[#0a0c10] shadow-[0_0_12px_rgba(0,212,200,0.35)] hover:bg-[#00ece0] transition-colors"
                aria-label={isPlaying ? 'Pausar vista previa' : 'Reproducir vista previa'}
              >
                {isPlaying ? <FiPause size={14} /> : <FiPlay size={14} className="translate-x-px" />}
              </button>
            ) : null}
            <div className="min-w-0 text-[12px] text-neutral-300 flex items-center gap-1.5">
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
              className="shrink-0 inline-flex items-center justify-center rounded-md border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-semibold text-neutral-500 cursor-not-allowed select-none"
              aria-disabled
            >
              Ver Perfil
            </span>
          ) : (
            <Link
              to={href}
              className="shrink-0 inline-flex items-center justify-center rounded-md bg-[#00d4c8] px-3 py-1.5 text-xs font-semibold text-[#0a0c10] shadow-[0_0_10px_rgba(0,212,200,0.2)] hover:bg-[#00ece0] transition-colors"
            >
              Ver Perfil
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
