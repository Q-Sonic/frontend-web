import { useCallback, useMemo, useState } from 'react';
import type { UseArtistProfileByIdOptions } from '../../hooks/useArtistProfileById';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Skeleton } from '../../components';
import { ClientArtistSectionHeader } from '../../components/client/ClientArtistSectionHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';
import { buildReservationNavigationState, getPrimaryReservationService } from '../../helpers/artistReservation';
import { isArtistServiceBookable } from '../../helpers/artistServiceVisibility';
import { localDateKey } from '../../helpers/artistProfile';
import { isBackendRoleArtista, isBackendRoleCliente } from '../../helpers/role';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import type { ArtistServiceRecord } from '../../types';
import { Button, Card } from '../../components';
import { formatMoney } from '../../helpers/money';
import { FiX } from 'react-icons/fi';

const WEEKDAYS_ES_LONG = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function buildMonthCells(year: number, month: number): { inMonth: boolean; date: Date }[] {
  const first = new Date(year, month, 1);
  const pad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { inMonth: boolean; date: Date }[] = [];
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = pad - 1; i >= 0; i--) {
    const d = prevLast - i;
    cells.push({ inMonth: false, date: new Date(year, month - 1, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ inMonth: true, date: new Date(year, month, d) });
  }
  let next = 1;
  while (cells.length < 42) {
    cells.push({ inMonth: false, date: new Date(year, month + 1, next) });
    next += 1;
  }
  return cells;
}

function monthLabelEs(year: number, month: number): string {
  const raw = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1),
  );
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function ArtistProfileCalendarPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exitHomePath, basePath } = useArtistProfileNav();
  const { profile, services, artistDisplayName, loading, error } = useArtistProfileById(id);

  const isClientArtistCalendar =
    isBackendRoleCliente(user?.role) && basePath.startsWith('/client/artists');

  const [view, setView] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const blockedSet = useMemo(() => new Set(profile?.blockedDates ?? []), [profile?.blockedDates]);
  const availableServices = useMemo(
    () =>
      services.filter(
        (service): service is ArtistServiceRecord =>
          !!service?.id && isArtistServiceBookable(service),
      ),
    [services],
  );
  const reservationService = useMemo(
    () => getPrimaryReservationService(availableServices),
    [availableServices],
  );
  const reserveHref =
    reservationService ? `${basePath}/services/${reservationService.id}` : `${basePath}#documents`;

  const cells = useMemo(() => buildMonthCells(view.y, view.m), [view.y, view.m]);

  const monthOptions = useMemo(() => {
    const out: { y: number; m: number; label: string }[] = [];
    for (let y = 2024; y <= 2028; y++) {
      for (let m = 0; m < 12; m++) {
        out.push({ y, m, label: monthLabelEs(y, m) });
      }
    }
    return out;
  }, []);

  const currentKey = `${view.y}-${view.m}`;
  const goToReservation = useCallback(
    (service: ArtistServiceRecord, dateKey?: string) => {
      if (!isClientArtistCalendar) return;
      navigate(`${basePath}/services/${service.id}`, {
        state: buildReservationNavigationState(service, dateKey),
      });
    },
    [basePath, isClientArtistCalendar, navigate],
  );

  if (!id) return <Navigate to={exitHomePath} replace />;

  if (loading) {
    return (
      <div
        className={
          isClientArtistCalendar
            ? 'w-full max-w-[1600px] mx-auto space-y-8 px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-16'
            : 'p-6 md:p-8 max-w-5xl mx-auto space-y-6'
        }
      >
        {isClientArtistCalendar ? (
          <ClientArtistSectionHeader
            titleLead="Calendario de"
            artistDisplayName=""
            profile={null}
            basePath={basePath}
            loading
          />
        ) : (
          <Skeleton className="h-8 w-64 rounded-lg" />
        )}
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 text-neutral-400 text-sm">
        {error || 'No se pudo cargar el calendario.'}
      </div>
    );
  }

  return (
    <div
      className={
        isClientArtistCalendar
          ? 'w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-16 space-y-8'
          : 'w-full max-w-5xl mx-auto p-6 md:p-8 pb-16 space-y-6'
      }
    >
      {isClientArtistCalendar ? (
        <ClientArtistSectionHeader
          titleLead="Calendario de"
          artistDisplayName={artistDisplayName}
          profile={profile}
          basePath={basePath}
          reserveHref={reserveHref}
          onReserveClick={() => reservationService && goToReservation(reservationService)}
        />
      ) : (
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Calendario · {artistDisplayName}
          </h1>
        </div>
      )}

      <div
        className="rounded-2xl border border-white/10 bg-[#121820] p-4 md:p-6 shadow-[0_0_20px_rgba(0,204,203,0.08)]"
        style={{ boxShadow: '0 0 24px rgba(0, 212, 200, 0.06)' }}
      >
        <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
              aria-label="Mes anterior"
              onClick={() => {
                setView((v) => {
                  const d = new Date(v.y, v.m - 1, 1);
                  return { y: d.getFullYear(), m: d.getMonth() };
                });
              }}
            >
              <FiChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
              aria-label="Mes siguiente"
              onClick={() => {
                setView((v) => {
                  const d = new Date(v.y, v.m + 1, 1);
                  return { y: d.getFullYear(), m: d.getMonth() };
                });
              }}
            >
              <FiChevronRight size={22} />
            </button>
          </div>
          <label className="sr-only">Mes</label>
          <select
            className="rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm text-white font-medium min-w-[200px] focus:outline-none focus:ring-2 focus:ring-accent/30"
            value={currentKey}
            onChange={(e) => {
              const [ys, ms] = e.target.value.split('-');
              setView({ y: Number(ys), m: Number(ms) });
            }}
          >
            {monthOptions.map((o) => (
              <option key={`${o.y}-${o.m}`} value={`${o.y}-${o.m}`}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-white/10">
            {WEEKDAYS_ES_LONG.map((d) => (
              <div
                key={d}
                className="bg-[#0f141c] px-1 py-2.5 text-center text-[11px] md:text-xs font-medium text-neutral-400"
              >
                {d}
              </div>
            ))}
            {cells.map((cell, idx) => {
              const key = localDateKey(cell.date);
              const blocked = blockedSet.has(key);
              const dayNum = cell.date.getDate();
              const inMonth = cell.inMonth;
              const today = new Date();
              const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
              const cellStart = new Date(
                cell.date.getFullYear(),
                cell.date.getMonth(),
                cell.date.getDate(),
              ).getTime();
              const isPast = cellStart < todayStart;
              const selectable = isClientArtistCalendar && inMonth && !blocked && !isPast;

              return (
                <button
                  key={`${key}-${idx}`}
                  type="button"
                  disabled={!selectable}
                  onClick={() => {
                    if (!selectable) return;
                    setSelectedDateKey(key);
                  }}
                  className={`min-h-[88px] p-2 flex flex-col bg-[#0f141c] ${
                    inMonth ? '' : 'opacity-45'
                  } ${blocked && inMonth ? 'bg-[#4A151B]/95' : ''} ${
                    selectable ? 'cursor-pointer transition hover:bg-white/8' : ''
                  }`}
                >
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      inMonth ? 'text-white' : 'text-neutral-600'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {blocked && inMonth ? (
                    <span className="mt-auto text-[10px] md:text-[11px] font-medium text-[#FF4D4D] leading-tight">
                      No Disponible
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDateKey && (
        <ServiceSelectionModal
          isOpen={!!selectedDateKey}
          onClose={() => setSelectedDateKey(null)}
          services={availableServices}
          onSelect={(s) => {
            goToReservation(s, selectedDateKey);
            setSelectedDateKey(null);
          }}
        />
      )}
    </div>
  );
}

function ServiceSelectionModal({
  isOpen,
  onClose,
  services,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  services: ArtistServiceRecord[];
  onSelect: (s: ArtistServiceRecord) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-[#121820] shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Selecciona un servicio</h2>
            <p className="text-sm text-neutral-400 mt-1">Elige el servicio que deseas contratar para esta fecha</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
          {services.map((service) => (
            <Card
              key={service.id}
              className="group cursor-pointer border border-white/5 bg-white/[0.03] hover:border-accent/40 hover:bg-white/[0.05] transition-all p-4"
              onClick={() => onSelect(service)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-accent transition">{service.name}</h3>
                  <p className="text-sm text-neutral-400 line-clamp-2 mt-1">{service.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold text-accent">${formatMoney(service.price)}</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider">por hora</div>
                </div>
              </div>
              
              {/* Validation message if no contract is linked - as per Stage Go requirement */}
              {(!service.contractTemplateId && !service.contractPdfUrl && !service.documentUrl) && (
                <div className="mt-3 py-1 px-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-300 inline-block">
                  ⚠️ Este servicio requiere configurar un contrato para ser contratado.
                </div>
              )}
            </Card>
          ))}
          
          {services.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-neutral-500 italic">No hay servicios disponibles para reserva directa.</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-white/5 flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-full">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
