import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
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
      <div className="w-full max-w-[1600px] mx-auto space-y-6 px-4 sm:px-8 lg:px-10 pt-5 pb-12">
        <div className="grid min-h-[56px] grid-cols-[minmax(2.5rem,1fr)_minmax(0,auto)_minmax(2.5rem,1fr)] items-center gap-2 sm:gap-4">
          <div />
          <Skeleton className="mx-auto h-14 w-full max-w-[min(100%,760px)] rounded-full" />
          <Skeleton className="ml-auto h-10 w-10 rounded-xl" />
        </div>
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-4 [&>*]:mb-4">
          <Skeleton className="h-52 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-60 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-8 pb-12 pt-2">
        <p className="text-red-400 text-sm leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-7 px-4 sm:px-8 lg:px-10 pt-5 pb-12">
      <div className="grid min-h-[56px] grid-cols-[minmax(2.5rem,1fr)_minmax(0,auto)_minmax(2.5rem,1fr)] items-center gap-2 sm:gap-4">
        <div aria-hidden className="hidden sm:block" />
        <div className="flex min-w-0 justify-center px-1 sm:px-4">
          <ArtistGalleryFilterTabs activeFilter={activeFilter} onChange={setActiveFilter} />
        </div>
        <div className="flex justify-end self-center">
          <ArtistProfileEditButton
            show={isSelfArtist}
            onClick={() => {}}
          />
        </div>
      </div>
      <ArtistGalleryMasonryGrid items={filteredItems} />
    </div>
  );
}
