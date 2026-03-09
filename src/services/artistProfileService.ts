import type { ArtistProfile, ArtistProfileUpdate, ApiResponse } from '../types';
import { api } from '../utils/api';

export async function getArtistProfile(): Promise<ArtistProfile> {
  const res = await api<ApiResponse<ArtistProfile>>('artist-profiles/me');
  return res.data;
}

export async function updateArtistProfile(payload: ArtistProfileUpdate): Promise<ArtistProfile> {
  const res = await api<ApiResponse<ArtistProfile>>('artist-profiles', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
}
