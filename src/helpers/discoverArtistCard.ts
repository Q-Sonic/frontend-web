import type { ArtistProfileListItem } from '../types';
import { resolveArtistProfileMediaUrl } from './artistDocumentUrls';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&h=400&fit=crop&q=80';

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export type DiscoverArtistCardDisplay = {
  id: string;
  name: string;
  genreLine: string;
  imageUrl: string;
  previewAudioUrl?: string;
  priceFromUsd?: number;
  availableToday?: boolean;
  availableDateLabel?: string;
  /** Demo / fictitious row: profile CTA is non-navigating. */
  profileDisabled?: boolean;
};

export function artistListItemToDiscoverCard(item: ArtistProfileListItem): DiscoverArtistCardDisplay {
  const name = item.displayName?.trim() || 'Artista';
  const city = item.city?.trim();
  const genre = item.genre?.trim();
  const bio = item.biography?.trim();

  const genreLine =
    [genre, city].filter(Boolean).join(' · ') ||
    (bio ? truncate(bio, 72) : '') ||
    'Música en vivo';

  const photo = item.photo?.trim();
  const firstImage = item.media?.find((m) => m.type === 'image');
  const rawImg = photo || firstImage?.url;
  const imageUrl = rawImg
    ? resolveArtistProfileMediaUrl(rawImg) || PLACEHOLDER_IMAGE
    : PLACEHOLDER_IMAGE;

  const rawAudio =
    item.featuredSong?.streamUrl?.trim() || item.media?.find((m) => m.type === 'audio')?.url?.trim();
  const previewAudioUrl = rawAudio
    ? resolveArtistProfileMediaUrl(rawAudio) || undefined
    : undefined;

  return {
    id: item.uid,
    name,
    genreLine,
    imageUrl,
    previewAudioUrl: previewAudioUrl || undefined,
    priceFromUsd: Number.isFinite(Number(item.minPrice ?? item.price))
      ? Number(item.minPrice ?? item.price)
      : undefined,
  };
}
