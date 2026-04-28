export type DashboardStats = {
  totalEvents: number;
  eventsGrowthPercent: number;
  totalBalance: number;
  profileVisitsTotal: number;
  visitsChartData: { day: string; count: number }[];
  nextEvent?: any;
};

export type WithdrawalRequest = {
  id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  createdAt: unknown;
  reason?: string;
};
