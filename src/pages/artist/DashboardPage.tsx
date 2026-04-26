import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import WorldIcon from '../../../public/icons/world';
import { api } from '../../api';
import { ensureArtistProfileListedForDiscovery } from '../../api/artistProfileService';
import { Skeleton } from '../../components';
import { ClientFloatingChatButton } from '../../components/client/ClientFloatingChatButton';
import { buildWhatsappUrl } from '../../config/whatsapp';
import { WithdrawalModal } from '../../components/payments/WithdrawalModal';
import { useAuth } from '../../contexts/AuthContext';
import { formatMoney } from '../../helpers/money';
import { isBackendRoleArtista } from '../../helpers/role';
import { withMinimumDelay } from '../../helpers/withMinimumDelay';
import type { ApiResponse } from '../../types';

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
  createdAt: unknown;
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

type CancelFlag = { current: boolean };

export function HomeArtistaPage() {
  const { user } = useAuth();
  const isArtista = isBackendRoleArtista(user?.role);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);

  const [nextShow, setNextShow] = useState<NextShow | null>(null);
  const [nextShowLoading, setNextShowLoading] = useState(true);
  const [nextShowError, setNextShowError] = useState('');

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const loadStats = useCallback(async (cancelled?: CancelFlag) => {
    setStatsLoading(true);
    setStatsError('');

    try {
      const statsRes = await withMinimumDelay(1000, () =>
        api<ApiResponse<DashboardStats>>('dashboard/stats'),
      );

      if (!cancelled?.current) {
        setStats(statsRes.data);
      }
    } catch (err) {
      if (!cancelled?.current) {
        setStatsError(err instanceof Error ? err.message : 'Error al cargar el resumen.');
        setStats(null);
      }
    } finally {
      if (!cancelled?.current) {
        setStatsLoading(false);
      }
    }
  }, []);

  const loadWithdrawals = useCallback(
    async (cancelled?: CancelFlag) => {
      if (!user?.uid || !isArtista) {
        if (!cancelled?.current) {
          setWithdrawals([]);
          setWithdrawalsLoading(false);
        }
        return;
      }

      setWithdrawalsLoading(true);

      try {
        const res = await api<ApiResponse<WithdrawalRequest[]>>('payments/withdrawals');
        if (!cancelled?.current) {
          setWithdrawals(res.data ?? []);
        }
      } catch {
        if (!cancelled?.current) {
          setWithdrawals([]);
        }
      } finally {
        if (!cancelled?.current) {
          setWithdrawalsLoading(false);
        }
      }
    },
    [isArtista, user?.uid],
  );

  const loadNextShow = useCallback(
    async (cancelled?: CancelFlag) => {
      if (!user?.uid || !isArtista) {
        if (!cancelled?.current) {
          setNextShow(null);
          setNextShowError('');
          setNextShowLoading(false);
        }
        return;
      }

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
            `events/calendar?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`,
          );

          const nextContract = pickNextUpcomingEvent(calendarRes.data ?? [], now);
          if (!nextContract) return null;

          const detailRes = await api<ApiResponse<ExtendedEventDetail>>(`events/${nextContract.id}`);
          return mapEventDetailToNextShow(detailRes.data);
        });

        if (!cancelled?.current) {
          setNextShow(nextShowRes);
        }
      } catch (err) {
        if (!cancelled?.current) {
          setNextShow(null);
          setNextShowError(err instanceof Error ? err.message : 'Error al cargar el próximo show.');
        }
      } finally {
        if (!cancelled?.current) {
          setNextShowLoading(false);
        }
      }
    },
    [isArtista, user?.uid],
  );

  useEffect(() => {
    if (!user?.uid || !isArtista) return;
    void ensureArtistProfileListedForDiscovery(user.uid);
  }, [isArtista, user?.uid]);

  useEffect(() => {
    if (!user?.uid || !isArtista) {
      setStatsLoading(false);
      setWithdrawalsLoading(false);
      setNextShowLoading(false);
      return;
    }

    const cancelled = { current: false };

    void loadStats(cancelled);
    void loadWithdrawals(cancelled);
    void loadNextShow(cancelled);

    return () => {
      cancelled.current = true;
    };
  }, [isArtista, loadNextShow, loadStats, loadWithdrawals, user?.uid]);

  const refreshDashboard = useCallback(() => {
    void loadStats();
    void loadWithdrawals();
    void loadNextShow();
  }, [loadNextShow, loadStats, loadWithdrawals]);

  if (!user) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-6 pb-6 pt-8 md:pt-10">
        <div className="space-y-6 rounded-2xl bg-card p-6">
          <Skeleton className="h-10 w-52 rounded-xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isArtista) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-6 pb-6 pt-8 md:pt-10">
        <div className="rounded-2xl bg-card p-6">
          <h1 className="mb-2 text-2xl font-semibold text-white">Dashboard del artista</h1>
          <p className="text-muted">Solo los artistas pueden acceder a esta pantalla.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 pb-6 pt-8 md:pt-10">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-6 rounded-2xl bg-card p-6">
          <SummaryCard stats={stats} loading={statsLoading} error={statsError} />

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Retiros recientes</h2>
              <span className="text-sm text-muted">Historial</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-white/5 text-xs uppercase tracking-wider text-white/50">
                    <th className="p-4 font-semibold">Fecha</th>
                    <th className="p-4 font-semibold">Monto</th>
                    <th className="p-4 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawalsLoading ? (
                    Array.from({ length: 3 }, (_, index) => (
                      <tr key={index}>
                        <td className="p-4">
                          <Skeleton className="h-4 w-24 rounded" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-4 w-20 rounded" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </td>
                      </tr>
                    ))
                  ) : withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-sm text-muted">
                        Aún no has solicitado retiros.
                      </td>
                    </tr>
                  ) : (
                    withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="transition-colors hover:bg-white/2">
                        <td className="p-4 text-sm text-white/80">
                          {formatWithdrawalDate(withdrawal.createdAt)}
                        </td>
                        <td className="p-4 text-sm font-medium text-white">
                          ${formatMoney(withdrawal.amount)}
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${getWithdrawalStatusClass(
                                withdrawal.status,
                              )}`}
                            >
                              {getWithdrawalStatusLabel(withdrawal.status)}
                            </span>
                            {withdrawal.reason && withdrawal.status === 'REJECTED' ? (
                              <p className="text-[10px] italic text-red-300">{withdrawal.reason}</p>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Otros</h2>
              <span className="text-sm text-muted">Accesos rápidos</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PromoCard
                title="Blindaje Prime"
                subtitle="Protección avanzada de cuenta, prioridad de soporte y monitoreo preventivo."
                whatsappHref={buildPrimeWhatsappHref({
                  planName: 'Blindaje Prime',
                  artistName: user.displayName || user.email || 'artista',
                })}
                isPopular
              />
              <PromoCard
                title="Seguro Prime"
                subtitle="Cobertura para eventos y respaldo adicional para tus presentaciones."
                whatsappHref={buildPrimeWhatsappHref({
                  planName: 'Seguro Prime',
                  artistName: user.displayName || user.email || 'artista',
                })}
              />
            </div>
          </section>
        </div>

        <aside className="hidden w-80 shrink-0 space-y-4 xl:block">
          <BalanceCard
            balance={stats?.totalBalance ?? null}
            loading={statsLoading}
            onWithdrawClick={() => setIsWithdrawModalOpen(true)}
          />

          <NextShowCard nextShow={nextShow} loading={nextShowLoading} error={nextShowError} />
        </aside>
      </div>

      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        availableBalance={stats?.totalBalance ?? 0}
        onSuccess={() => {
          setIsWithdrawModalOpen(false);
          refreshDashboard();
        }}
      />
      <ClientFloatingChatButton />
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
  const bars = useMemo(
    () => (stats?.visitsChartData?.length ? toVisitsBars(stats.visitsChartData) : []),
    [stats],
  );

  const visitsValue = stats?.profileVisitsTotal ?? 0;
  const eventsValue = stats?.totalEvents ?? 0;
  const growthValue = stats?.eventsGrowthPercent ?? 0;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-white">Resumen</h1>

        <div className="flex items-center gap-3 text-sm text-muted">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-card">
            <WorldIcon color="var(--color-muted)" />
          </div>
          <div>
            <p>Visitas de tu perfil</p>
            <p className="text-xl font-semibold text-white">
              {loading ? <Skeleton className="h-6 w-16 rounded" /> : visitsValue}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-surface p-5">
          <h2 className="mb-3 text-lg font-bold text-white">Eventos</h2>

          <p className="mb-2 text-2xl font-bold text-white">
            {loading ? (
              <Skeleton className="h-8 w-44 rounded" />
            ) : (
              `${growthValue >= 0 ? '+' : ''}${growthValue}% vs mes anterior`
            )}
          </p>

          <p className="text-sm font-medium text-green-400">
            {loading ? <Skeleton className="h-4 w-36 rounded" /> : `${eventsValue} eventos este mes`}
          </p>

          {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Actividad del perfil</h2>
              <p className="text-sm text-muted">Visitas de los últimos días</p>
            </div>
            {!loading ? <span className="text-sm text-white/70">{visitsValue}</span> : null}
          </div>

          <div className="flex h-36 items-end gap-2">
            {loading
              ? Array.from({ length: 7 }, (_, index) => (
                  <Skeleton key={index} className="h-full min-w-0 flex-1 rounded-t-xl opacity-40" />
                ))
              : bars.length > 0
                ? bars.map((bar) => (
                    <div key={bar.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div className="flex h-28 w-full items-end rounded-xl bg-white/5 p-1">
                        <div
                          className="w-full rounded-lg bg-linear-to-t from-accent to-[#3A9AF4]"
                          style={{ height: `${Math.max(bar.heightPct, 8)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted">{bar.day}</span>
                    </div>
                  ))
                : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted">
                      Sin datos de visitas.
                    </div>
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
  onWithdrawClick,
}: {
  balance: number | null;
  loading: boolean;
  onWithdrawClick: () => void;
}) {
  return (
    <div className="rounded-3xl bg-linear-to-l from-accent to-[#3A9AF4] p-5 text-white">
      <p className="text-sm font-medium opacity-90">Mi saldo</p>
      <p className="mt-2 text-3xl font-bold">
        {loading || balance === null ? (
          <Skeleton className="inline-block h-8 w-28 rounded opacity-60 align-middle" />
        ) : (
          `$${formatMoney(balance)}`
        )}
      </p>

      <button
        type="button"
        onClick={onWithdrawClick}
        disabled={loading || balance === null || balance <= 0}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/20 px-4 py-2 font-medium transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Retirar
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

function NextShowCard({
  nextShow,
  loading,
  error,
}: {
  nextShow: NextShow | null;
  loading: boolean;
  error: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-card p-5">
      <h3 className="mb-3 text-lg font-bold text-white">Próximo show</h3>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-md bg-muted/20 text-2xl">
          🎤
        </div>

        <div className="min-w-0">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-4 w-44 rounded" />
            </div>
          ) : nextShow ? (
            <>
              <p className="truncate font-semibold text-white">{nextShow.clientName}</p>
              <p className="text-sm text-muted">
                {nextShow.dateLabel}
                {nextShow.location ? ` • ${nextShow.location}` : ''}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-white">{error ? 'No disponible' : 'Sin shows'}</p>
              <p className="text-sm text-muted">
                {error ? 'No se pudo cargar la información.' : 'Aún no tienes shows programados.'}
              </p>
            </>
          )}
        </div>
      </div>

      <Link
        to="/artist/calendario"
        className="block rounded-full bg-white/10 py-2 text-center text-sm font-medium text-white transition hover:bg-white/15"
      >
        Ver detalles
      </Link>
    </div>
  );
}

function PromoCard({
  title,
  subtitle,
  whatsappHref,
  isPopular = false,
}: {
  title: string;
  subtitle: string;
  whatsappHref: string;
  isPopular?: boolean;
}) {
  const isBlindaje = title.toLowerCase().includes('blindaje');
  
  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-2xl border border-white/5 bg-[#0a0c10] p-6 shadow-xl transition-all hover:-translate-y-1 hover:border-[#00d4c8]/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
    >
      {/* Background Glow */}
      <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-[#00d4c8]/5 blur-3xl transition-opacity group-hover:opacity-100 opacity-0" />
      
      {isPopular ? (
        <span className="absolute right-4 top-4 rounded-full bg-[#00d4c8]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00d4c8] border border-[#00d4c8]/20">
          Recomendado
        </span>
      ) : null}

      <div className="flex items-start gap-4">
        <div className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 ${isBlindaje ? 'bg-[#00d4c8]/10 text-[#00d4c8]' : 'bg-blue-500/10 text-blue-400'}`}>
          {isBlindaje ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-9"/><path d="M5 13a7 7 0 0 1 14 0"/><path d="M21 21H3"/><path d="M9 21v-4a3 3 0 0 1 6 0v4"/></svg>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white group-hover:text-[#00d4c8] transition-colors">{title}</h3>
          <p className="text-sm leading-relaxed text-neutral-400 line-clamp-2">{subtitle}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest group-hover:text-white transition-colors">Soporte VIP</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 transition-colors group-hover:bg-[#00d4c8] group-hover:text-black">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
      </div>
    </a>
  );
}

function buildPrimeWhatsappHref({
  planName,
  artistName,
}: {
  planName: string;
  artistName: string;
}): string {
  const cleanArtistName = artistName.trim() || 'artista';
  const message =
    `Hola, soy ${cleanArtistName} y quiero mas informacion sobre ${planName}. ` +
    'Me interesa conocer beneficios, precio y como activarlo en mi cuenta.';
  return buildWhatsappUrl(message);
}

function getWithdrawalStatusLabel(status: WithdrawalRequest['status']): string {
  switch (status) {
    case 'COMPLETED':
      return 'Completado';
    case 'REJECTED':
      return 'Rechazado';
    default:
      return 'Pendiente';
  }
}

function getWithdrawalStatusClass(status: WithdrawalRequest['status']): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-500/20 text-green-400';
    case 'REJECTED':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-yellow-500/20 text-yellow-300';
  }
}

function formatWithdrawalDate(value: unknown): string {
  const date = parseFirestoreTimestamp(value);
  return date ? date.toLocaleDateString('es-ES') : '—';
}

function parseFirestoreTimestamp(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    const seconds = objectValue.seconds ?? objectValue._seconds;
    const nanoseconds = objectValue.nanoseconds ?? objectValue._nanoseconds;

    if (typeof seconds === 'number') {
      const milliseconds = seconds * 1000 + (typeof nanoseconds === 'number' ? nanoseconds / 1e6 : 0);
      const date = new Date(milliseconds);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
}

function formatDateSpanishCompact(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('es-ES', { month: 'long' });
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return `${day} ${capitalizedMonth}`;
}

function pickNextUpcomingEvent(events: CalendarEvent[], now: Date): CalendarEvent | null {
  const sortedEvents = [...events].sort((left, right) => {
    const leftDate = parseFirestoreTimestamp(left.eventDetails?.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDate = parseFirestoreTimestamp(right.eventDetails?.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return leftDate - rightDate;
  });

  for (const event of sortedEvents) {
    const date = parseFirestoreTimestamp(event.eventDetails?.date);
    if (date && date >= now) return event;
  }

  return sortedEvents[0] ?? null;
}

function mapEventDetailToNextShow(detail: ExtendedEventDetail | null | undefined): NextShow | null {
  if (!detail) return null;

  const clientName = detail.clientContact?.name || 'Cliente';
  const eventDate = parseFirestoreTimestamp(detail.eventDetails?.date);
  const dateLabel = eventDate ? formatDateSpanishCompact(eventDate) : '';
  const location = detail.eventDetails?.location || '';

  return { clientName, dateLabel, location };
}

function toVisitsBars(
  data: DashboardStats['visitsChartData'],
): Array<{ day: string; count: number; heightPct: number }> {
  const counts = data.map((item) => item.count);
  const max = Math.max(...counts, 1);

  return data.map((item) => ({
    ...item,
    heightPct: (item.count / max) * 100,
  }));
}