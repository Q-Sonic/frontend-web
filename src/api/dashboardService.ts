import { api } from './index';
import type { DashboardStats, ApiResponse } from '../types';
import type { ContractRecord } from '../types/contract';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await api<ApiResponse<DashboardStats>>('/dashboard/stats');
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Error al obtener estadísticas del dashboard');
  }
  return response.data;
}

export async function fetchArtistContracts(): Promise<ContractRecord[]> {
  const response = await api<ApiResponse<ContractRecord[]>>('/contracts/artist-history');
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Error al obtener historial de contratos');
  }
  return response.data;
}

export async function fetchArtistWithdrawals(): Promise<any[]> {
  const response = await api<ApiResponse<any[]>>('/payments/withdrawals');
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Error al obtener historial de retiros');
  }
  return response.data;
}
