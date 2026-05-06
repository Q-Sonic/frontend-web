import type { ApiResponse } from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

/** Values accepted by `auth/register` for end-user signup (Spanish / backend). */
export type RegistrationRole = 'cliente' | 'artista';

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  role: RegistrationRole | string;
}

export interface LoginResponseData {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  uid: string;
  role: string;
}

export type LoginResponse = ApiResponse<LoginResponseData>;
