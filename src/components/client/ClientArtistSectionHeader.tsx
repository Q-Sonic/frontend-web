import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArtistGalleryWavePlayer } from '../artist-profile/ArtistGalleryWavePlayer';
import { ArtistProfileSocialNetworkLink } from '../artist-profile/ArtistProfileSocialNetworkLink';
import { Skeleton } from '../Skeleton';
import { ARTIST_PROFILE_ACCENT } from '../../helpers/artistProfile';
import { buildGalleryAudioTracks } from '../../helpers/galleryAudioTracks';
import { resolveArtistProfileMediaUrl } from '../../helpers/artistDocumentUrls';
import type { ArtistProfile } from '../../types';

export type ClientArtistSectionHeaderProps = {
  /** Text before the artist name in white, e.g. "Galería de", "Contratos de". */
  titleLead: string;
  artistDisplayName: string;
  profile: (ArtistProfile & { uid?: string }) | null;
  basePath: string;
  loading?: boolean;
  /** Line under the title (defaults to city · música en vivo). */
  subtitleLine1?: string;
  /** Gray supporting line under subtitle. */
  description?: string;
  /** Waveform player on the right — only used on the Gallery section. Default false. */
  showMusicPlayer?: boolean;
  /** Optional content below the CTA row (e.g. extra toolbar). */
  children?: ReactNode;
};

export function ClientArtistSectionHeader({
  titleLead,
  artistDisplayName,
  profile,
  basePath,
  loading,
  subtitleLine1: subtitleLine1Prop,
  description: descriptionProp,
  showMusicPlayer = false,
  children,
}: ClientArtistSectionHeaderProps) {
  const subtitleLine1 =
    subtitleLine1Prop ??
    (profile?.city?.trim() ? `${profile.city.trim()} · música en vivo` : 'Música en vivo');

  const description =
    descriptionProp ?? 'Momentos en vivo, fans y presentaciones del artista.';

  const social = profile?.socialNetworks ?? {};

  const audioTracks = useMemo(
    () => (showMusicPlayer ? buildGalleryAudioTracks(profile, artistDisplayName) : []),
    [profile, artistDisplayName, showMusicPlayer],
  );

  const coverFallback =
    showMusicPlayer && profile?.photo ? resolveArtistProfileMediaUrl(profile.photo) : undefined;

  const headerGridClass = showMusicPlayer
    ? 'grid gap-8 lg:grid-cols-[1fr_minmax(260px,380px)] lg:items-start lg:gap-10'
    : 'grid gap-8';

  if (loading) {
    return (
      <>
        <header className={headerGridClass}>
          <div className="space-y-4 min-w-0">
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
            <Skeleton className="h-4 w-full max-w-md rounded" />
            <Skeleton className="h-4 w-3/4 max-w-lg rounded" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="h-11 w-44 rounded-xl" />
          </div>
          {showMusicPlayer ? (
            <Skeleton className="h-64 w-full max-w-[380px] rounded-2xl justify-self-end" />
          ) : null}
        </header>
        {children}
      </>
    );
  }

  return (
    <header className="space-y-0">
      <div className={headerGridClass}>
        <div className="min-w-0 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            {titleLead}{' '}
            <span style={{ color: ARTIST_PROFILE_ACCENT }}>{artistDisplayName}</span>
          </h1>
          <p className="text-sm sm:text-base text-white/85 font-medium">{subtitleLine1}</p>
          <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">{description}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ArtistProfileSocialNetworkLink network="tiktok" href={social.tiktok} />
            <ArtistProfileSocialNetworkLink network="youtube" href={social.youtube} />
            <ArtistProfileSocialNetworkLink network="instagram" href={social.instagram} />
            <ArtistProfileSocialNetworkLink network="facebook" href={social.facebook} />
          </div>
          <div className="pt-2">
            <Link
              to={`${basePath}/calendar`}
              className="inline-flex items-center justify-center rounded-xl bg-[#00d4c8] px-6 py-2.5 text-sm font-semibold text-[#0a0c10] shadow-[0_0_24px_rgba(0,212,200,0.35)] hover:bg-[#00ece0] transition-colors"
            >
              Reservar Fecha
            </Link>
          </div>
        </div>
        {showMusicPlayer ? (
          <div className="flex justify-end lg:justify-end w-full">
            <ArtistGalleryWavePlayer tracks={audioTracks} fallbackCoverUrl={coverFallback} />
          </div>
        ) : null}
      </div>
      {children ? <div className="mt-8">{children}</div> : null}
    </header>
  );
}
