import type { ArtistProfile, ArtistProfileUpdate, ArtistProfileListItem, ApiResponse } from '../types';
import { api, apiPutFormData } from './client';

/** List all artist profiles (for client browse). Requires cliente/admin/organizacion/soporte. */
export async function listArtistProfiles(): Promise<ArtistProfileListItem[]> {
  const res = await api<ApiResponse<ArtistProfileListItem[]>>('artist-profiles');
  return res.data ?? [];
}

export async function getArtistProfile(): Promise<ArtistProfile> {
  const res = await api<ApiResponse<ArtistProfile>>('artist-profiles/me');
  return res.data;
}

/** Get artist profile by id (for clients viewing an artist). */
export async function getArtistProfileById(id: string): Promise<ArtistProfile & { uid: string }> {
  const res = await api<ApiResponse<ArtistProfile & { uid: string }>>(`artist-profiles/${id}`);
  return res.data;
}

export async function updateArtistProfile(payload: ArtistProfileUpdate): Promise<ArtistProfile> {
  const res = await api<ApiResponse<ArtistProfile>>('artist-profiles', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/** Update artist profile with photo as file (multipart). Use this instead of upload + update when changing photo. */
export async function updateArtistProfileWithFormData(formData: FormData): Promise<ArtistProfile> {
  const res = await apiPutFormData<ApiResponse<ArtistProfile>>('artist-profiles', formData);
  return res.data;
}
