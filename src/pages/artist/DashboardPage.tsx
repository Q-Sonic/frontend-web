import { Link } from 'react-router-dom';
import WorldIcon from '../../../public/icons/world';
import { useEffect, useState, useCallback } from 'react';
import { formatMoney } from '../../helpers/money';
import { useAuth } from '../../contexts/AuthContext';
import { isBackendRoleArtista } from '../../helpers/role';
import { withMinimumDelay } from '../../helpers/withMinimumDelay';
import { api, ensureArtistProfileListedForDiscovery } from '../../api';
import type { ApiResponse } from '../../types';
import { Skeleton } from '../../components';
import { WithdrawalModal } from '../../components/payments/WithdrawalModal';

type DashboardStats = {
  totalEvents: number;
  eventsGrowthPercent: number;
  totalBalance: number;
  profileVisitsTotal: number;
  visitsChartData: { day: string; count: number }[];
};

type WithdrawalRequest = {
  id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  createdAt: any;
  reason?: string;
};

type CalendarEvent = {
  id: string;
  eventDetails?: {
    name?: string;
    date?: unknown;
    location?: string;
  };
};

type ExtendedEventDetail = {
  id: string;
  clientContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  eventDetails?: {
    date?: unknown;
    location?: string;
  };
};

type NextShow = {
  clientName: string;
  dateLabel: string;
  location: string;
};

export function HomeArtistaPage() {
  const { user } = useAuth();
  const isArtista = isBackendRoleArtista(user?.role);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [nextShow, setNextShow] = useState<NextShow | null>(null);
  const [nextShowLoading, setNextShowLoading] = useState(true);
  const [nextShowError, setNextShowError] = useState('');

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  const loadWithdrawals = useCallback(async () => {
    if (!user?.uid || !isArtista) return;
    setWithdrawalsLoading(true);
    try {
      const res = await api<ApiResponse<WithdrawalRequest[]>>('payments/withdrawals');
      setWithdrawals(res.data || []);
    } catch (err) {
      console.error('Error loading withdrawals:', err);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [user?.uid, isArtista]);

  const loadStats = useCallback(async (cancelled = { current: false }) => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const statsRes = await withMinimumDelay(1000, async () => {
        return api<ApiResponse<DashboardStats>>('dashboard/stats');
      });
      if (!cancelled.current) setStats(statsRes.data);
    } catch (err) {
      if (!cancelled.current) setStatsError(err instanceof Error ? err.message : 'Error al cargar el resumen.');
    } finally {
      if (!cancelled.current) setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.uid || !isArtista) return;
    void ensureArtistProfileListedForDiscovery(user.uid);
  }, [user?.uid, isArtista]);

  useEffect(() => {
    if (!user?.uid || !isArtista) return;

    const cancelled = { current: false };

    async function load() {
      loadStats(cancelled);
      loadWithdrawals();

      setNextShowLoading(true);
      setNextShowError('');
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 3);

      try {
        const nextShowRes = await withMinimumDelay(1000, async () => {
          const startIso = now.toISOString();
          const endIso = end.toISOString();

          const calendarRes = await api<ApiResponse<CalendarEvent[]>>(
            `events/calendar?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`
          );

          const nextContract = pickNextUpcomingEvent(calendarRes.data ?? [], now);
          if (!nextContract) return null;

          const detailRes = await api<ApiResponse<ExtendedEventDetail>>(`events/${nextContract.id}`);
          return mapEventDetailToNextShow(detailRes.data);
        });

        if (cancelled.current) return;
        setNextShow(nextShowRes);
      } catch (err) {
        if (!cancelled.current) setNextShowError(err instanceof Error ? err.message : 'Error al cargar próximo show.');
      } finally {
        if (!cancelled.current) setNextShowLoading(false);
      }
    }

    load();
    return () => {
      cancelled.current = true;
    };
  }, [user?.uid, isArtista, loadStats, loadWithdrawals]);

  if (!user) {
    return (
      <div className="w-full max-w-[1600px] mx-auto p-6">
        <div className="flex-1 min-w-0 space-y-6 bg-card h-fit rounded-2xl p-6 animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-white/10" />
          <div className="h-40 rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (!isArtista) {
    return (
      <div className="w-full max-w-[1600px] mx-auto flex gap-6">
        <div className="flex-1 min-w-0 space-y-6 bg-card h-fit rounded-2xl p-6">
          <section>
            <h1 className="text-2xl font-semibold text-white mb-2">Dashboard del artista</h1>
            <p className="text-muted">Solo los artistas pueden acceder a esta pantalla.</p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto flex gap-6 p-6">
      <div className="flex-1 min-w-0 space-y-6 bg-card h-fit rounded-2xl p-6">
        {/* Resumen */}
        <SummaryCard stats={stats} loading={statsLoading} error={statsError} />

        {/* Retiros Recientes */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Retiros Recientes</h2>
            <span className="text-muted text-sm">Historial</span>
          </div>
          <div className="bg-surface rounded-2xl overflow-hidden border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-muted text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold text-white/50">Fecha</th>
                  <th className="p-4 font-semibold text-white/50">Monto</th>
                  <th className="p-4 font-semibold text-white/50">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawalsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="p-4"><Skeleton className="h-4 w-24 rounded" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-16 rounded" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    </tr>
                  ))
                ) : withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-muted">Aún no has solicitado retiros.</td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-sm text-white/80">
                        {w.createdAt ? new Date(w.createdAt._seconds ? w.createdAt._seconds * 1000 : w.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4 text-sm font-medium text-white">{formatMoney(w.amount)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          w.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                          w.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {w.status}
                        </span>
                        {w.reason && w.status === 'REJECTED' && (
                          <p className="text-[10px] text-red-300 mt-1 italic">{w.reason}</p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Otros */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Otros</h2>
            <span className="text-muted text-sm">Today</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/artist/services"
              className="rounded-xl p-5 border border-white/10 block hover:border-white/30 transition-colors bg-card"
            >
              <h3 className="text-lg font-bold text-white">Servicios y precios</h3>
              <p className="text-sm mt-1 text-muted">Configura tus precios</p>
            </Link>
            <Link
              to={user.uid ? `/artist/${user.uid}/gallery/edit` : '/artist'}
              className="rounded-xl p-5 border border-white/10 block hover:border-white/30 transition-colors bg-card"
            >
              <h3 className="text-lg font-bold text-white">Multimedia</h3>
              <p className="text-sm mt-1 text-muted">Subir fotos, audio, video</p>
            </Link>

            <PromoCard title="Blindaje Prime" isPopular />
            <PromoCard title="Seguro Prime" />
          </div>
        </section>
      </div>

      {/* Right panel */}
      <aside className="w-72 shrink-0 space-y-4 hidden xl:block">
        <BalanceCard 
          balance={stats?.totalBalance ?? null} 
          loading={statsLoading} 
          onWithdrawClick={() => setIsWithdrawModalOpen(true)}
        />

        {/* Próximo Show */}
        <div className="rounded-xl p-5 border border-white/10 bg-card">
          <h3 className="text-lg font-bold text-white mb-3">Próximo Show</h3>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="w-20 h-20 rounded-md bg-muted/20 flex items-center justify-center text-2xl">🎤</div>
            <div>
              {nextShowLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36 rounded" />
                  <Skeleton className="h-4 w-52 rounded" />
                </div>
              ) : nextShow ? (
                <>
                  <p className="font-semibold text-white">{nextShow.clientName}</p>
                  <p className="text-muted text-sm">
                    {nextShow.dateLabel}
                    {nextShow.location ? ` • ${nextShow.location}` : ''}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-white">{nextShowError ? '—' : 'Sin shows'}</p>
                  <p className="text-muted text-sm">
                    {nextShowError ? 'No se pudo cargar la info.' : 'Sin shows programados'}
                  </p>
                </>
              )}
            </div>
          </div>
          <Link
            to="/artist"
            className="block w-full text-center py-2 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15"
          >
            Ver Detalles
          </Link>
        </div>
      </aside>

      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        availableBalance={stats?.totalBalance ?? 0}
        onSuccess={() => {
          loadWithdrawals();
          loadStats();
        }}
      />
    </div>
  );
}

function SummaryCard({
  stats,
  loading,
  error,
}: {
  stats: DashboardStats | null;
  loading: boolean;
  error: string;
}) {
  const bars = stats ? toVisitsBars(stats.visitsChartData) : null;
  const visitsValue = stats?.profileVisitsTotal ?? 0;
  const eventsValue = stats?.totalEvents ?? 0;
  const growthValue = stats?.eventsGrowthPercent ?? 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-semibold text-white">Resumen</h1>
        <div className="flex items-center gap-2 text-muted text-sm">
          <div className="rounded-full bg-muted-card w-8 h-8 flex items-center justify-center">
            <WorldIcon color="var(--color-muted)" />
          </div>
          <div className="flex flex-col">
            <p className="text-sm">Visitas de tu perfil</p>
            <p className="text-xl font-semibold text-white">
              {loading ? <Skeleton className="h-6 w-16 rounded" /> : visitsValue}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-surface rounded-2xl p-6">
        {/* Eventos card */}
        <div className="rounded-xl p-5 border border-white/10 bg-card">
          <h2 className="text-lg font-bold text-white mb-3">Eventos</h2>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-4">
              <p className="text-2xl font-bold text-white mb-2">
                {loading ? <Skeleton className="h-7 w-44 rounded" /> : `${growthValue >= 0 ? '+' : ''}${growthValue}% vs mes anterior`}
              </p>
              <div>
                <p className="text-green-500 text-sm font-medium">
                  {loading ? <Skeleton className="h-4 w-40 rounded" /> : `${eventsValue} eventos este mes`}
                </p>
                {loading ? <Skeleton className="h-3 w-24 rounded mt-2" /> : !loading && error ? <p className="text-red-400 text-xs mt-1">{error}</p> : <p className="text-muted text-sm"> </p>}
              </div>
            </div>

            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-card)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="3"
                  strokeDasharray="80 100"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-medium text-white">
                {loading ? <Skeleton className="h-8 w-10 rounded" /> : eventsValue}
              </span>
            </div>
          </div>
        </div>

        {/* Visitas card */}
        <div className="rounded-xl p-5 border border-white/10 bg-card">
          <h2 className="text-lg font-bold text-white mb-4">Visitas</h2>
          <div className="flex items-end gap-1 h-24">
            {bars ? (
              bars.map((b) => (
                <div key={b.day} className="flex-1 rounded-t min-w-0 bg-muted/30" style={{ height: `${b.heightPct}%` }} />
              ))
            ) : loading ? (
              Array.from({ length: 7 }).map((_, idx) => (
                <Skeleton key={idx} className="flex-1 rounded-t min-w-0 h-full opacity-40" />
              ))
            ) : (
              <p className="text-muted text-sm">Sin datos</p>
            )}
          </div>
          <div className="flex justify-between mt-2 text-muted text-xs">
            {bars ? (
              bars.map((b) => <span key={b.day}>{b.day}</span>)
            ) : (
              Array.from({ length: 7 }).map((_, idx) => (
                <span key={idx} className="inline-flex items-center">
                  <Skeleton className="h-3 w-10 rounded opacity-50" />
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BalanceCard({ 
  balance, 
  loading, 
  onWithdrawClick 
}: { 
  balance: number | null; 
  loading: boolean;
  onWithdrawClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 items-center justify-center rounded-4xl p-5 text-white bg-linear-to-l from-accent to-[#3A9AF4]">
      <h3 className="font-medium opacity-90">My balance</h3>
      <p className="text-3xl font-bold">
        $ {loading || balance === null ? <Skeleton className="inline-block h-7 w-24 rounded opacity-60 align-middle" /> : formatMoney(balance)}
      </p>
      <button
        type="button"
        onClick={onWithdrawClick}
        className="mt-3 px-4 py-2 rounded-full flex items-center gap-2 font-medium bg-white/20 hover:bg-white/30 cursor-pointer"
      >
        Retirar{' '}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}

function PromoCard({ title, isPopular = false }: { title: string, isPopular?: boolean }) {
  return (
    <div className="rounded-xl p-8 pb-20 border border-white/10 relative overflow-hidden bg-black">
      {isPopular && <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-medium bg-warning/20 text-warning">Popular</span>}
      <h3 className="text-2xl font-bold text-white">{title}</h3>
    </div>
  );
}

function parseFirestoreTimestamp(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const seconds = obj.seconds ?? obj._seconds;
    const nanoseconds = obj.nanoseconds ?? obj._nanoseconds;

    if (typeof seconds === 'number') {
      const ms = seconds * 1000 + (typeof nanoseconds === 'number' ? nanoseconds / 1e6 : 0);
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  return null;
}

function formatDateSpanishCompact(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('es-ES', { month: 'long' });
  const monthCapital = month.charAt(0).toUpperCase() + month.slice(1);
  return `${day} ${monthCapital}`;
}

function pickNextUpcomingEvent(events: CalendarEvent[], now: Date): CalendarEvent | null {
  for (const ev of events) {
    const d = parseFirestoreTimestamp(ev.eventDetails?.date);
    if (d && d >= now) return ev;
  }

  return events[0] ?? null;
}

function mapEventDetailToNextShow(detail: ExtendedEventDetail): NextShow | null {
  const clientName = detail.clientContact?.name || 'Cliente';
  const eventDate = parseFirestoreTimestamp(detail.eventDetails?.date);
  const dateLabel = eventDate ? formatDateSpanishCompact(eventDate) : '';
  const location = detail.eventDetails?.location || '';

  return { clientName, dateLabel, location };
}

function toVisitsBars(data: DashboardStats['visitsChartData']): Array<{ day: string; count: number; heightPct: number }> {
  const counts = data.map((d) => d.count);
  const max = Math.max(...counts, 1);
  return data.map((d) => ({
    ...d,
    heightPct: (d.count / max) * 100,
  }));
}