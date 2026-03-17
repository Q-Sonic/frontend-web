import type {
  ApiResponse,
  ArtistServiceRecord,
  ArtistServiceListResponse,
  CreateArtistServiceBody,
  UpdateArtistServiceBody,
} from '../types';
import { api } from './client';

export async function getMyArtistServices(): Promise<ArtistServiceRecord[]> {
  const res = await api<ArtistServiceListResponse>('artist-services');
  return res.data ?? [];
}

export async function getArtistServicesByArtistId(artistId: string): Promise<ArtistServiceRecord[]> {
  const res = await api<ArtistServiceListResponse>(`artist-services/all/${artistId}`);
  return res.data ?? [];
}

export async function getArtistServiceById(id: string): Promise<ArtistServiceRecord> {
  const res = await api<ApiResponse<ArtistServiceRecord>>(`artist-services/${id}`);
  return res.data;
}

export async function createArtistService(
  body: CreateArtistServiceBody
): Promise<ArtistServiceRecord> {
  const res = await api<ApiResponse<ArtistServiceRecord>>('artist-services', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function updateArtistService(
  id: string,
  body: UpdateArtistServiceBody
): Promise<ArtistServiceRecord> {
  const res = await api<ApiResponse<ArtistServiceRecord>>(`artist-services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function deleteArtistService(id: string): Promise<void> {
  await api(`artist-services/${id}`, { method: 'DELETE' });
}
