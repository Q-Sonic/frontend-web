import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FiCheck, FiChevronRight, FiClock, FiShield, FiXCircle } from 'react-icons/fi';
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
import { paymentService } from '../../api/paymentService';

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
}: {
  c: ContractRecord;
  isSelected?: boolean;
  onToggle?: (id: string, val: boolean) => void;
}) {
  const name = displayNameForContract(c);
  const ui = statusUi(c);
  const location = c.eventDetails?.location?.trim() || '—';
  const amount = formatUsd(c.financials?.totalAmount);
  const headline = `${name} - ${amount}`;
  const hasUrl = Boolean(c.contractUrl?.trim());
  const sourceHasUrl = Boolean(c.sourceContractUrl?.trim());
  const hasSignatureReceipt = Boolean(c.signatureReceiptUrl?.trim());
  const unpaid = c.financials?.paymentStatus === 'UNPAID';
  const artistLink = c.artistId?.trim() ? `/client/artists/${c.artistId}` : null;
  const showClientSignedNote = isPendingStatus(c.status);

  return (
    <article
      className="flex flex-col gap-5 rounded-2xl border border-accent/45 bg-[#141414] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:flex-row sm:items-stretch sm:justify-between sm:gap-8"
      aria-label={headline}
    >
      <div className="flex min-w-0 flex-1 gap-4">
        <ContractAvatar name={name} photoUrl={c.artistPhotoUrl} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-base font-bold leading-snug text-white sm:text-lg">{headline}</p>
          <p className="text-sm text-neutral-500">
            Fecha: <span className="text-neutral-300">{formatEventDateEs(c)}</span>
          </p>
          <p className="text-sm text-neutral-500">
            Ubicación: <span className="text-neutral-300">{location}</span>
          </p>
          <div className={`flex items-center gap-2 pt-0.5 text-sm font-semibold ${ui.lineClass}`}>
            {ui.icon}
            <span>{ui.label}</span>
          </div>
          {unpaid ? <p className="text-xs font-semibold text-amber-300">Pago pendiente (UNPAID)</p> : null}
          {showClientSignedNote ? (
            <p className="pt-1 text-xs leading-relaxed text-neutral-500">
              Tu firma ya consta en el sistema. Pendiente la confirmación del artista para marcarlo como firmado al
              100%.
            </p>
          ) : (
            <p className="pt-1 text-xs leading-relaxed text-accent/80">
              Requiere tu firma electrónica para formalizar la reserva.
            </p>
          )}
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
        {unpaid ? (
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-xl border border-amber-300/40 bg-amber-400/15 py-2.5 text-center text-xs font-semibold text-amber-100 transition hover:bg-amber-400/25"
            onClick={async () => {
              try {
                const amount = c.financials?.totalAmount || 0;
                const desc = `Pago contrato ${c.id} - ${c.eventDetails?.name || 'Servicio'}`;
                const payLink = await paymentService.createLinkToPay({
                  amount,
                  description: desc,
                  dev_reference: c.id,
                });
                const url = payLink?.data?.payment_url;
                if (url) window.location.href = url;
              } catch (err) {
                console.error('Error creating payment link for contract:', err);
              }
            }}
          >
            Pagar ahora
          </button>
        ) : null}
        {artistLink ? (
          <Link to={artistLink} className="text-center text-xs font-medium text-accent/90 hover:text-accent">
            Perfil del artista
          </Link>
        ) : null}
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
  const unpaidCount = useMemo(
    () => contracts.filter((c) => c.financials?.paymentStatus === 'UNPAID').length,
    [contracts],
  );

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
          <div className="mb-5 rounded-2xl border border-amber-300/35 bg-amber-400/10 p-4 text-sm text-amber-100">
            Tienes {unpaidCount} contrato{unpaidCount === 1 ? '' : 's'} con pago pendiente. Mientras esté UNPAID, el
            artista no podrá firmar el contrato final.
          </div>
        ) : null}
        <div className="mb-5 flex items-center gap-3">
          <h2 className="shrink-0 text-base font-semibold text-white sm:text-lg">
            {sectionTitleForFilter(filter, filtered.length)}
          </h2>
          <div className="h-px min-w-[2rem] flex-1 bg-neutral-600/50" />
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

      {selectedIds.size > 0 && filter === 'pending' && (
        <div className="sticky bottom-6 z-30 mt-8 rounded-3xl border border-accent/40 bg-[#0a0c10]/95 p-6 shadow-[0_0_40px_rgba(0,204,203,0.15)] backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">Firma Masiva Seleccionada</p>
              <p className="text-sm text-neutral-400">
                Has seleccionado <span className="font-semibold text-accent">{selectedIds.size}</span> reservas para
                firmar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSignModalOpen(true)}
              disabled={isSigning}
              className="rounded-full bg-accent px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(0,204,203,0.4)] transition hover:bg-[#33e8dc] disabled:opacity-50"
            >
              {isSigning ? 'Firmando...' : 'Firmar seleccionados'}
            </button>
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
