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

export type AccountChangeStatus = {
  verified: boolean;
  pendingCode: boolean;
  validUntil: string | null;
};

export async function getAccountChangeStatus(): Promise<AccountChangeStatus> {
  const res = await api<ApiResponse<AccountChangeStatus>>('auth/account-change/status');
  return res.data ?? { verified: false, pendingCode: false, validUntil: null };
}

export async function requestAccountChangeCode(): Promise<void> {
  await api<ApiResponse<unknown>>('auth/account-change/request-code', {
    method: 'POST',
  });
}

export async function verifyAccountChangeCode(code: string): Promise<void> {
  await api<ApiResponse<unknown>>('auth/account-change/verify-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function changeAccountEmail(payload: { newEmail: string }): Promise<void> {
  await api<ApiResponse<unknown>>('auth/change-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function changeAccountPassword(payload: { newPassword: string }): Promise<void> {
  await api<ApiResponse<unknown>>('auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginWithGoogleBackend(idToken: string): Promise<ApiResponse<GoogleLoginResponse>> {
  return api<ApiResponse<GoogleLoginResponse>>('auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}
