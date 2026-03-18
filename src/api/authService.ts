import type {
  ApiResponse,
  LoginPayload,
  RegisterPayload,
  LoginResponseData,
  UserRecord,
} from '../types';
import { api } from './client';

export interface GoogleLoginResponse {
  customToken: string;
  uid: string;
  role: string;
  isNewUser: boolean;
  user: UserRecord;
}

export async function login(payload: LoginPayload): Promise<ApiResponse<LoginResponseData>> {
  return api<ApiResponse<LoginResponseData>>('auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function register(payload: RegisterPayload): Promise<ApiResponse<UserRecord>> {
  return api<ApiResponse<UserRecord>>('auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe(): Promise<ApiResponse<UserRecord>> {
  return api<ApiResponse<UserRecord>>('auth/me');
}

export async function loginWithGoogleBackend(idToken: string): Promise<ApiResponse<GoogleLoginResponse>> {
  return api<ApiResponse<GoogleLoginResponse>>('auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}
