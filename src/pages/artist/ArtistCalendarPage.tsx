import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApiResponse } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { isBackendRoleArtista } from '../../helpers/role';
import { withMinimumDelay } from '../../helpers/withMinimumDelay';
import { api } from '../../api';
import { PageLayout } from '../../layouts';
import { Button, Skeleton, UserMenu } from '../../components';
import { FiArrowLeft, FiCalendar, FiChevronLeft, FiChevronRight, FiLock } from 'react-icons/fi';
import { getArtistProfile, toggleArtistBlockedDate } from '../../api/artistProfileService';
import { artistAcceptContract, artistRejectContract, dispatchContractsApiRefresh } from '../../api/contractService';
import { ClientContractSigningModal } from '../../components/client/ClientContractSigningModal';

type CalendarContractEvent = {
  id: string;
  eventDetails?: {
    name?: string;
    date?: unknown;
    location?: string;
    description?: string;
  };
};

type ExtendedEventDetail = {
  id: string;
  status?: string;
  financials?: {
    totalAmount?: number;
    paymentStatus?: string;
  };
  clientContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  eventDetails?: {
    name?: string;
    date?: unknown;
    location?: string;
    description?: string;
  };
};

type NextShow = {
  clientName: string;
  dateTimeLabel: string;
  location: string;
};

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

function startOfWeekMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun - 6 Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, days: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

function formatMonthYear(d: Date): string {
  return d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
}

function formatDateShort(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('es-ES', { month: 'short' });
  return `${day} ${month}`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function getDayIndexMonday(date: Date, weekStartMonday: Date): number {
  const diffDays = Math.floor((date.getTime() - weekStartMonday.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays;
}

export function ArtistCalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isArtista = isBackendRoleArtista(user?.role);

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [events, setEvents] = useState<CalendarContractEvent[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEventLoading, setIsEventLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ExtendedEventDetail | null>(null);
  const [artistSigningOpen, setArtistSigningOpen] = useState(false);
  const [artistSigningLoading, setArtistSigningLoading] = useState(false);
  const [artistActionError, setArtistActionError] = useState('');

  const range = useMemo(() => {
    const start = new Date(weekStart);
    const end = addDays(weekStart, 7);
    end.setMilliseconds(end.getMilliseconds() - 1); // include last ms of Sunday
    return { start, end };
  }, [weekStart]);

  useEffect(() => {
    if (!user?.uid || !isArtista) return;

    setIsLoading(true);
    setError('');

    let cancelled = false;
    async function load() {
      try {
        const startIso = range.start.toISOString();
        const endIso = range.end.toISOString();

        const [res, profile] = await Promise.all([
          withMinimumDelay(1000, () =>
            api<ApiResponse<CalendarContractEvent[]>>(`events/calendar?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`)
          ),
          getArtistProfile()
        ]);

        if (cancelled) return;
        setEvents(res.data ?? []);
        setBlockedDates(profile.blockedDates || []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'No se pudo cargar el calendario.');
        setEvents([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, isArtista, range.start, range.end]);

  const handleDayToggle = async (day: Date) => {
    const key = day.toISOString().split('T')[0];
    try {
      const next = await toggleArtistBlockedDate(key);
      setBlockedDates(next);
    } catch (err) {
      console.error('Error toggling blocked date:', err);
    }
  };

  async function openEvent(contractId: string) {
    setSelectedEventId(contractId);
    setIsEventLoading(true);
    setSelectedEvent(null);

    try {
      const detailRes = await withMinimumDelay(500, () => api<ApiResponse<ExtendedEventDetail>>(`events/${contractId}`));
      setSelectedEvent(detailRes.data ?? null);
    } catch {
      setSelectedEvent(null);
    } finally {
      setIsEventLoading(false);
    }
  }

  const weekDates = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  const timelineStartMinutes = 0;
  // 23:59 -> minutos máximos 1439; usando 24:00 como límite para cálculo.
  const timelineEndMinutes = 24 * 60; // 00:00 - 24:00
  const minutesPerSlot = 30;
  const rowHeight = 52; // px per 30 min (bigger vertical spacing)
  const slotCount = Math.max(1, (timelineEndMinutes - timelineStartMinutes) / minutesPerSlot);
  const timelineHeight = slotCount * rowHeight;
  const dayHeaderOffsetPx = 40; // debe coincidir con el `top-10` usado en grid/event blocks
  const eventDurationMinutes = 90; // matches the design screenshot

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarContractEvent[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];

    for (const ev of events) {
      const d = parseFirestoreTimestamp(ev.eventDetails?.date);
      if (!d) continue;
      const idx = getDayIndexMonday(d, weekStart);
      if (idx < 0 || idx > 6) continue;
      map[idx].push(ev);
    }

    // Sort by start time
    for (const k of Object.keys(map)) {
      const key = Number(k);
      map[key] = map[key].sort((a, b) => {
        const ad = parseFirestoreTimestamp(a.eventDetails?.date);
        const bd = parseFirestoreTimestamp(b.eventDetails?.date);
        return (ad?.getTime() ?? 0) - (bd?.getTime() ?? 0);
      });
    }

    return map;
  }, [events, weekStart]);

  const modalEvent: NextShow | null = useMemo(() => {
    if (!selectedEvent) return null;
    const date = parseFirestoreTimestamp(selectedEvent.eventDetails?.date);
    return {
      clientName: selectedEvent.clientContact?.name || 'Cliente',
      dateTimeLabel: date ? `${formatDateShort(date)} • ${formatTime(date)}` : '',
      location: selectedEvent.eventDetails?.location || '',
    };
  }, [selectedEvent]);

  const normalizedSelectedStatus = String(selectedEvent?.status || '').trim().toLowerCase();
  const pendingArtistSignature =
    normalizedSelectedStatus === 'pending_artist_signature' || normalizedSelectedStatus === 'pending';
  const acceptedSignature = normalizedSelectedStatus === 'accepted' || normalizedSelectedStatus === 'completed';
  const paymentStatus = String(selectedEvent?.financials?.paymentStatus || '').trim().toUpperCase();
  const isPaymentPending = paymentStatus === 'UNPAID' || paymentStatus === 'PARTIAL' || paymentStatus === '';

  if (!user) return null;
  if (!isArtista) {
    return (
      <div className="w-full max-w-[900px] mx-auto">
        <PageLayout title="Calendario" maxWidth="md" variant="dark">
          <p className="text-neutral-500">Solo los artistas pueden ver el calendario.</p>
        </PageLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 rounded px-2 py-1"
          aria-label="Volver"
        >
          <FiArrowLeft size={18} />
          <span>Volver</span>
        </button>

        <div className="flex items-center gap-2">
          <FiCalendar size={18} className="text-[#00d4c8]" />
          <div className="text-white font-semibold">{formatMonthYear(weekStart)}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" className="p-2" onClick={() => setWeekStart((w) => addDays(w, -7))}>
            <FiChevronLeft size={16} />
          </Button>
          <Button variant="secondary" className="px-3 py-2" onClick={() => setWeekStart(startOfWeekMonday(new Date()))}>
            Hoy
          </Button>
          <Button variant="secondary" className="p-2" onClick={() => setWeekStart((w) => addDays(w, 7))}>
            <FiChevronRight size={16} />
          </Button>
          <UserMenu />
        </div>
      </div>

      <div className="p-4 flex-1 overflow-hidden">
        <div className="border border-white/10 rounded-xl overflow-hidden bg-neutral-950/30 h-full">
          <div className="flex h-full">
              {/* Time column */}
              <div className="w-16 shrink-0 border-r border-white/10 relative">
                {Array.from({ length: slotCount + 1 }).map((_, idx) => {
                  const minutes = timelineStartMinutes + idx * minutesPerSlot;
                  const labelDate = new Date();
                  labelDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
                  // Show labels only on the hour to avoid crowding.
                  const isHour = minutes % 60 === 0;
                  if (!isHour) return null;
                  const label = labelDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={idx}
                      className="absolute left-0 right-0 text-[10px] text-neutral-500 px-2"
                      style={{ top: idx * rowHeight + dayHeaderOffsetPx - 8 }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* Days columns */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <div className="min-w-[980px]" style={{ height: timelineHeight + dayHeaderOffsetPx }}>
                  {isLoading ? (
                    <div className="w-full h-full p-4 space-y-4">
                      <Skeleton className="h-4 w-40 rounded" />
                      <div className="flex gap-2">
                        {Array.from({ length: 7 }).map((_, idx) => (
                          <div key={idx} className="flex-1">
                            <Skeleton className="h-full w-full rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : error ? (
                    <div className="p-6 text-red-400">{error}</div>
                  ) : (
                    <div className="flex h-full">
                      {weekDates.map((day, dayIdx) => {
                        const dateKey = day.toISOString().split('T')[0];
                        const isBlocked = blockedDates.includes(dateKey);

                        return (
                          <div key={day.toISOString()} className={`flex-1 border-r border-white/10 last:border-r-0 relative ${isBlocked ? 'bg-red-500/5' : ''}`}>
                            {/* Day header */}
                            <div className="sticky top-0 z-10 bg-neutral-950/80 border-b border-white/10 px-3 h-10 flex items-center justify-between group">
                              <div className="flex flex-col justify-center">
                                <div className="text-xs text-neutral-500">
                                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][dayIdx]}
                                </div>
                                <div className="text-sm text-white/90 font-medium">{day.getDate()}</div>
                              </div>
                              <button 
                                onClick={() => handleDayToggle(day)}
                                className={`p-1.5 rounded-lg transition-colors ${isBlocked ? 'text-red-400 bg-red-400/10 hover:bg-neutral-800' : 'text-neutral-600 hover:text-white hover:bg-white/10'}`}
                                title={isBlocked ? 'Desbloquear día' : 'Bloquear día'}
                              >
                                {isBlocked ? <FiLock size={14} /> : <FiLock size={14} className="opacity-0 group-hover:opacity-100" />}
                              </button>
                            </div>

                            {/* Timeline grid lines */}
                            <div className="absolute left-0 right-0 top-10 bottom-0">
                              {Array.from({ length: slotCount }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className={[
                                    'absolute left-3 right-3 border-t',
                                    idx % 2 === 0 ? 'border-white/20' : 'border-white/10',
                                  ].join(' ')}
                                  style={{ top: idx * rowHeight }}
                                />
                              ))}
                            </div>

                            {/* Blocked overlay text */}
                            {isBlocked && (
                              <div className="absolute inset-0 top-10 flex items-center justify-center pointer-events-none rotate-[-45deg] opacity-20">
                                <span className="text-red-500 font-bold text-2xl uppercase tracking-widest whitespace-nowrap">BLOQUEADO</span>
                              </div>
                            )}

                            {/* Event blocks */}
                            <div className="absolute left-0 right-0 top-10 bottom-0 overflow-hidden">
                              {(eventsByDay[dayIdx] ?? []).map((ev, idx) => {
                                const d = parseFirestoreTimestamp(ev.eventDetails?.date);
                                if (!d) return null;
                                const startMinutes = d.getHours() * 60 + d.getMinutes();
                                if (startMinutes < timelineStartMinutes || startMinutes >= timelineEndMinutes) return null;

                                const endMinutes = startMinutes + eventDurationMinutes;
                                const effectiveEnd = Math.min(endMinutes, timelineEndMinutes);
                                const effectiveMinutes = effectiveEnd - startMinutes;
                                if (effectiveMinutes <= 0) return null;

                                const top = (startMinutes - timelineStartMinutes) * (rowHeight / minutesPerSlot);
                                const height = effectiveMinutes * (rowHeight / minutesPerSlot);

                                const title = ev.eventDetails?.name || 'Show';
                                const subtitle = ev.eventDetails?.location || '';

                                return (
                                  <button
                                    key={ev.id}
                                    type="button"
                                    className="absolute left-3 right-3 rounded-lg bg-[#00d4c8]/25 border border-[#00d4c8]/40 px-2 py-2 text-left text-white/90 hover:bg-[#00d4c8]/30 transition-colors cursor-pointer"
                                    style={{ top, height }}
                                    onClick={() => openEvent(ev.id)}
                                  >
                                    <div className="text-[12px] font-semibold leading-tight truncate">{title}</div>
                                    <div className="text-[11px] text-white/70 leading-tight truncate">{subtitle}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Event modal */}
      {selectedEventId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xl rounded-xl border border-white/10 bg-neutral-950/95 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="text-white font-semibold">Información del evento</div>
              <Button variant="ghost" className="px-3 py-2" onClick={() => setSelectedEventId(null)} disabled={isEventLoading}>
                Cerrar
              </Button>
            </div>

            <div className="p-5">
              {isEventLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-4 w-48 rounded" />
                  <Skeleton className="h-4 w-72 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                </div>
              ) : selectedEvent && modalEvent ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-white font-semibold">Show en vivo</div>
                    <div className="text-neutral-500 text-sm mt-1">{modalEvent.dateTimeLabel}</div>
                  </div>

                  <div className="space-y-1 text-neutral-300 text-sm">
                    <div>
                      <span className="text-neutral-500">Estado: </span>
                      <span>
                        {acceptedSignature
                          ? 'Firmado'
                          : pendingArtistSignature
                            ? 'Pendiente firma del artista'
                            : selectedEvent.status || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Pago: </span>
                      <span className={isPaymentPending ? 'text-amber-300 font-medium' : 'text-emerald-300 font-medium'}>
                        {paymentStatus || 'UNPAID'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Tiempo: </span>
                      <span>90 mins</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Lugar: </span>
                      <span>{modalEvent.location || '—'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Contacto: </span>
                      <span>{selectedEvent.clientContact?.phone || selectedEvent.clientContact?.email || '—'}</span>
                    </div>
                  </div>
                  {artistActionError ? <p className="text-sm text-red-400">{artistActionError}</p> : null}
                  {pendingArtistSignature ? (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {isPaymentPending ? (
                        <span className="inline-flex items-center rounded-md border border-amber-300/40 bg-amber-400/15 px-3 py-2 text-xs font-semibold text-amber-100">
                          Pendiente de pago del cliente
                        </span>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={() => {
                            setArtistActionError('');
                            setArtistSigningOpen(true);
                          }}
                          disabled={artistSigningLoading}
                        >
                          {artistSigningLoading ? 'Procesando...' : 'Firmar y aceptar'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={async () => {
                          if (!selectedEventId || artistSigningLoading) return;
                          setArtistActionError('');
                          setArtistSigningLoading(true);
                          try {
                            await artistRejectContract(selectedEventId, 'Rechazado por artista');
                            dispatchContractsApiRefresh();
                            await openEvent(selectedEventId);
                          } catch (err) {
                            setArtistActionError(err instanceof Error ? err.message : 'No se pudo rechazar el contrato.');
                          } finally {
                            setArtistSigningLoading(false);
                          }
                        }}
                        disabled={artistSigningLoading}
                      >
                        {artistSigningLoading ? 'Procesando...' : 'Rechazar'}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-neutral-500 text-sm">No se pudo cargar el detalle del evento.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <ClientContractSigningModal
        isOpen={artistSigningOpen}
        onClose={() => {
          if (!artistSigningLoading) setArtistSigningOpen(false);
        }}
        artistParty={{
          roleLabel: 'Artista',
          name: user.displayName || 'Artista',
          signed: false,
        }}
        clientParty={{
          roleLabel: 'Cliente',
          name: selectedEvent?.clientContact?.name || 'Cliente',
          signed: true,
        }}
        summary={{
          event: selectedEvent?.eventDetails?.name || 'Evento',
          dateLabel: modalEvent?.dateTimeLabel || '—',
          location: selectedEvent?.eventDetails?.location || '—',
          totalValue: `$${Math.round(Number(selectedEvent?.financials?.totalAmount || 0))}`,
          duration: '90 mins',
          service: selectedEvent?.eventDetails?.name || 'Servicio artístico',
        }}
        onSign={async ({ dataUrl, acceptedTerms }) => {
          if (!selectedEventId) return;
          setArtistActionError('');
          setArtistSigningLoading(true);
          try {
            await artistAcceptContract(selectedEventId, {
              artistSignatureDataUrl: dataUrl,
              acceptedTerms,
            });
            setArtistSigningOpen(false);
            dispatchContractsApiRefresh();
            await openEvent(selectedEventId);
          } catch (err) {
            setArtistActionError(err instanceof Error ? err.message : 'No se pudo firmar el contrato.');
          } finally {
            setArtistSigningLoading(false);
          }
        }}
      />
    </div>
  );
}

