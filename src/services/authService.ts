import type {
  ApiResponse,
  LoginPayload,
  RegisterPayload,
  LoginResponseData,
  UserRecord,
} from '../types';
import { api } from '../utils/api';

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
