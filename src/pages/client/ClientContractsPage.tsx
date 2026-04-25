import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FiCheck, FiChevronRight, FiClock, FiShield, FiXCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Skeleton } from '../../components';
import { ClientAreaHeader } from '../../components/client/ClientAreaHeader';
import { ClientFloatingChatButton } from '../../components/client/ClientFloatingChatButton';
import { ClientAreaPageShell } from '../../components/shared/ClientAreaPageShell';
import { useClientMyContracts } from '../../hooks/useClientMyContracts';
import type {
  ContractEventDetails,
  ContractLifecycleStatus,
  ContractRecord,
} from '../../types/contract';

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
  return s === 'PENDING';
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
      label: 'Pendiente',
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

function ContractCard({ c }: { c: ContractRecord }) {
  const name = displayNameForContract(c);
  const ui = statusUi(c);
  const location = c.eventDetails?.location?.trim() || '—';
  const amount = formatUsd(c.financials?.totalAmount);
  const headline = `${name} - ${amount}`;
  const hasUrl = Boolean(c.contractUrl?.trim());
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
          {showClientSignedNote ? (
            <p className="pt-1 text-xs leading-relaxed text-neutral-500">
              Tu firma ya consta en el sistema. Pendiente la confirmación del artista para marcarlo como firmado al
              100%.
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
  const { contracts, loading, error, refetch } = useClientMyContracts();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

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
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Mis Contratos</h1>
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
        <div className="mb-5 flex items-center gap-3">
          <h2 className="shrink-0 text-base font-semibold text-white sm:text-lg">
            {sectionTitleForFilter(filter, filtered.length)}
          </h2>
          <div className="h-px min-w-[2rem] flex-1 bg-neutral-600/50" />
        </div>

        {filtered.length === 0 ? (
          <p className="mx-auto max-w-2xl py-10 text-center text-sm leading-relaxed text-neutral-500">
            Esta vista quedará vacía hasta que el backend devuelva datos reales. El front ya llama a{' '}
            <span className="font-mono text-[0.8rem] text-neutral-400">GET /contracts/my-history</span> (contrato del
            cliente autenticado): cuando ese endpoint responda con una lista de contratos (id, estado, evento, importe,
            <span className="text-neutral-400"> contractUrl</span>, y opcionalmente nombre y foto del artista), los verás
            aquí y en las pestañas según su estado. Si la respuesta es un array vacío o el endpoint aún no está
            implementado, seguirás viendo este mensaje. Los PDF por servicio del catálogo siguen en el perfil del artista
            → Contratos.
          </p>
        ) : (
          <ul className="space-y-4">
            {pageSlice.map((c) => (
              <li key={c.id}>
                <ContractCard c={c} />
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

      <div className={`space-y-3 ${filtered.length > 0 ? 'mt-10' : 'mt-12'}`}>
        <button
          type="button"
          onClick={() => void refetch()}
          title="Volver a cargar tus contratos desde el servidor"
          className="w-full rounded-2xl border border-accent/40 bg-accent py-3.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(0,204,203,0.22)] transition hover:bg-accent/90"
        >
          Actualizar Firma
        </button>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-neutral-400">
          <FiShield className="shrink-0 text-emerald-500" aria-hidden />
          Tus datos serán registrados de forma segura.
        </p>
      </div>
    </>
  );

  return (
    <ClientAreaPageShell>
      <ClientAreaHeader showSearch={false} className="mb-2" />

      <div className="mx-auto w-full max-w-6xl pb-12 sm:pb-16">
        {loading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="mx-auto h-9 w-52 rounded-lg" />
            <Skeleton className="mx-auto h-px w-48 max-w-full" />
            <Skeleton className="mx-auto h-4 w-72 max-w-full rounded-md" />
            <div className="flex gap-2 overflow-hidden pt-4">
              <Skeleton className="h-10 w-28 shrink-0 rounded-full" />
              <Skeleton className="h-10 w-32 shrink-0 rounded-full" />
              <Skeleton className="h-10 w-28 shrink-0 rounded-full" />
              <Skeleton className="h-10 w-32 shrink-0 rounded-full" />
            </div>
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : error ? (
          <p className="mt-6 text-sm text-red-300/95">{error}</p>
        ) : (
          <div className="mt-6">{contentBlock}</div>
        )}
      </div>

      <ClientFloatingChatButton />
    </ClientAreaPageShell>
  );
}
