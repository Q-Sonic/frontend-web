import { config } from './config';

export const getIdToken = (): string | null => localStorage.getItem('idToken');

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${config.apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const idToken = getIdToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (idToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${idToken}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
