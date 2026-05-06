import type { ArtistSongListResponse, ArtistSongRecord, ArtistSongResponse } from '../types';
import { api, apiPostFormData, apiPutFormData } from './client';

/** Backend list payloads may wrap rows in `data`, `songs`, `items`, etc. */
function normalizeArtistSongList(raw: unknown): ArtistSongRecord[] {
  if (Array.isArray(raw)) return raw;
  if (raw == null || typeof raw !== 'object') return [];

  const unwrapArrays = (value: unknown): ArtistSongRecord[] | null => {
    if (Array.isArray(value)) return value as ArtistSongRecord[];
    if (value && typeof value === 'object') {
      const o = value as Record<string, unknown>;
      for (const key of ['songs', 'items', 'results', 'records', 'data']) {
        const inner = o[key];
        if (Array.isArray(inner)) return inner as ArtistSongRecord[];
      }
    }
    return null;
  };

  const top = unwrapArrays(raw);
  if (top) return top;

  const dataField = (raw as Record<string, unknown>).data;
  const nested = unwrapArrays(dataField);
  return nested ?? [];
}

export async function getMyArtistSongs(): Promise<ArtistSongRecord[]> {
  const res = await api<ArtistSongListResponse>('artist-songs/me');
  return normalizeArtistSongList(res.data);
}

export async function getArtistSongsByArtistId(artistId: string): Promise<ArtistSongRecord[]> {
  const res = await api<ArtistSongListResponse>(`artist-songs/all/${artistId}`);
  return normalizeArtistSongList(res.data);
}

export async function createArtistSongWithFormData(payload: {
  title?: string;
  audio: File;
  cover?: File | null;
  isFeatured?: boolean;
}): Promise<ArtistSongRecord> {
  const formData = new FormData();
  if (payload.title?.trim()) formData.append('title', payload.title.trim());
  if (payload.isFeatured !== undefined) formData.append('isFeatured', String(payload.isFeatured));
  formData.append('audio', payload.audio);
  if (payload.cover) formData.append('cover', payload.cover);
  const res = await apiPostFormData<ArtistSongResponse>('artist-songs', formData);
  return res.data;
}

export async function updateArtistSongWithFormData(
  id: string,
  payload: { title?: string; cover?: File | null; isFeatured?: boolean }
): Promise<ArtistSongRecord> {
  const formData = new FormData();
  if (payload.title !== undefined) formData.append('title', payload.title);
  if (payload.isFeatured !== undefined) formData.append('isFeatured', String(payload.isFeatured));
  if (payload.cover) formData.append('cover', payload.cover);
  const res = await apiPutFormData<ArtistSongResponse>(`artist-songs/${id}`, formData);
  return res.data;
}

export async function deleteArtistSong(id: string): Promise<void> {
  await api(`artist-songs/${id}`, { method: 'DELETE' });
}
