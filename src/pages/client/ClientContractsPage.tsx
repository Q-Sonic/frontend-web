import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FiCheck, FiChevronRight, FiClock, FiCreditCard, FiEdit3, FiShield, FiXCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Skeleton, ContractCardSkeleton } from '../../components/Skeleton';
import { ClientAreaHeader } from '../../components/client/ClientAreaHeader';
import { ClientFloatingChatButton } from '../../components/client/ClientFloatingChatButton';
import { ClientAreaPageShell } from '../../components/shared/ClientAreaPageShell';
import { useClientMyContracts } from '../../hooks/useClientMyContracts';
import type {
  ContractEventDetails,
  ContractLifecycleStatus,
  ContractRecord,
} from '../../types/contract';
import { ClientContractSigningModal } from '../../components/client/ClientContractSigningModal';
import { persistSignedClientContractsWithApiFallback } from '../../helpers/clientContractPersistence';
import { appendContractSignedPendingArtistNotifications } from '../../helpers/clientNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { isBackendRoleCliente } from '../../helpers/role';
import { FiAlertCircle, FiInbox } from 'react-icons/fi';
import { PaymentezCheckoutButton } from '../../components/PaymentezCheckoutButton';
import { GroupPaymentButton } from '../../components/GroupPaymentButton';
import { cancelContractByClient } from '../../api/contractService';

const PAGE_SIZE = 6;

type StatusFilter = 'all' | 'pending' | 'signed' | 'cancelled';

function eventDateToTimestamp(dateRaw: ContractEventDetails['date'] | undefined): number {
  if (typeof dateRaw === 'string') {
    const t = Date.parse(dateRaw);
    return Number.isNaN(t) ? 0 : t;
  }
  if (dateRaw && typeof dateRaw === 'object' && '_seconds' in dateRaw) {
    const s = Number((dateRaw as { _seconds: number })._seconds);
    return Number.isFinite(s) ? s * 1000 : 0;
  }
  return 0;
}

function formatEventDateEs(c: ContractRecord): string {
  const raw = c.eventDetails?.date;
  const t = eventDateToTimestamp(raw);
  if (!t) return '—';
  try {
    const formatted = new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(t));
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return '—';
  }
}

function formatDateKeyEs(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return key;
  return new Date(y, m - 1, d).toLocaleDateString('es', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatUsd(amount: number | undefined): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function isPendingStatus(s: ContractLifecycleStatus): boolean {
  return s === 'PENDING' || s === 'PENDING_ARTIST_SIGNATURE';
}

function isSignedStatus(s: ContractLifecycleStatus): boolean {
  return s === 'ACCEPTED' || s === 'COMPLETED';
}

function isCancelledStatus(s: ContractLifecycleStatus): boolean {
  return s === 'CANCELLED' || s === 'REJECTED';
}

function matchesFilter(c: ContractRecord, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'pending') return isPendingStatus(c.status);
  if (filter === 'signed') return isSignedStatus(c.status);
  return isCancelledStatus(c.status);
}

function sortContractsForDisplay(rows: ContractRecord[]): ContractRecord[] {
  const rank = (s: ContractLifecycleStatus): number => {
    if (isPendingStatus(s)) return 0;
    if (isSignedStatus(s)) return 1;
    return 2;
  };
  return [...rows].sort((a, b) => {
    const dr = rank(a.status) - rank(b.status);
    if (dr !== 0) return dr;
    return eventDateToTimestamp(b.eventDetails?.date) - eventDateToTimestamp(a.eventDetails?.date);
  });
}

function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts[0]?.charAt(0)?.toUpperCase() || '?';
}

function displayNameForContract(c: ContractRecord): string {
  return c.artistDisplayName?.trim() || c.eventDetails?.name?.trim() || 'Contrato';
}

function statusUi(c: ContractRecord): { label: string; icon: ReactNode; lineClass: string } {
  if (isSignedStatus(c.status)) {
    return {
      label: 'Firmado',
      icon: <FiCheck className="text-base text-emerald-400" aria-hidden />,
      lineClass: 'text-emerald-400',
    };
  }
  if (isPendingStatus(c.status)) {
    return {
      label: c.status === 'PENDING_ARTIST_SIGNATURE' ? 'Pendiente firma del artista' : 'Pendiente',
      icon: <FiClock className="text-base text-orange-400" aria-hidden />,
      lineClass: 'text-orange-300',
    };
  }
  return {
    label: 'Cancelado',
    icon: <FiXCircle className="text-base text-neutral-500" aria-hidden />,
    lineClass: 'text-neutral-400',
  };
}

function sectionTitleForFilter(filter: StatusFilter, total: number): string {
  if (filter === 'all') return `Todos los contratos (${total})`;
  if (filter === 'pending') return `Contratos Pendientes (${total})`;
  if (filter === 'signed') return `Contratos Firmados (${total})`;
  return `Contratos Cancelados (${total})`;
}

function ContractAvatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  const [broken, setBroken] = useState(false);
  const src = photoUrl?.trim() ?? '';

  useEffect(() => {
    setBroken(false);
  }, [src]);

  const showImg = Boolean(src) && !broken;

  if (showImg) {
    return (
      <img
        src={src}
        alt=""
        className="h-[3.75rem] w-[3.75rem] shrink-0 rounded-full border border-accent/30 object-cover"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div
      className="flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center rounded-full border border-accent/25 bg-gradient-to-br from-white/[0.08] to-transparent text-sm font-bold tracking-tight text-white"
      aria-hidden
    >
      {initialsFromLabel(name)}
    </div>
  );
}

/** Reference: each pill outlined in teal; count in a small teal ring; one horizontal row (scroll on narrow screens). */
function FilterTab({
  active,
  label,
  count,
  onSelect,
}: {
  active: boolean;
  label: string;
  count: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition sm:px-4 ${
        active
          ? 'border-accent bg-accent text-white shadow-[0_0_18px_rgba(0,204,203,0.35)]'
          : 'border-accent/60 bg-transparent text-accent hover:border-accent hover:bg-accent/10'
      }`}
    >
      <span>{label}</span>
      <span
        className={`flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border px-1.5 text-xs font-bold tabular-nums ${
          active
            ? 'border-white/25 bg-black/20 text-white'
            : 'border-accent/50 bg-accent/10 text-accent'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ContractCard({
  c,
  isSelected,
  onToggle,
  onPaymentSuccess,
  onCancelled,
  groupSelected,
  onGroupToggle,
  onSignTrigger,
}: {
  c: ContractRecord;
  isSelected?: boolean;
  onToggle?: (id: string, val: boolean) => void;
  onPaymentSuccess?: () => void;
  onCancelled?: () => void;
  groupSelected?: boolean;
  onGroupToggle?: (id: string, val: boolean) => void;
  onSignTrigger?: (id: string) => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const name = displayNameForContract(c);
  const ui = statusUi(c);
  const location = c.eventDetails?.location?.trim() || '—';
  const amount = formatUsd(c.financials?.totalAmount);
  const headline = `${name} - ${amount}`;
  const hasUrl = Boolean(c.contractUrl?.trim());
  const sourceHasUrl = Boolean(c.sourceContractUrl?.trim());
  const hasSignatureReceipt = Boolean(c.signatureReceiptUrl?.trim());
  const unpaid = c.financials?.paymentStatus === 'UNPAID';
  const paid   = c.financials?.paymentStatus === 'PAID';
  const artistLink = c.artistId?.trim() ? `/client/artists/${c.artistId}` : null;
  const awaitingArtist = isPendingStatus(c.status);
  const canCancel = !isCancelledStatus(c.status);

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelContractByClient(c.id);
      setConfirmCancel(false);
      if (onCancelled) onCancelled();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo cancelar el contrato.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <article
      className={`flex flex-col gap-5 rounded-2xl border bg-[#141414] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition sm:flex-row sm:items-stretch sm:justify-between sm:gap-8 ${groupSelected ? 'border-[#38BACC]/60 shadow-[0_0_16px_rgba(56,186,204,0.15)]' : 'border-accent/45'}`}
      aria-label={headline}
    >
      <div className="flex min-w-0 flex-1 gap-4">
        {/* Group Payment or Signing Selection */}
        <div className="flex shrink-0 flex-col gap-4 pt-1 border-r border-white/10 pr-3 mr-1">
          {unpaid && onGroupToggle ? (
            <label className="group flex cursor-pointer flex-col items-center gap-1.5" title="Seleccionar para pago masivo">
              <span className="text-[9px] font-bold tracking-widest text-[#38BACC] opacity-70 group-hover:opacity-100 transition">PAGAR</span>
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={groupSelected ?? false}
                  onChange={(e) => onGroupToggle(c.id, e.target.checked)}
                  className="peer h-6 w-6 appearance-none rounded-lg border-2 border-[#38BACC]/30 bg-black/40 checked:border-[#38BACC] checked:bg-[#38BACC]/20 transition-all cursor-pointer"
                />
                <FiCreditCard className="absolute pointer-events-none text-[#38BACC] opacity-0 peer-checked:opacity-100 transition-opacity text-xs" />
                {!groupSelected && <FiCreditCard className="absolute pointer-events-none text-[#38BACC]/40 text-xs" />}
              </div>
            </label>
          ) : null}

          {c.status === 'PENDING' && onToggle ? (
            <label className="group flex cursor-pointer flex-col items-center gap-1.5" title="Seleccionar para firma masiva">
              <span className="text-[9px] font-bold tracking-widest text-accent opacity-70 group-hover:opacity-100 transition">FIRMAR</span>
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isSelected ?? false}
                  onChange={(e) => onToggle(c.id, e.target.checked)}
                  className="peer h-6 w-6 appearance-none rounded-lg border-2 border-accent/30 bg-black/40 checked:border-accent checked:bg-accent/20 transition-all cursor-pointer"
                />
                <FiEdit3 className="absolute pointer-events-none text-accent opacity-0 peer-checked:opacity-100 transition-opacity text-xs" />
                {!isSelected && <FiEdit3 className="absolute pointer-events-none text-accent/40 text-xs" />}
              </div>
            </label>
          ) : null}
        </div>
        <ContractAvatar name={name} photoUrl={c.artistPhotoUrl} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-base font-bold leading-snug text-white sm:text-lg">{headline}</p>
          {c.eventDetails?.eventDates && c.eventDetails.eventDates.length > 1 ? (
            <div className="text-sm text-neutral-500">
              <span>Fechas ({c.eventDetails.eventDates.length}):</span>
              <ul className="mt-0.5 flex flex-wrap gap-1">
                {c.eventDetails.eventDates.map((dk) => (
                  <li key={dk} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-neutral-300">
                    {formatDateKeyEs(dk)}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              Fecha: <span className="text-neutral-300">{formatEventDateEs(c)}</span>
            </p>
          )}
          <p className="text-sm text-neutral-500">
            Ubicación: <span className="text-neutral-300">{location}</span>
          </p>
          <div className={`flex items-center gap-2 pt-0.5 text-sm font-semibold ${ui.lineClass}`}>
            {ui.icon}
            <span>{ui.label}</span>
          </div>

          {/* Payment status badge */}
          {paid ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              <FiCheck className="text-xs" aria-hidden /> Pagado
            </span>
          ) : unpaid ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
              <FiClock className="text-xs" aria-hidden /> Pago pendiente
            </span>
          ) : null}

          {/* Contextual note */}
          {awaitingArtist && paid ? (
            <p className="pt-1 text-xs leading-relaxed text-neutral-400">
              Tu pago está reservado. Esperando que el artista confirme la reserva.{' '}
              <span className="font-semibold text-emerald-300/80">
                Si el artista rechaza o no responde, recibirás un reembolso automático.
              </span>
            </p>
          ) : awaitingArtist && unpaid ? (
            <p className="pt-1 text-xs leading-relaxed text-neutral-500">
              Tu firma ya consta en el sistema. El artista aún debe confirmar.{' '}
              <span className="text-amber-300/80">Completa el pago para asegurar tu reserva.</span>
            </p>
          ) : !awaitingArtist ? (
            <p className="pt-1 text-xs leading-relaxed text-accent/80">
              Requiere tu firma electrónica para formalizar la reserva.
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-3 border-t border-white/[0.06] pt-4 sm:w-[10rem] sm:border-0 sm:pt-0">
        <div className="flex items-center justify-end gap-0.5 text-sm font-semibold text-white">
          <span>{amount} USD</span>
          <FiChevronRight className="text-lg text-accent" aria-hidden />
        </div>
        {hasUrl ? (
          <a
            href={c.contractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-xl border border-accent/30 bg-accent py-2.5 text-center text-sm font-semibold text-white shadow-[0_0_14px_rgba(0,204,203,0.2)] transition hover:bg-accent/90 hover:text-white"
          >
            Ver contrato
          </a>
        ) : (
          <span
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-center text-sm font-medium text-neutral-500"
            title="El enlace al PDF aún no está disponible"
          >
            Ver contrato
          </span>
        )}
        {sourceHasUrl ? (
          <a
            href={c.sourceContractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 py-2.5 text-center text-xs font-semibold text-white/90 transition hover:bg-white/10"
          >
            Ver términos base
          </a>
        ) : null}
        {hasSignatureReceipt ? (
          <a
            href={c.signatureReceiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 py-2.5 text-center text-xs font-semibold text-white/90 transition hover:bg-white/10"
          >
            Comprobante firma
          </a>
        ) : null}
        {c.status === 'PENDING' && onSignTrigger && (
          <button
            type="button"
            onClick={() => onSignTrigger(c.id)}
            className="inline-flex w-full items-center justify-center rounded-xl border border-accent/40 bg-accent/10 py-2.5 text-center text-sm font-bold text-accent shadow-[0_0_12px_rgba(0,204,203,0.1)] transition hover:bg-accent hover:text-black"
          >
            <FiEdit3 className="mr-1.5 h-4 w-4" aria-hidden />
            Firmar ahora
          </button>
        )}
        {unpaid ? (
          <PaymentezCheckoutButton
            amount={c.financials?.totalAmount || 0}
            description={`Pago contrato - ${c.eventDetails?.name || 'Servicio'}`}
            devReference={c.id}
            className="w-full text-xs py-2.5"
            onSuccess={() => {
              if (onPaymentSuccess) onPaymentSuccess();
            }}
            onFailure={(detail) => alert(`Pago rechazado: ${detail}`)}
            onError={(err) => alert(`Error en el pago: ${err}`)}
          >
            Pagar ahora
          </PaymentezCheckoutButton>
        ) : null}
        {artistLink ? (
          <Link to={artistLink} className="text-center text-xs font-medium text-accent/90 hover:text-accent">
            Perfil del artista
          </Link>
        ) : null}

        {canCancel && !confirmCancel && (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="inline-flex w-full items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-center text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
          >
            <FiXCircle className="mr-1.5 text-sm" aria-hidden /> Cancelar reserva
          </button>
        )}

        {confirmCancel && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 space-y-2">
            <p className="text-xs text-red-200 leading-relaxed">
              {paid
                ? '¿Cancelar y recibir reembolso? El dinero volverá a tu tarjeta en 5–10 días hábiles.'
                : '¿Confirmas la cancelación? No se realizó ningún cargo.'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => void handleCancel()}
                className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-bold text-white disabled:opacity-60"
              >
                {cancelling ? 'Cancelando…' : 'Sí, cancelar'}
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setConfirmCancel(false)}
                className="flex-1 rounded-lg border border-white/20 bg-white/5 py-1.5 text-xs font-medium text-white/80"
              >
                No, volver
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export function ClientContractsPage() {
  const { user } = useAuth();
  const { contracts, loading, error, refetch } = useClientMyContracts();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [groupSelectedIds, setGroupSelectedIds] = useState<Set<string>>(new Set());

  const unpaidCount = useMemo(
    () => contracts.filter((c) => c.financials?.paymentStatus === 'UNPAID').length,
    [contracts],
  );

  const groupSelectedContracts = useMemo(
    () => contracts.filter((c) => groupSelectedIds.has(c.id)),
    [contracts, groupSelectedIds],
  );
  const groupTotal = useMemo(
    () => groupSelectedContracts.reduce((s, c) => s + (c.financials?.totalAmount || 0), 0),
    [groupSelectedContracts],
  );

  const toggleGroupSelection = (id: string, val: boolean) => {
    setGroupSelectedIds((prev) => {
      const next = new Set(prev);
      if (val) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelection = (id: string, val: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (val) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const counts = useMemo(() => {
    let pending = 0;
    let signed = 0;
    let cancelled = 0;
    for (const c of contracts) {
      if (isPendingStatus(c.status)) pending += 1;
      else if (isSignedStatus(c.status)) signed += 1;
      else cancelled += 1;
    }
    return { all: contracts.length, pending, signed, cancelled };
  }, [contracts]);

  const filtered = useMemo(() => {
    const rows = contracts.filter((c) => matchesFilter(c, filter));
    return sortContractsForDisplay(rows);
  }, [contracts, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const safePage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const contentBlock = (
    <>
      <header className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Mis Reservas</h1>
        <div className="mx-auto mt-5 h-px w-full max-w-xs bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-neutral-400 sm:text-[0.9375rem]">
          Revisa el estado y abre tus contratos de manera sencilla.
        </p>
      </header>

      <div
        className="mt-9 flex w-full flex-nowrap justify-start gap-2 overflow-x-auto py-1 pl-0 pr-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Filtrar contratos"
      >
        <FilterTab
          active={filter === 'all'}
          label="Todos"
          count={counts.all}
          onSelect={() => {
            setFilter('all');
            setPage(1);
          }}
        />
        <FilterTab
          active={filter === 'pending'}
          label="Pendientes"
          count={counts.pending}
          onSelect={() => {
            setFilter('pending');
            setPage(1);
          }}
        />
        <FilterTab
          active={filter === 'signed'}
          label="Firmados"
          count={counts.signed}
          onSelect={() => {
            setFilter('signed');
            setPage(1);
          }}
        />
        <FilterTab
          active={filter === 'cancelled'}
          label="Cancelados"
          count={counts.cancelled}
          onSelect={() => {
            setFilter('cancelled');
            setPage(1);
          }}
        />
      </div>

      <section className="mt-10" aria-live="polite">
        {unpaidCount > 0 ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-300/35 bg-amber-400/10 p-4 text-sm text-amber-100">
            <FiClock className="mt-0.5 shrink-0 text-amber-300" aria-hidden />
            <span>
              Tienes {unpaidCount} contrato{unpaidCount === 1 ? '' : 's'} con pago pendiente.{' '}
              <span className="font-semibold">Completa el pago para asegurar tu reserva</span> — el artista no podrá confirmar hasta que el pago esté acreditado.
              {unpaidCount > 1 && (
                <span className="mt-1 block text-amber-200/80">
                  Puedes seleccionar varios contratos con el checkbox y pagarlos todos en una sola transacción.
                </span>
              )}
            </span>
          </div>
        ) : null}

        {counts.pending > 0 ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-accent/35 bg-accent/10 p-4 text-sm text-accent-light">
            <FiEdit3 className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <span>
              Tienes {counts.pending} contrato{counts.pending === 1 ? '' : 's'} pendiente{counts.pending === 1 ? '' : 's'} de firma.{' '}
              <span className="font-semibold">Formaliza tus contratos para confirmar los términos</span> del servicio.
              {counts.pending > 1 && (
                <span className="mt-1 block text-accent/70">
                  Usa el checkbox <span className="font-bold">FIRMAR</span> para seleccionar varios y firmarlos todos juntos.
                </span>
              )}
            </span>
          </div>
        ) : null}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="shrink-0 text-base font-semibold text-white sm:text-lg">
              {sectionTitleForFilter(filter, filtered.length)}
            </h2>
            <div className="h-px min-w-[2rem] flex-1 bg-neutral-600/50" />
          </div>
          {filter === 'pending' && filtered.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const allPendingIds = filtered.map(c => c.id);
                setSelectedIds(new Set(allPendingIds));
                setSignModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/40 px-5 py-2 text-sm font-bold text-accent transition hover:bg-accent hover:text-black"
            >
              <FiEdit3 className="h-4 w-4" />
              Firmar todos los pendientes
            </button>
          )}
        </div>

        {loading ? (
          <ul className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={`contract-skel-${i}`}>
                <ContractCardSkeleton />
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-3xl border border-white/5 bg-white/3">
             <FiInbox size={48} className="text-neutral-600 mb-4" />
             <h3 className="text-lg font-semibold text-white">No hay contratos para mostrar</h3>
             <p className="text-neutral-500 mt-2 max-w-sm">
                En esta pestaña verás los contratos con estado "{filter === 'all' ? 'cualquiera' : filter}". 
                Si crees que falta algo, consultalo con el artista.
             </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {pageSlice.map((c) => (
              <li key={c.id}>
                <ContractCard
                  c={c}
                  isSelected={selectedIds.has(c.id)}
                  onToggle={toggleSelection}
                  onPaymentSuccess={() => {
                    setGroupSelectedIds((prev) => { const n = new Set(prev); n.delete(c.id); return n; });
                    void refetch();
                  }}
                  onCancelled={() => {
                    setGroupSelectedIds((prev) => { const n = new Set(prev); n.delete(c.id); return n; });
                    void refetch();
                  }}
                  groupSelected={groupSelectedIds.has(c.id)}
                  onGroupToggle={toggleGroupSelection}
                  onSignTrigger={(id) => {
                    setSelectedIds(new Set([id]));
                    setSignModalOpen(true);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {filtered.length > 0 ? (
        <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <p className="shrink-0 text-sm text-neutral-500">
              Mostrando {pageSlice.length} de {filtered.length} contrato{filtered.length === 1 ? '' : 's'}
            </p>
            <div className="h-px min-w-[1rem] flex-1 bg-neutral-600/50" />
          </div>
          <nav
            className="flex shrink-0 items-center gap-0.5 rounded-full border border-white/10 bg-black/40 px-1 py-1"
            aria-label="Paginación"
          >
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-neutral-400 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              ‹
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]">
              {safePage}
            </span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-neutral-400 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Página siguiente"
            >
              ›
            </button>
          </nav>
        </div>
      ) : null}

      {/* Unified Multi-action sticky bar */}
      {(groupSelectedIds.size > 0 || selectedIds.size > 0) && (
        <div className="sticky bottom-6 z-40 mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#0a0c10]/90 p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="flex flex-col divide-y divide-white/5">
            
            {/* Signing Section */}
            {selectedIds.size > 0 && (
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <FiEdit3 className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-lg font-bold text-white">Firma masiva</p>
                    <p className="text-sm text-neutral-400">
                      <span className="font-bold text-accent">{selectedIds.size}</span> contrato{selectedIds.size === 1 ? '' : 's'} seleccionado{selectedIds.size === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="rounded-full px-5 py-2.5 text-sm font-medium text-neutral-400 transition hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignModalOpen(true)}
                    disabled={isSigning}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(0,204,203,0.3)] transition hover:scale-[1.02] hover:bg-[#33e8dc] active:scale-[0.98] disabled:opacity-50"
                  >
                    <FiEdit3 className="h-4 w-4" />
                    {isSigning ? 'Firmando...' : 'Firmar ahora'}
                  </button>
                </div>
              </div>
            )}

            {/* Payment Section */}
            {groupSelectedIds.size > 0 && (
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#38BACC]/10 text-[#38BACC]">
                    <FiCreditCard className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-lg font-bold text-white">Pago masivo</p>
                    <p className="text-sm text-neutral-400">
                      Total a pagar: <span className="font-bold text-[#38BACC]">{formatUsd(groupTotal)}</span> ({groupSelectedIds.size} items)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGroupSelectedIds(new Set())}
                    className="rounded-full px-5 py-2.5 text-sm font-medium text-neutral-400 transition hover:text-white"
                  >
                    Limpiar
                  </button>
                  {groupSelectedIds.size === 1 ? (
                    (() => {
                      const single = groupSelectedContracts[0];
                      return (
                        <PaymentezCheckoutButton
                          amount={single?.financials?.totalAmount || 0}
                          description={`Pago contrato - ${single?.eventDetails?.name || 'Servicio'}`}
                          devReference={single?.id || ''}
                          className="rounded-full bg-[#38BACC] px-8 py-3.5 text-sm font-bold text-black transition hover:scale-[1.02] hover:bg-[#45d1e4]"
                          onSuccess={() => {
                            setGroupSelectedIds(new Set());
                            void refetch();
                          }}
                          onFailure={(detail) => alert(`Pago rechazado: ${detail}`)}
                          onError={(err) => alert(`Error en el pago: ${err}`)}
                        >
                          Pagar ahora
                        </PaymentezCheckoutButton>
                      );
                    })()
                  ) : (
                    <GroupPaymentButton
                      contractIds={[...groupSelectedIds]}
                      className="rounded-full bg-[#38BACC] px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(56,186,204,0.3)] transition hover:scale-[1.02] hover:bg-[#45d1e4]"
                      onSuccess={() => {
                        setGroupSelectedIds(new Set());
                        void refetch();
                      }}
                      onFailure={(detail) => alert(`Pago rechazado: ${detail}`)}
                      onError={(err) => alert(`Error en el pago: ${err}`)}
                    >
                      Pagar juntos
                    </GroupPaymentButton>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`space-y-3 ${filtered.length > 0 ? 'mt-10' : 'mt-12'}`}>
        <button
          type="button"
          onClick={() => void refetch()}
          title="Volver a cargar tus contratos desde el servidor"
          className="w-full rounded-2xl border border-accent/40 bg-white/5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Actualizar Lista
        </button>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-neutral-400">
          <FiShield className="shrink-0 text-emerald-500" aria-hidden />
          Tus datos serán registrados de forma segura.
        </p>
      </div>

      <ClientContractSigningModal
        isOpen={signModalOpen}
        onClose={() => setSignModalOpen(false)}
        artistParty={{
          name: 'Múltiples Artistas',
          roleLabel: 'Artistas',
          signed: true, // assume base confirmation
          initials: 'MA',
        }}
        clientParty={{
          name: user?.displayName || user?.email || 'Cliente',
          roleLabel: 'Tu firma',
          signed: false,
          avatarUrl: user?.photoURL || undefined,
        }}
        summary={{
          event: `Bloque de ${selectedIds.size} contratos`,
          dateLabel: 'Varias fechas',
          location: 'Varios destinos',
          totalValue: 'Según selección',
          duration: 'Múltiple',
          service: 'Varios servicios',
        }}
        onSign={async ({ dataUrl }) => {
          if (!user || !isBackendRoleCliente(user.role)) return;
          setIsSigning(true);
          try {
            const selectedRows = contracts.filter((c) => selectedIds.has(c.id));
            const lines = selectedRows.map((c) => ({
              id: c.id,
              artistId: c.artistId || '',
              serviceId: c.serviceId || '',
              serviceName: c.eventDetails?.name || 'Servicio',
              price: c.financials?.totalAmount || 0,
              selectedDateKeys: [], // will be handled by backend usually
              addedAt: new Date().toISOString(),
              artistDisplayName: c.artistDisplayName || 'Artista',
            }));

            await persistSignedClientContractsWithApiFallback(lines, {
              dataUrl,
              applyToAll: true,
            });

            appendContractSignedPendingArtistNotifications(
              selectedRows.map((c) => ({
                artistId: c.artistId || '',
                artistDisplayName: c.artistDisplayName || 'Artista',
                serviceName: c.eventDetails?.name || 'Servicio',
                lineId: c.id,
              })),
            );

            setSelectedIds(new Set());
            await refetch();
          } catch (err) {
            console.error('Bulk sign error:', err);
          } finally {
            setIsSigning(false);
            setSignModalOpen(false);
          }
        }}
      />
    </>
  );

  return (
    <ClientAreaPageShell>
      <ClientAreaHeader showSearch={false} className="mb-2" />

      <div className="mx-auto w-full max-w-6xl pb-12 sm:pb-16">
        {error ? (
          <div className="mt-6 flex flex-col items-center gap-4 py-12 rounded-3xl border border-red-500/20 bg-red-500/5 text-center">
            <FiAlertCircle size={40} className="text-red-500" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Error de carga</h3>
              <p className="text-sm text-red-300/80 max-w-md mx-auto">{error}</p>
            </div>
            <button 
              onClick={() => void refetch()}
              className="mt-2 rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="mt-6">{contentBlock}</div>
        )}
      </div>

      <ClientFloatingChatButton />
    </ClientAreaPageShell>
  );
}
