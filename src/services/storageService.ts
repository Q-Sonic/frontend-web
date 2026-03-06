import { config, getIdToken } from '../utils';

export async function uploadFile(file: File): Promise<{ url: string }> {
  const url = `${config.apiBaseUrl.replace(/\/$/, '')}/storage/upload`;
  const formData = new FormData();
  formData.append('file', file);
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
  return res.json() as Promise<{ url: string }>;
}
