import type { ApiResponse } from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  role: string;
}

export interface LoginResponseData {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  uid: string;
  role: string;
}

export type LoginResponse = ApiResponse<LoginResponseData>;
