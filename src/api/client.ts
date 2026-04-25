import { config } from '../config';
import { readAuthStorage } from '../helpers/authStorage';

export const getIdToken = (): string | null => readAuthStorage('idToken');

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Backend sends `{ success: false, error: string }`; some routes use `message` instead. */
function messageFromErrorBody(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    if (o.error) {
      if (typeof o.error === 'string' && o.error.trim()) return o.error.trim();
      if (typeof o.error === 'object') return JSON.stringify(o.error);
    }
    if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();
  }
  return fallback;
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
    const message = messageFromErrorBody(err, res.statusText);
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
    const message = messageFromErrorBody(err, res.statusText);
    throw new ApiError(message, res.status);
  }
  const data = (await res.json()) as T;
  return data;
}

/** POST with FormData (e.g. multipart gallery upload). Do not set Content-Type. */
export async function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
  const base = config.apiBaseUrl.replace(/\/$/, '');
  const pathNorm = path.replace(/^\//, '');
  const url = `${base}/${pathNorm}`;
  const idToken = getIdToken();
  const headers: HeadersInit = {};
  if (idToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${idToken}`;
  }
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = messageFromErrorBody(err, res.statusText);
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json()) as T;
  return data;
}
