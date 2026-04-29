import type {
  ArtistFileListResponse,
  ArtistFileRecord,
  ArtistFileSingleResponse,
  ArtistFileType,
} from '../types/artistFile';
import { api, apiPostFormData, apiPutFormData } from './client';

export type UploadArtistFileOptions = {
  /** Optional display `name` (multipart field); PDF may still carry its own filename. */
  displayName?: string;
  /** Optional notes; omit or leave empty to skip the field. */
  description?: string;
};

export type UpdateArtistFileOptions = {
  /** New PDF; omit to change only metadata. */
  file?: File;
  /** Display name (multipart `name`); omit if unchanged. */
  name?: string;
  /** Omit to leave stored value; send string (including empty) only when updating this field. */
  description?: string;
};

export async function listMyArtistFiles(type?: ArtistFileType): Promise<ArtistFileRecord[]> {
  const q = type ? `?type=${encodeURIComponent(type)}` : '';
  const res = await api<ArtistFileListResponse>(`artist-files${q}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function uploadArtistFile(
  file: File,
  fileType: ArtistFileType,
  options?: UploadArtistFileOptions,
): Promise<ArtistFileRecord> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', fileType);
  const display = options?.displayName?.trim();
  if (display) formData.append('name', display);
  const desc = options?.description?.trim();
  if (desc) formData.append('description', desc);
  const res = await apiPostFormData<ArtistFileSingleResponse>('artist-files', formData);
  if (!res.data || typeof res.data !== 'object' || typeof res.data.id !== 'string') {
    throw new Error('Respuesta inválida al subir el archivo.');
  }
  return res.data;
}

/**
 * Partial update per OpenAPI `PUT /artist-files/{id}`: append only fields you send.
 * Omit `file` to change name/description only; omit `description` to leave notes unchanged.
 */
export async function updateArtistFile(id: string, options: UpdateArtistFileOptions): Promise<ArtistFileRecord> {
  const formData = new FormData();
  if (options.file) formData.append('file', options.file);
  if (options.name !== undefined) {
    const n = options.name.trim();
    if (n.length > 0) formData.append('name', n);
  }
  if (options.description !== undefined) {
    formData.append('description', options.description);
  }
  if ([...formData.keys()].length === 0) {
    throw new Error('No hay cambios para guardar.');
  }
  const res = await apiPutFormData<ArtistFileSingleResponse>(`artist-files/${id}`, formData);
  if (!res.data || typeof res.data !== 'object' || typeof res.data.id !== 'string') {
    throw new Error('Respuesta inválida al actualizar el archivo.');
  }
  return res.data;
}

/** Replace PDF only (same as `updateArtistFile(id, { file })`). */
export async function replaceArtistFile(id: string, file: File): Promise<ArtistFileRecord> {
  return updateArtistFile(id, { file });
}

export async function deleteArtistFile(id: string): Promise<void> {
  await api(`artist-files/${id}`, { method: 'DELETE' });
}
