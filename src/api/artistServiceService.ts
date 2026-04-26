import type {
  ApiResponse,
  ArtistServiceRecord,
  ArtistServiceListResponse,
  CreateArtistServiceBody,
  UpdateArtistServiceBody,
} from '../types';
import { api, apiPostFormData, apiPutFormData } from './client';

function unwrapArtistServiceBody(body: unknown): ArtistServiceRecord | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const data = o.data;
  if (data && typeof data === 'object' && typeof (data as ArtistServiceRecord).id === 'string') {
    return data as ArtistServiceRecord;
  }
  if (typeof o.id === 'string' && typeof o.name === 'string') {
    return body as ArtistServiceRecord;
  }
  return null;
}

export async function getMyArtistServices(): Promise<ArtistServiceRecord[]> {
  const res = await api<ArtistServiceListResponse>('artist-services');
  return res.data ?? [];
}

export async function getArtistServicesByArtistId(artistId: string): Promise<ArtistServiceRecord[]> {
  const res = await api<ArtistServiceListResponse>(`artist-services/all/${artistId}`);
  return res.data ?? [];
}

/** Returns null if the request fails or the payload is not a service (e.g. public GET unsupported). */
export async function getArtistServiceById(id: string): Promise<ArtistServiceRecord | null> {
  try {
    const res = await api<unknown>(`artist-services/${id}`);
    return unwrapArtistServiceBody(res);
  } catch {
    return null;
  }
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

export async function createArtistServiceWithFormData(
  body: CreateArtistServiceBody,
  imageFile?: File | null
): Promise<ArtistServiceRecord> {
  const formData = new FormData();
  formData.append('name', body.name);
  formData.append('price', String(body.price));
  if (body.description != null) formData.append('description', body.description);
  if (body.duration != null) formData.append('duration', body.duration);
  if (body.features != null) formData.append('features', JSON.stringify(body.features));
  if (body.contractTemplateId) formData.append('contractTemplateId', body.contractTemplateId);
  if (body.technicalRiderTemplateId) formData.append('technicalRiderTemplateId', body.technicalRiderTemplateId);
  if (imageFile) formData.append('image', imageFile);
  const res = await apiPostFormData<ApiResponse<ArtistServiceRecord>>('artist-services', formData);
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

export async function updateArtistServiceWithFormData(
  id: string,
  body: UpdateArtistServiceBody,
  imageFile?: File | null
): Promise<ArtistServiceRecord> {
  const formData = new FormData();
  if (body.name != null) formData.append('name', body.name);
  if (body.price != null) formData.append('price', String(body.price));
  if (body.description != null) formData.append('description', body.description);
  if (body.duration != null) formData.append('duration', body.duration);
  if (body.features != null) formData.append('features', JSON.stringify(body.features));
  if (body.contractTemplateId) formData.append('contractTemplateId', body.contractTemplateId);
  if (body.technicalRiderTemplateId) formData.append('technicalRiderTemplateId', body.technicalRiderTemplateId);
  if (imageFile) formData.append('image', imageFile);
  const res = await apiPutFormData<ApiResponse<ArtistServiceRecord>>(`artist-services/${id}`, formData);
  return res.data;
}

export async function deleteArtistService(id: string): Promise<void> {
  await api(`artist-services/${id}`, { method: 'DELETE' });
}
