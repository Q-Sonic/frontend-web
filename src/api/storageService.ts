import { config } from '../config';
import { getIdToken } from './client';

export interface UploadOptions {
  /** Optional folder path in Firebase Storage (e.g. 'artist_media/{uid}'). */
  folder?: string;
}

export async function uploadFile(file: File, options?: UploadOptions): Promise<{ url: string }> {
  const baseUrl = config.apiBaseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/storage/upload`;
  const formData = new FormData();
  formData.append('file', file);
  if (options?.folder) {
    formData.append('folder', options.folder);
  }
  const idToken = getIdToken();
  const headers: HeadersInit = {};
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  const body = (await res.json()) as { data?: { url: string }; url?: string };
  const fileUrl = body.data?.url ?? body.url;
  if (!fileUrl) throw new Error('No URL returned from upload');
  return { url: fileUrl };
}
