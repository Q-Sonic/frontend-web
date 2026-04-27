import { api } from './client';
import type { ApiResponse } from '../types';

export type DashboardStats = {
  totalEvents: number;
  eventsGrowthPercent: number;
  totalBalance: number;
  profileVisitsTotal: number;
  visitsChartData: { day: string; count: number }[];
  nextEvent?: {
    id?: string;
    clientName?: string;
    eventDetails?: {
      name?: string;
      date?: unknown;
      location?: string;
    };
    status?: string;
  };
};

export async function fetchArtistDashboardStats(): Promise<DashboardStats> {
  const res = await api<ApiResponse<DashboardStats>>('dashboard/stats');
  return res.data;
}

export type WithdrawalRequest = {
  id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  createdAt: unknown;
  reason?: string;
};

export async function fetchArtistWithdrawals(): Promise<WithdrawalRequest[]> {
  const res = await api<ApiResponse<WithdrawalRequest[]>>('payments/withdrawals');
  return res.data ?? [];
}
