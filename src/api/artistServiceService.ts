import type {

  ApiResponse,

  ArtistServiceRecord,

  ArtistServiceListResponse,

  CreateArtistServiceBody,

  UpdateArtistServiceBody,

} from '../types';

import { api, apiPostFormData, apiPutFormData } from './client';



/**

 * Aligns list/detail payloads with UI fields: OpenAPI uses `contractId` / `technicalRiderId`

 * and may nest `contract` / `technicalRider` objects.

 */

export function normalizeArtistServiceRecord(service: ArtistServiceRecord): ArtistServiceRecord {

  const s = service as ArtistServiceRecord & {

    contract?: { id?: string } | null;

    technicalRider?: { id?: string } | null;

  };

  const contractLink =

    s.contractTemplateId ??

    s.contractId ??

    (s.contract && typeof s.contract === 'object' ? s.contract.id : undefined);

  const riderLink =

    s.technicalRiderTemplateId ??

    s.technicalRiderId ??

    (s.technicalRider && typeof s.technicalRider === 'object' ? s.technicalRider.id : undefined);

  return {

    ...s,

    contractId: contractLink,

    contractTemplateId: contractLink,

    technicalRiderId: riderLink,

    technicalRiderTemplateId: riderLink,

  };

}



/** PUT /artist-services/:id — same field names as OpenAPI. */

function buildArtistServiceUpdateJson(body: UpdateArtistServiceBody): Record<string, unknown> {

  const o: Record<string, unknown> = {};

  if (body.name !== undefined) o.name = body.name;

  if (body.price !== undefined) o.price = body.price;

  if (body.description !== undefined) o.description = body.description;

  if (body.duration !== undefined) o.duration = body.duration;

  if (body.features !== undefined) o.features = body.features;

  if (body.contractTemplateId !== undefined) {

    o.contractId = body.contractTemplateId || null;

  }

  if (body.technicalRiderTemplateId !== undefined) {

    o.technicalRiderId = body.technicalRiderTemplateId || null;

  }

  return o;

}



function appendContractRiderFormFields(formData: FormData, body: CreateArtistServiceBody | UpdateArtistServiceBody) {

  const contractId =

    'contractTemplateId' in body && body.contractTemplateId

      ? body.contractTemplateId

      : undefined;

  const riderId =

    'technicalRiderTemplateId' in body && body.technicalRiderTemplateId

      ? body.technicalRiderTemplateId

      : undefined;

  if (contractId) formData.append('contractId', contractId);

  if (riderId) formData.append('technicalRiderId', riderId);

}



function unwrapArtistServiceBody(body: unknown): ArtistServiceRecord | null {

  if (!body || typeof body !== 'object') return null;

  const o = body as Record<string, unknown>;

  const data = o.data;

  let raw: unknown = null;

  if (data && typeof data === 'object' && typeof (data as ArtistServiceRecord).id === 'string') {

    raw = data;

  } else if (typeof o.id === 'string' && typeof o.name === 'string') {

    raw = body;

  }

  if (!raw || typeof raw !== 'object') return null;

  return normalizeArtistServiceRecord(raw as ArtistServiceRecord);

}



export async function getMyArtistServices(): Promise<ArtistServiceRecord[]> {

  const res = await api<ArtistServiceListResponse>('artist-services');

  return (res.data ?? []).map(normalizeArtistServiceRecord);

}



export async function getArtistServicesByArtistId(artistId: string): Promise<ArtistServiceRecord[]> {

  const res = await api<ArtistServiceListResponse>(`artist-services/all/${artistId}`);

  return (res.data ?? []).map(normalizeArtistServiceRecord);

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

  body: CreateArtistServiceBody,

  imageFile?: File | null,

): Promise<ArtistServiceRecord> {

  return createArtistServiceWithFormData(body, imageFile ?? null, null, null);

}



export async function createArtistServiceWithFormData(

  body: CreateArtistServiceBody,

  imageFile?: File | null,

  contractPdf?: File | null,

  riderPdf?: File | null,

): Promise<ArtistServiceRecord> {

  const formData = new FormData();

  formData.append('name', body.name);

  formData.append('price', String(body.price));

  if (body.description != null && body.description !== '') formData.append('description', body.description);

  if (body.duration != null && body.duration !== '') formData.append('duration', body.duration);

  if (body.features != null && body.features.length > 0) {

    formData.append('features', JSON.stringify(body.features));

  }

  appendContractRiderFormFields(formData, body);

  if (imageFile) formData.append('image', imageFile);

  if (contractPdf) formData.append('contractPdf', contractPdf);

  if (riderPdf) formData.append('riderPdf', riderPdf);

  const res = await apiPostFormData<ApiResponse<ArtistServiceRecord>>('artist-services', formData);

  return normalizeArtistServiceRecord(res.data);

}



export async function updateArtistService(

  id: string,

  body: UpdateArtistServiceBody,

): Promise<ArtistServiceRecord> {

  const res = await api<ApiResponse<ArtistServiceRecord>>(`artist-services/${id}`, {

    method: 'PUT',

    body: JSON.stringify(buildArtistServiceUpdateJson(body)),

  });

  return normalizeArtistServiceRecord(res.data);

}



export async function updateArtistServiceWithFormData(

  id: string,

  body: UpdateArtistServiceBody,

  imageFile?: File | null,

  contractPdf?: File | null,

  riderPdf?: File | null,

): Promise<ArtistServiceRecord> {

  const formData = new FormData();

  if (body.name != null) formData.append('name', body.name);

  if (body.price != null) formData.append('price', String(body.price));

  if (body.description != null) formData.append('description', body.description);

  if (body.duration != null) formData.append('duration', body.duration);

  if (body.features != null) formData.append('features', JSON.stringify(body.features));

  appendContractRiderFormFields(formData, body);

  if (imageFile) formData.append('image', imageFile);

  if (contractPdf) formData.append('contractPdf', contractPdf);

  if (riderPdf) formData.append('riderPdf', riderPdf);

  const res = await apiPutFormData<ApiResponse<ArtistServiceRecord>>(`artist-services/${id}`, formData);

  return normalizeArtistServiceRecord(res.data);

}



export async function deleteArtistService(id: string): Promise<void> {

  await api(`artist-services/${id}`, { method: 'DELETE' });

}


