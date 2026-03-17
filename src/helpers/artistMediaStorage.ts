import type { ArtistMediaItem } from '../types';

const STORAGE_KEY_PREFIX = 'qsonic_artist_media_';

export function getArtistMediaKey(uid: string): string {
  return `${STORAGE_KEY_PREFIX}${uid}`;
}

export function getStoredArtistMedia(uid: string): ArtistMediaItem[] {
  try {
    const raw = localStorage.getItem(getArtistMediaKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ArtistMediaItem =>
        x && typeof x === 'object' && typeof (x as ArtistMediaItem).url === 'string' && typeof (x as ArtistMediaItem).type === 'string'
    );
  } catch {
    return [];
  }
}

export function setStoredArtistMedia(uid: string, items: ArtistMediaItem[]): void {
  localStorage.setItem(getArtistMediaKey(uid), JSON.stringify(items));
}

export function appendStoredArtistMedia(uid: string, item: ArtistMediaItem): void {
  const list = getStoredArtistMedia(uid);
  list.push(item);
  setStoredArtistMedia(uid, list);
}

export function removeStoredArtistMediaByUrl(uid: string, url: string): void {
  const list = getStoredArtistMedia(uid).filter((x) => x.url !== url);
  setStoredArtistMedia(uid, list);
}
