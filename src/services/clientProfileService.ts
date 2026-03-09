import type { ClientProfile, ClientProfileUpdate, ApiResponse } from '../types';
import { api } from '../utils/api';

export async function getClientProfile(): Promise<ClientProfile> {
  const res = await api<ApiResponse<ClientProfile>>('client-profiles/me');
  return res.data;
}

export async function updateClientProfile(payload: ClientProfileUpdate): Promise<ClientProfile> {
  console.log('[ClientProfile Update] updateClientProfile called', { payload });
  const res = await api<ApiResponse<ClientProfile>>('client-profiles', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  console.log('[ClientProfile Update] api() returned', res);
  return res.data;
}
