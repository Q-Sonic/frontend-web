import { config } from './config';

export const getIdToken = (): string | null => localStorage.getItem('idToken');

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = config.apiBaseUrl.replace(/\/$/, '');
  const pathNorm = path.replace(/^\//, '');
  const url = `${base}/${pathNorm}`;
  const idToken = getIdToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (idToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${idToken}`;
  }
  const method = (options.method ?? 'GET').toUpperCase();
  if (pathNorm.startsWith('client-profiles') && method === 'PUT') {
    console.log('[ClientProfile Update] api request', {
      url,
      method,
      hasAuth: !!idToken,
      authPrefix: idToken ? `Bearer ${idToken.slice(0, 10)}...` : 'none',
      body: options.body,
    });
  }
  const res = await fetch(url, { ...options, headers });
  if (pathNorm.startsWith('client-profiles') && method === 'PUT') {
    console.log('[ClientProfile Update] api response', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
    });
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = (err as { message?: string }).message ?? res.statusText;
    if (pathNorm.startsWith('client-profiles') && method === 'PUT') {
      console.log('[ClientProfile Update] api error body', err);
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json() as T;
  if (pathNorm.startsWith('client-profiles') && method === 'PUT') {
    console.log('[ClientProfile Update] api success body', data);
  }
  return data;
}

/** PUT with FormData (e.g. multipart for profile photo). Do not set Content-Type. */
export async function apiPutFormData<T>(path: string, formData: FormData): Promise<T> {
  const base = config.apiBaseUrl.replace(/\/$/, '');
  const pathNorm = path.replace(/^\//, '');
  const url = `${base}/${pathNorm}`;
  const idToken = getIdToken();
  const headers: HeadersInit = {};
  if (idToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${idToken}`;
  }
  const res = await fetch(url, {
    method: 'PUT',
    body: formData,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = (err as { message?: string }).message ?? res.statusText;
    throw new ApiError(message, res.status);
  }
  const data = (await res.json()) as T;
  return data;
}
