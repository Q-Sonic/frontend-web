import type { ApiResponse } from './api';

export interface UserRecord {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
  photoURL?: string;
  identificationType?: 'cedula' | 'ruc' | 'pasaporte';
  identificationNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserPayload {
  displayName?: string;
  photoURL?: string;
}

export type UserRecordResponse = ApiResponse<UserRecord>;
