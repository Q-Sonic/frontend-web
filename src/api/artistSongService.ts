import type { ArtistSongListResponse, ArtistSongRecord, ArtistSongResponse } from '../types';
import { api, apiPostFormData, apiPutFormData } from './client';

export async function getMyArtistSongs(): Promise<ArtistSongRecord[]> {
  const res = await api<ArtistSongListResponse>('artist-songs/me');
  return res.data ?? [];
}

export async function getArtistSongsByArtistId(artistId: string): Promise<ArtistSongRecord[]> {
  const res = await api<ArtistSongListResponse>(`artist-songs/all/${artistId}`);
  return res.data ?? [];
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
