import type { ArtistProfile } from '../types/profile';
import type { ArtistMediaItem } from '../types';
import { resolveArtistProfileMediaUrl } from './artistDocumentUrls';

export type GalleryAudioTrack = {
  id: string;
  title: string;
  artistLabel: string;
  streamUrl: string;
  coverUrl?: string;
};

/**
 * Featured song + audio media items (deduped by resolved stream URL).
 */
export function buildGalleryAudioTracks(
  profile: ArtistProfile | null | undefined,
  artistDisplayName: string,
): GalleryAudioTrack[] {
  if (!profile) return [];

  const out: GalleryAudioTrack[] = [];
  const seen = new Set<string>();

  const pushUrl = (rawUrl: string | undefined, track: Omit<GalleryAudioTrack, 'streamUrl'>) => {
    const resolved = resolveArtistProfileMediaUrl(rawUrl);
    if (!resolved.trim()) return;
    if (seen.has(resolved)) return;
    seen.add(resolved);
    out.push({ ...track, streamUrl: resolved });
  };

  const fs = profile.featuredSong;
  if (fs?.streamUrl?.trim()) {
    pushUrl(fs.streamUrl, {
      id: 'featured',
      title: (fs.title || 'Destacada').trim(),
      artistLabel: (fs.artistName || artistDisplayName).trim(),
      coverUrl: fs.coverUrl ? resolveArtistProfileMediaUrl(fs.coverUrl) : undefined,
    });
  }

  const photoCover = profile.photo ? resolveArtistProfileMediaUrl(profile.photo) : undefined;

  for (const m of profile.media ?? []) {
    if (m.type !== 'audio') continue;
    pushUrl(m.url, {
      id: `media-${m.url}`,
      title: (m.name || 'Canción').trim(),
      artistLabel: artistDisplayName,
      coverUrl: photoCover || undefined,
    });
  }

  return out;
}

/** Visual-only items for masonry (audio is handled by the player on client gallery). */
export function filterVisualGalleryMedia(items: ArtistMediaItem[]): ArtistMediaItem[] {
  return items.filter((m) => m.type !== 'audio');
}
