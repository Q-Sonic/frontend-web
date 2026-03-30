import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArtistGalleryFilterTabs,
  ArtistGalleryMasonryGrid,
  ArtistProfileEditButton,
  Skeleton,
  type GalleryFilterKey,
} from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { isBackendRoleArtista } from '../../helpers/role';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import type { ArtistMediaItem } from '../../types';

function filterMedia(items: ArtistMediaItem[], filter: GalleryFilterKey): ArtistMediaItem[] {
  const normalized = (value: string | undefined) => (value ?? '').toLowerCase();
  if (filter === 'all') return items;
  if (filter === 'photos') return items.filter((item) => item.type === 'image');
  if (filter === 'videos') return items.filter((item) => item.type === 'video');
  if (filter === 'concerts') return items.filter((item) => /show|concert|live|stage/.test(normalized(item.name)));
  if (filter === 'backstage') return items.filter((item) => /backstage|setup|ensayo|rehearsal/.test(normalized(item.name)));
  return items.filter((item) => /fan|audience|crowd|publico/.test(normalized(item.name)));
}

export function ArtistProfileGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<GalleryFilterKey>('all');

  const { profile, loading, error } = useArtistProfileById(id);
  const isSelfArtist = !!id && !!user?.uid && isBackendRoleArtista(user.role) && user.uid === id;

  const gallerySource = profile?.media ?? [];
  const filteredItems = useMemo(
    () => filterMedia(gallerySource, activeFilter),
    [gallerySource, activeFilter],
  );

  if (!id) return <Navigate to="/artist" replace />;

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto space-y-6 px-4 sm:px-8 lg:px-10 pt-8 sm:pt-10 lg:pt-12 pb-12">
        <div className="grid min-h-[56px] grid-cols-[minmax(2.5rem,1fr)_minmax(0,auto)_minmax(2.5rem,1fr)] items-center gap-2 sm:gap-4">
          <div />
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
      <div className="grid min-h-[56px] grid-cols-[minmax(2.5rem,1fr)_minmax(0,auto)_minmax(2.5rem,1fr)] items-center gap-2 sm:gap-4">
        <div aria-hidden className="hidden sm:block" />
        <div className="flex min-w-0 justify-center px-1 sm:px-4">
          <ArtistGalleryFilterTabs activeFilter={activeFilter} onChange={setActiveFilter} />
        </div>
        <div className="flex justify-end self-center">
          <ArtistProfileEditButton
            show={isSelfArtist}
            onClick={() => navigate('/artist/media')}
          />
        </div>
      </div>
      <ArtistGalleryMasonryGrid items={filteredItems} />
    </div>
  );
}
