import { useMemo, useState } from 'react';
import type { UseArtistProfileByIdOptions } from '../../hooks/useArtistProfileById';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArtistGalleryFilterTabs,
  ArtistGalleryMasonryGrid,
  ArtistProfileEditButton,
  Skeleton,
  type GalleryFilterKey,
} from '../../components';
import { ClientArtistSectionHeader } from '../../components/client/ClientArtistSectionHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';
import { getPrimaryReservationService } from '../../helpers/artistReservation';
import { filterVisualGalleryMedia } from '../../helpers/galleryAudioTracks';
import { isBackendRoleArtista, isBackendRoleCliente } from '../../helpers/role';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import type { ArtistMediaItem } from '../../types';

function filterMedia(items: ArtistMediaItem[], filter: GalleryFilterKey): ArtistMediaItem[] {
  if (filter === 'all') return items;
  if (filter === 'photos') return items.filter((item) => item.type === 'image');
  if (filter === 'videos') return items.filter((item) => item.type === 'video');
  return items;
}

export function ArtistProfileGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exitHomePath, basePath } = useArtistProfileNav();
  const [activeFilter, setActiveFilter] = useState<GalleryFilterKey>('all');

  const isSelfArtist = !!id && !!user?.uid && isBackendRoleArtista(user.role) && user.uid === id;
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
  const { profile, services, artistDisplayName, loading, error } = useArtistProfileById(id, profileLoadOptions);
  const isClientGallery = isBackendRoleCliente(user?.role) && basePath.startsWith('/client/artists');
  const reservationService = getPrimaryReservationService(services);
  const reserveHref = reservationService
    ? `${basePath}/services/${reservationService.id}`
    : `${basePath}#documents`;

  const gallerySource = profile?.media ?? [];
  const sourceForGrid = isClientGallery ? filterVisualGalleryMedia(gallerySource) : gallerySource;
  const filteredItems = useMemo(
    () => filterMedia(sourceForGrid, activeFilter),
    [sourceForGrid, activeFilter],
  );

  if (!id) return <Navigate to={exitHomePath} replace />;

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto space-y-6 px-4 sm:px-8 lg:px-10 pt-8 sm:pt-10 lg:pt-12 pb-12">
        {isClientGallery ? (
          <ClientArtistSectionHeader
            titleLead="Galería de"
            artistDisplayName=""
            profile={null}
            basePath={basePath}
            loading
            showMusicPlayer
          />
        ) : null}
        <div className="grid min-h-[56px] grid-cols-[minmax(2.5rem,1fr)_minmax(0,auto)_minmax(2.5rem,1fr)] items-center gap-2 sm:gap-4">
          <div aria-hidden className="hidden sm:block" />
          <Skeleton className="mx-auto h-14 w-full max-w-[min(100%,760px)] rounded-full" />
          <Skeleton className="ml-auto h-10 w-10 rounded-xl" />
        </div>
        <div className="grid grid-flow-dense grid-cols-2 gap-2 auto-rows-[62px] sm:auto-rows-[66px] md:grid-cols-4 md:gap-2.5 md:auto-rows-[70px]">
          <Skeleton className="col-span-2 row-span-2 rounded-[1.25rem]" />
          <Skeleton className="col-span-1 row-span-2 rounded-[1.25rem]" />
          <Skeleton className="col-span-1 row-span-1 rounded-[1.25rem]" />
          <Skeleton className="col-span-1 row-span-1 rounded-[1.25rem]" />
          <Skeleton className="col-span-2 row-span-1 rounded-[1.25rem] md:col-span-2 md:row-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 lg:pt-12 pb-12">
        <p className="text-red-400 text-sm leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-7 px-4 sm:px-8 lg:px-10 pt-8 sm:pt-10 lg:pt-12 pb-12">
      {isClientGallery ? (
        <ClientArtistSectionHeader
          titleLead="Galería de"
          artistDisplayName={artistDisplayName}
          profile={profile}
          basePath={basePath}
          reserveHref={reserveHref}
          showMusicPlayer
        />
      ) : null}

      <div
        className={
          isClientGallery
            ? 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between gap-y-4'
            : 'grid min-h-[56px] grid-cols-[minmax(2.5rem,1fr)_minmax(0,auto)_minmax(2.5rem,1fr)] items-center gap-2 sm:gap-4'
        }
      >
        {!isClientGallery ? <div aria-hidden className="hidden sm:block" /> : null}
        <div className={`flex min-w-0 justify-center ${isClientGallery ? 'w-full sm:flex-1 px-0' : 'px-1 sm:px-4'}`}>
          <ArtistGalleryFilterTabs
            activeFilter={activeFilter}
            onChange={setActiveFilter}
            resultCount={filteredItems.length}
          />
        </div>
        <div className={`flex justify-end self-center ${isClientGallery ? 'sm:shrink-0' : ''}`}>
          <ArtistProfileEditButton
            show={isSelfArtist}
            onClick={() => navigate(`${basePath}/gallery/edit`)}
          />
        </div>
      </div>

      <ArtistGalleryMasonryGrid items={filteredItems} variant={isClientGallery ? 'client' : 'default'} />
    </div>
  );
}
