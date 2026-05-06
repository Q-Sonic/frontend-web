import type { UserRecord, UpdateUserPayload, ApiResponse } from '../types';
import { api } from './client';

export async function getAllUsers(): Promise<UserRecord[]> {
  const res = await api<ApiResponse<UserRecord[]>>('users');
  return res.data ?? [];
}

export async function getUser(id: string): Promise<UserRecord> {
  const res = await api<ApiResponse<UserRecord>>(`users/${id}`);
  return res.data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<UserRecord> {
  const res = await api<ApiResponse<UserRecord>>(`users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
}
