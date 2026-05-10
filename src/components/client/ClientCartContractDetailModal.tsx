import { useEffect, useMemo } from 'react';
import { FiCheck, FiCpu, FiEye, FiX } from 'react-icons/fi';
import { formatMoney } from '../../helpers/money';
import { acquireBodyScrollLock } from '../../helpers/bodyScrollLock';
import type { ServiceCartLine } from '../../helpers/clientServiceCart';
import { Button } from '../Button';

const subtleScrollbarClass =
  'scrollbar-thin [scrollbar-color:rgba(255,255,255,0.20)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30';

function formatDateKeyEsLong(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return key;
  const dt = new Date(y, m - 1, d);
  const raw = dt.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function initialsFromName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

function splitFeatures(features: string[]): { conditions: string[]; requirements: string[] } {
  if (features.length === 0) {
    return { conditions: [], requirements: [] };
  }
  if (features.length === 1) {
    return { conditions: features, requirements: [] };
  }
  const mid = Math.ceil(features.length / 2);
  return {
    conditions: features.slice(0, mid),
    requirements: features.slice(mid),
  };
}

const DEFAULT_CONDITIONS: string[] = [
  'El artista debe presentarse puntualmente',
  'Cancelaciones con 48h de anticipación',
  'Penalización por incumplimiento',
];

const DEFAULT_REQUIREMENTS: string[] = [
  'Sonido básico incluido',
  'Espacio mínimo requerido',
];

function formatUpdatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export type ClientCartContractDetailModalProps = {
  isOpen: boolean;
  line: ServiceCartLine | null;
  onClose: () => void;
};

function MoneyRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <span className={`text-sm md:text-base ${emphasize ? 'font-semibold text-white' : 'text-[#00CCCB]'}`}>
        {label}
      </span>
      <span
        className={`shrink-0 tabular-nums text-sm md:text-base ${emphasize ? 'font-semibold text-white' : 'text-white'}`}
      >
        {value}
      </span>
    </div>
  );
}

function CheckList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="border-t border-white/10 pt-5">
      <h3 className="text-sm font-semibold text-[#00CCCB] md:text-base">{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((text, i) => (
          <li key={`${i}-${text.slice(0, 48)}`} className="flex gap-2.5 text-sm text-white/85 md:text-base">
            <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
            <ConditionLine text={text} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function openPdfInNewTab(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function DocumentsSection({
  contractPdfUrl,
  technicalRiderPdfUrl,
}: {
  contractPdfUrl?: string;
  technicalRiderPdfUrl?: string;
}) {
  const hasContract = Boolean(contractPdfUrl?.trim());
  const hasRider = Boolean(technicalRiderPdfUrl?.trim());
  if (!hasContract && !hasRider) return null;
  return (
    <div className="border-t border-white/10 pt-5 pb-6">
      <h3 className="text-sm font-semibold text-[#00CCCB] md:text-base">Documentos</h3>
      <div className="mt-3 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-2.5">
        {hasContract ? (
          <Button
            type="button"
            variant="secondary"
            className="touch-manipulation min-h-12 w-full shrink-0 justify-center px-4 py-3 text-sm sm:w-auto md:px-4 md:text-sm"
            onClick={() => openPdfInNewTab(contractPdfUrl!)}
          >
            <FiEye className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Ver contrato
          </Button>
        ) : null}
        {hasRider ? (
          <Button
            type="button"
            variant="secondary"
            className="touch-manipulation min-h-12 w-full shrink-0 justify-center px-4 py-3 text-sm sm:w-auto md:px-4 md:text-sm"
            onClick={() => openPdfInNewTab(technicalRiderPdfUrl!)}
          >
            <FiCpu className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Rider técnico
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Highlights known tokens like "48h" or "requerido" in teal. */
function ConditionLine({ text }: { text: string }) {
  if (text.includes('48h')) {
    const parts = text.split(/(48h)/g);
    return (
      <span className="leading-snug">
        {parts.map((part) =>
          part === '48h' ? (
            <span key={part} className="font-medium text-[#00CCCB]">
              48h
            </span>
          ) : (
            <span key={part}>{part}</span>
          ),
        )}
      </span>
    );
  }
  if (text.toLowerCase().includes('requerido')) {
    const idx = text.toLowerCase().indexOf('requerido');
    const before = text.slice(0, idx);
    const word = text.slice(idx, idx + 'requerido'.length);
    const after = text.slice(idx + 'requerido'.length);
    return (
      <span className="leading-snug">
        {before}
        <span className="font-medium text-[#00CCCB]">{word}</span>
        {after}
      </span>
    );
  }
  return <span className="leading-snug">{text}</span>;
}

export function ClientCartContractDetailModal({ isOpen, line, onClose }: ClientCartContractDetailModalProps) {
  const pricing = useMemo(() => {
    if (!line) return null;
    const n = line.selectedDateKeys.length;
    const dateCount = n;
    const subtotal = n > 0 ? line.price * n : 0;
    return { dateCount, subtotal };
  }, [line]);

  const { conditions, requirements } = useMemo(() => {
    const raw = line?.serviceFeatures?.filter((s) => s.trim()) ?? [];
    if (raw.length === 0) {
      return { conditions: DEFAULT_CONDITIONS, requirements: DEFAULT_REQUIREMENTS };
    }
    return splitFeatures(raw);
  }, [line?.serviceFeatures]);

  const sortedDateKeys = useMemo(() => (line ? [...line.selectedDateKeys].sort() : []), [line]);

  useEffect(() => {
    if (!isOpen || !line) return;
    return acquireBodyScrollLock();
  }, [isOpen, line]);

  const primaryDateLabel = useMemo(() => {
    if (sortedDateKeys.length === 0) return '—';
    if (sortedDateKeys.length === 1) return formatDateKeyEsLong(sortedDateKeys[0]!);
    return `${sortedDateKeys.length} fechas (detalle abajo)`;
  }, [sortedDateKeys]);

  if (!isOpen || !line || !pricing) return null;

  const artistName = line.artistDisplayName?.trim() || 'Artista';
  const location = line.locationLabel?.trim() || 'Por definir';

  return (
    <div
      className={
        'fixed inset-0 z-[90] flex items-end justify-center bg-black/85 ' +
        'pt-[max(0.25rem,env(safe-area-inset-top,0px))] sm:items-center sm:bg-black/80 sm:p-6'
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-contract-detail-title"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={
          `max-h-[min(96dvh,820px)] w-full max-w-lg overflow-y-auto overscroll-y-contain border-[#00CCCB]/40 bg-[#0f1012] shadow-2xl ` +
          `rounded-t-2xl border-x border-t border-b-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 ` +
          `max-md:mx-auto max-md:max-w-[calc(100vw-1.25rem)] ` +
          `sm:max-h-[min(90dvh,820px)] sm:rounded-3xl sm:border sm:p-5 md:p-7 ` +
          `${subtleScrollbarClass}`
        }
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/20 p-2 text-white/70 transition hover:text-white active:opacity-90"
            aria-label="Cerrar detalle"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <h2
          id="cart-contract-detail-title"
          className="-mt-1 text-center text-lg font-semibold tracking-tight text-white sm:text-xl md:text-2xl"
        >
          Detalle del contrato
        </h2>

        <div className="mt-5 flex gap-3 border-b border-white/10 pb-5 sm:mt-6 sm:gap-4 sm:pb-6">
          {line.artistPhotoUrl ? (
            <img
              src={line.artistPhotoUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full border-2 border-[#00CCCB]/35 object-cover md:h-[4.5rem] md:w-[4.5rem]"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#00CCCB]/35 bg-white/10 text-base font-semibold text-white md:h-[4.5rem] md:w-[4.5rem]">
              {initialsFromName(artistName)}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1 text-sm md:text-base">
            <p className="font-semibold text-white">{artistName}</p>
            <p className="text-white/70">
              <span className="text-white/45">Evento: </span>
              {line.serviceName}
            </p>
            <p className="text-white/70">
              <span className="text-white/45">Fecha: </span>
              {primaryDateLabel}
            </p>
            <p className="text-white/70">
              <span className="text-white/45">Ubicación: </span>
              {location}
            </p>
          </div>
        </div>

        <div className="border-b border-white/10 py-1">
          <p className="py-2 text-sm text-white/80 md:text-base">
            <span className="font-medium text-[#00CCCB]">Número de fechas: </span>
            <span className="tabular-nums text-white">{pricing.dateCount}</span>
          </p>
          {sortedDateKeys.length > 0 ? (
            <ul className="space-y-2 pb-3">
              {sortedDateKeys.map((key) => (
                <li
                  key={key}
                  className="flex gap-2 text-sm text-white/85 md:text-base"
                >
                  <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  <span>{formatDateKeyEsLong(key)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pb-3 text-sm text-amber-200/90">No hay fechas en esta línea.</p>
          )}
        </div>

        <div className="py-2">
          <MoneyRow label="Servicio:" value={`$ ${formatMoney(pricing.subtotal)} USD`} />
          <MoneyRow label="Total:" value={`$ ${formatMoney(pricing.subtotal)} USD`} emphasize />
        </div>

        <DocumentsSection
          contractPdfUrl={line.contractPdfUrl}
          technicalRiderPdfUrl={line.technicalRiderPdfUrl}
        />

        <CheckList title="Condiciones" items={conditions} />
        <CheckList title="Requerimientos" items={requirements} />

        <p className="mt-6 text-center text-xs text-white/40 md:text-sm">
          Última actualización: {formatUpdatedAt(line.addedAt)}
        </p>
      </div>
    </div>
  );
}
