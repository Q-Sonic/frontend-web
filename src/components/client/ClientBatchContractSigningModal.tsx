import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCheck,
  FiChevronRight,
  FiEdit3,
  FiFileText,
  FiLock,
  FiRefreshCw,
  FiTrash2,
  FiUpload,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { formatMoney } from '../../helpers/money';
import { acquireBodyScrollLock } from '../../helpers/bodyScrollLock';
import { removeServiceCartLine, type ServiceCartLine } from '../../helpers/clientServiceCart';
import { Button } from '../Button';
import { ClientCartContractDetailModal } from './ClientCartContractDetailModal';
import { ClientConfirmDialog } from './ClientConfirmDialog';

export type ClientBatchContractSigningModalProps = {
  isOpen: boolean;
  onClose: () => void;
  lines: ServiceCartLine[];
  onComplete: (payload: { dataUrl: string; signedLines: ServiceCartLine[] }) => void | Promise<void>;
};

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

function formatDateKeyEsShort(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return key;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function CompactDatePills({ keys }: { keys: string[] }) {
  if (keys.length === 0) {
    return <p className="text-xs text-amber-200/90 md:text-sm">Sin fechas</p>;
  }
  const sorted = [...keys].sort();
  const visible = sorted.slice(0, 3);
  const remaining = Math.max(0, sorted.length - visible.length);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {visible.map((key) => (
        <span
          key={key}
          className="rounded-md border border-[#00d4c8]/25 bg-[#00d4c8]/10 px-2 py-0.5 text-xs font-medium text-[#9cfbf4]"
        >
          {formatDateKeyEsShort(key)}
        </span>
      ))}
      {remaining > 0 ? (
        <span className="rounded-md border border-white/20 bg-white/5 px-2 py-0.5 text-xs font-medium text-white/75">
          +{remaining} más
        </span>
      ) : null}
    </div>
  );
}

function initialsFromName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

function LineCardAvatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="h-14 w-14 shrink-0 rounded-full border-2 border-[#00CCCB]/40 object-cover"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#00CCCB]/40 bg-white/10 text-sm font-semibold text-white">
      {initialsFromName(name)}
    </div>
  );
}

export function ClientBatchContractSigningModal({
  isOpen,
  onClose,
  lines,
  onComplete,
}: ClientBatchContractSigningModalProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [detailLine, setDetailLine] = useState<ServiceCartLine | null>(null);
  const [linePendingRemoval, setLinePendingRemoval] = useState<ServiceCartLine | null>(null);
  /** Firmados en esta sesión (ya quitados del carrito); solo para mostrar estado en el modal. */
  const [signedSessionLines, setSignedSessionLines] = useState<ServiceCartLine[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const signingSessionStartedRef = useRef(false);

  const clientName =
    user?.displayName?.trim() || user?.email?.trim() || 'Cliente';

  const pendingCount = lines.length;
  const signedCount = signedSessionLines.length;
  const sessionTotal = pendingCount + signedCount;

  const paintSignatureBackground = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = '#bdbdbd';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, height / 2);
      ctx.lineTo(width - 12, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    },
    [],
  );

  const fitCanvasToContainer = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = wrap.getBoundingClientRect();
    if (width < 8 || height < 8) return;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    paintSignatureBackground(ctx, width, height, dpr);
    setHasSignature(false);
  }, [paintSignatureBackground]);

  useEffect(() => {
    if (!isOpen) {
      signingSessionStartedRef.current = false;
      setDetailLine(null);
      setLinePendingRemoval(null);
      setSignedSessionLines([]);
      setSelectedIds(new Set());
      return;
    }
    if (!signingSessionStartedRef.current) {
      signingSessionStartedRef.current = true;
      setSelectedIds(new Set(lines.map((l) => l.id)));
      setSignedSessionLines([]);
    }
  }, [isOpen, lines]);

  useEffect(() => {
    if (!isOpen) return;
    const inCart = new Set(lines.map((l) => l.id));
    setSelectedIds((prev) => new Set([...prev].filter((id) => inCart.has(id))));
  }, [lines, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setTermsAccepted(false);
    setHasSignature(false);
    setSigning(false);
    const id = requestAnimationFrame(() => fitCanvasToContainer());
    return () => cancelAnimationFrame(id);
  }, [isOpen, fitCanvasToContainer]);

  useEffect(() => {
    if (!isOpen) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => fitCanvasToContainer());
    ro.observe(wrap);
    window.addEventListener('resize', fitCanvasToContainer);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fitCanvasToContainer);
    };
  }, [isOpen, fitCanvasToContainer]);

  useEffect(() => {
    if (!isOpen) return;
    return acquireBodyScrollLock();
  }, [isOpen]);

  const canvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return {
      x: (e.clientX - rect.left) * (canvas.width / dpr / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / dpr / rect.height),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = canvasCoords(e);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastRef.current) return;
    const p = canvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
    setHasSignature(true);
  };

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawingRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    drawingRef.current = false;
    lastRef.current = null;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = wrap.getBoundingClientRect();
    paintSignatureBackground(ctx, width, height, dpr);
    setHasSignature(false);
  };

  const onUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = wrap.getBoundingClientRect();
      paintSignatureBackground(ctx, width, height, dpr);

      const pad = 16;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const maxW = width - pad * 2;
      const maxH = height - pad * 2;
      const scale = Math.min(maxW / iw, maxH / ih, 1);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (width - dw) / 2;
      const dy = (height - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setHasSignature(true);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  const handleSign = async () => {
    if (!hasSignature || !termsAccepted) return;
    const toSign = lines.filter((l) => selectedIds.has(l.id));
    if (toSign.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const remaining = lines.filter((l) => !toSign.some((t) => t.id === l.id));
    setSigning(true);
    try {
      await onComplete({ dataUrl, signedLines: toSign });
      setSignedSessionLines((s) => [...s, ...toSign]);
      setSelectedIds(new Set(remaining.map((l) => l.id)));
      setTermsAccepted(false);
      setHasSignature(false);
      requestAnimationFrame(() => fitCanvasToContainer());
    } finally {
      setSigning(false);
    }
  };

  const confirmRemoveLine = useCallback(() => {
    if (!linePendingRemoval) return;
    removeServiceCartLine(linePendingRemoval.id);
    setDetailLine((prev) => (prev?.id === linePendingRemoval.id ? null : prev));
    setLinePendingRemoval(null);
  }, [linePendingRemoval]);

  const selectedSignValueLabel = useMemo(() => {
    let sum = 0;
    for (const line of lines) {
      if (!selectedIds.has(line.id)) continue;
      const n = line.selectedDateKeys.length;
      sum += line.price * (n > 0 ? n : 1);
    }
    return `$ ${formatMoney(sum)} USD`;
  }, [lines, selectedIds]);

  const cartPendingValueLabel = useMemo(() => {
    let sum = 0;
    for (const line of lines) {
      const n = line.selectedDateKeys.length;
      sum += line.price * (n > 0 ? n : 1);
    }
    return `$ ${formatMoney(sum)} USD`;
  }, [lines]);

  const hasSelectedPending = useMemo(
    () => [...selectedIds].some((id) => lines.some((l) => l.id === id)),
    [lines, selectedIds],
  );

  const selectedPendingCount = useMemo(
    () => [...selectedIds].filter((id) => lines.some((l) => l.id === id)).length,
    [lines, selectedIds],
  );

  if (!isOpen) return null;

  if (lines.length === 0 && signedSessionLines.length === 0) {
    return (
      <div
        className={
          'fixed inset-0 z-[80] flex items-end justify-center bg-black/75 ' +
          'pt-[max(0.25rem,env(safe-area-inset-top,0px))] sm:items-center sm:bg-black/70 sm:p-6'
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-contract-signing-title"
      >
        <div
          className={
            'w-full max-w-md border-[#00CCCB]/35 bg-[#111214] ' +
            'rounded-t-2xl border-x border-t border-b-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 shadow-[0_-8px_40px_rgba(0,0,0,0.35)] ' +
            'max-md:mx-auto max-md:max-w-[calc(100vw-1.25rem)] ' +
            'sm:rounded-3xl sm:border sm:px-6 sm:pb-6 sm:pt-6 sm:shadow-none md:p-8'
          }
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="touch-manipulation inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/20 p-2.5 text-white/70 transition hover:text-white"
              aria-label="Cerrar"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          <div className="-mt-2 text-center">
            <h2
              id="batch-contract-signing-title"
              className="text-lg font-semibold tracking-tight text-white sm:text-xl md:text-2xl"
            >
              Carrito de reservas
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base md:text-base">
              Tu carrito está vacío. Elige fechas en la página de un servicio y pulsa &quot;Añadir al carrito&quot; para
              guardarlas aquí.
            </p>
            <Button type="button" fullWidth className="mt-6 min-h-12 touch-manipulation py-3" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div
      className={
        'fixed inset-0 z-[80] flex items-end justify-center bg-black/75 ' +
        'pt-[max(0.25rem,env(safe-area-inset-top,0px))] sm:items-center sm:bg-black/70 sm:p-6'
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-contract-signing-title"
    >
      <div
        className={
          `max-h-[min(96dvh,900px)] w-full max-w-3xl overflow-y-auto overscroll-y-contain border-[#00CCCB]/35 bg-[#111214] ` +
          `rounded-t-2xl border-x border-t border-b-0 shadow-[0_-8px_40px_rgba(0,0,0,0.35)] ` +
          `px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 xl:max-w-4xl ` +
          `max-md:mx-auto max-md:max-w-[calc(100vw-1.25rem)] ` +
          `sm:max-h-[min(92dvh,900px)] sm:rounded-3xl sm:border sm:shadow-none sm:p-6 md:p-8 ` +
          `${subtleScrollbarClass}`
        }
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/20 p-2.5 text-white/70 transition hover:text-white"
            aria-label="Cerrar"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="-mt-2 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00CCCB]/15 text-[#00CCCB] sm:h-14 sm:w-14 md:h-16 md:w-16">
            <FiFileText className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
          </div>
          <h2
            id="batch-contract-signing-title"
            className="mt-3 px-2 text-lg font-semibold tracking-tight text-white sm:mt-4 sm:text-2xl md:text-3xl"
          >
            Firma de contrato
          </h2>
          <p className="mt-2 max-w-lg px-2 text-sm leading-relaxed text-white/60 sm:px-1 sm:text-base md:text-lg">
            Revisa los detalles y firma para confirmar el acuerdo
          </p>
          <p className="mt-3 text-sm font-medium text-[#00CCCB] sm:text-base md:text-base">
            Contratos en esta sesión{' '}
            <span className="tabular-nums text-white">{sessionTotal}</span>
          </p>
          <p className="mt-1 text-sm text-white/50 sm:text-xs md:text-sm">
            <span className="text-emerald-400/90">{signedCount} firmados</span>
            <span className="text-white/35"> · </span>
            <span className="text-amber-200/80">{pendingCount} pendientes</span>
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {lines.map((line) => {
            const artistName = line.artistDisplayName?.trim() || 'Artista';
            const location = line.locationLabel?.trim() || 'Por definir';
            const selected = selectedIds.has(line.id);
            const toggleLineSelection = () => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(line.id)) next.delete(line.id);
                else next.add(line.id);
                return next;
              });
            };
            const cardBase =
              'flex flex-col gap-4 rounded-2xl p-4 transition sm:flex-row sm:items-start sm:justify-between sm:gap-4 md:p-5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#00d4c8]/60';
            const cardSelected =
              'z-[1] ring-1 ring-[#00d4c8] bg-[#00d4c8]/18 shadow-[0_0_16px_rgba(0,212,200,0.22)]';
            const cardIdle =
              'border border-[#00CCCB]/35 bg-white/[0.04] hover:bg-white/[0.07]';
            return (
              <div
                key={line.id}
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                aria-label={
                  selected
                    ? `${artistName}, incluido en esta firma. Pulsa para quitar.`
                    : `${artistName}, no incluido en esta firma. Pulsa para incluir.`
                }
                onClick={toggleLineSelection}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleLineSelection();
                  }
                }}
                className={`${cardBase} ${selected ? cardSelected : cardIdle}`}
              >
                <div className="flex min-w-0 flex-1 gap-4 pointer-events-none">
                  <LineCardAvatar name={artistName} photoUrl={line.artistPhotoUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{artistName}</p>
                    <p className="mt-1 text-sm text-white/55">{line.serviceName}</p>
                    <p className="mt-2 text-sm text-white/70">
                      <span className="text-white/45">Fechas ({line.selectedDateKeys.length}): </span>
                    </p>
                    <CompactDatePills keys={line.selectedDateKeys} />
                    <p className="mt-0.5 text-sm text-white/70">
                      <span className="text-white/45">Ubicación: </span>
                      {location}
                    </p>
                  </div>
                </div>
                <div
                  className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[148px] pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setDetailLine(line)}
                    className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-1 rounded-full bg-[#00CCCB]/15 px-4 py-2.5 text-sm font-semibold text-[#00CCCB] transition hover:bg-[#00CCCB]/25 sm:min-h-0 sm:w-auto"
                  >
                    Ver detalle
                    <FiChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinePendingRemoval(line)}
                    className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-full border border-red-400/35 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:border-red-400/50 hover:bg-red-500/15 sm:min-h-0 sm:w-auto"
                  >
                    <FiTrash2 className="h-4 w-4 shrink-0" aria-hidden />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
          {signedSessionLines.map((line) => {
            const artistName = line.artistDisplayName?.trim() || 'Artista';
            return (
              <div
                key={`signed-card-${line.id}`}
                className="flex flex-col gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 md:p-5"
              >
                <div className="flex min-w-0 flex-1 gap-4">
                  <LineCardAvatar name={artistName} photoUrl={line.artistPhotoUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{artistName}</p>
                    <p className="mt-1 text-sm text-white/55">{line.serviceName}</p>
                    <p className="mt-2 text-sm text-emerald-300/90">
                      Firmado en esta sesión
                    </p>
                  </div>
                </div>
                <div className="flex w-full shrink-0 sm:w-auto sm:min-w-[148px] sm:items-start sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setDetailLine(line)}
                    className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 sm:min-h-0 sm:w-auto"
                  >
                    Ver detalle
                    <FiChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {lines.length > 0 ? (
          <div className="mt-5 flex min-h-11 flex-wrap items-center justify-start gap-x-3 gap-y-2 rounded-xl border border-[#00CCCB]/40 bg-black/25 px-3 py-2.5 touch-manipulation md:px-4">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set(lines.map((l) => l.id)))}
              className="min-h-11 text-left text-sm font-semibold text-[#00CCCB] transition hover:text-[#33e8dc] sm:min-h-0"
            >
              Seleccionar todos los contratos
            </button>
            <span className="select-none text-sm text-white/25" aria-hidden>
              |
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="min-h-11 text-left text-sm font-semibold text-white/55 transition hover:text-white/80 sm:min-h-0"
            >
              Quitar selecciones
            </button>
          </div>
        ) : null}
        {!hasSelectedPending && pendingCount > 0 ? (
          <p className="mt-2 text-sm text-amber-200/90">
            Incluye al menos un contrato para firmar.
          </p>
        ) : null}

        <div className="mt-5 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/40 sm:text-xs">Estado por contrato</p>
          {signedSessionLines.map((line) => {
            const artistName = line.artistDisplayName?.trim() || 'Artista';
            const location = line.locationLabel?.trim() || 'Por definir';
            return (
              <div
                key={`status-signed-${line.id}`}
                className="flex flex-col gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white md:text-base">Contrato con {artistName}</p>
                  <p className="mt-1 text-xs text-white/50 md:text-sm">
                    Fechas ({line.selectedDateKeys.length}):
                  </p>
                  <CompactDatePills keys={line.selectedDateKeys} />
                  <p className="text-xs text-white/50 md:text-sm">Ubicación: {location}</p>
                </div>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-emerald-500/55 bg-emerald-950/70 px-3 py-1.5 text-xs font-semibold text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                  Firmado
                  <FiCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                </span>
              </div>
            );
          })}
          {lines.map((line) => {
            const artistName = line.artistDisplayName?.trim() || 'Artista';
            const location = line.locationLabel?.trim() || 'Por definir';
            return (
              <div
                key={`status-${line.id}`}
                className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white md:text-base">Contrato con {artistName}</p>
                  <p className="mt-1 text-xs text-white/50 md:text-sm">
                    Fechas ({line.selectedDateKeys.length}):
                  </p>
                  <CompactDatePills keys={line.selectedDateKeys} />
                  <p className="text-xs text-white/50 md:text-sm">Ubicación: {location}</p>
                </div>
                <div className="flex flex-wrap items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set([line.id]))}
                    className="inline-flex w-fit items-center gap-1.5 rounded-md border border-amber-500/55 bg-amber-950/55 px-3 py-1.5 text-xs font-semibold text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.12)] transition hover:border-amber-400/70 hover:bg-amber-950/75"
                  >
                    Firmar
                    <FiEdit3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:mt-5 sm:rounded-2xl sm:p-5 md:p-7">
          <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold text-white sm:text-base md:text-lg">
              Tu firma electrónica
            </span>
            <label className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#00CCCB]/40 bg-[#00CCCB]/10 px-4 py-3 text-sm font-medium text-[#00CCCB] transition hover:bg-[#00CCCB]/15 touch-manipulation sm:inline-flex sm:w-auto sm:justify-start sm:py-2.5 md:px-5 md:text-base">
              <FiUpload className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
              Subir firma (PNG/JPG)
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={onUploadSignature}
              />
            </label>
          </div>

          <div
            ref={wrapRef}
            className="relative h-52 w-full min-h-[13rem] overflow-hidden rounded-xl border border-white/15 sm:h-44 md:h-52"
          >
            <canvas
              ref={canvasRef}
              className="touch-none block h-full w-full cursor-crosshair"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              onPointerLeave={endStroke}
            />
            {!hasSignature && (
              <p className="pointer-events-none absolute inset-0 flex items-end justify-center pb-4 text-sm text-neutral-500 md:text-base">
                Dibuja tu firma dentro del área
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={clearSignature}
            className="mt-3 inline-flex min-h-11 touch-manipulation items-center gap-2 py-1 text-sm font-medium text-[#00CCCB] hover:underline md:text-base"
          >
            <FiRefreshCw className="h-4 w-4" />
            Limpiar firma
          </button>

          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-xs text-white/70 sm:mt-5 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">Resumen</p>
            <p className="mt-1 text-white">
              Cliente: <span className="font-medium text-[#00CCCB]">{clientName}</span>
            </p>
            <p className="mt-1">
              Esta firma ({selectedPendingCount}{' '}
              contrato{selectedPendingCount === 1 ? '' : 's'}
              ):{' '}
              <span className="font-semibold text-[#00CCCB]">{selectedSignValueLabel}</span>
            </p>
            {pendingCount > 0 ? (
              <p className="mt-1 text-white/55">
                Pendiente en carrito (total):{' '}
                <span className="font-medium text-white/75">{cartPendingValueLabel}</span>
              </p>
            ) : null}
          </div>

          <label className="mt-4 flex min-h-[3rem] cursor-pointer items-start gap-3 rounded-lg py-1 text-sm leading-snug text-white/80 touch-manipulation sm:mt-5 sm:text-base md:text-lg">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-6 w-6 shrink-0 rounded border-white/30 bg-transparent accent-[#00CCCB] sm:mt-1 sm:h-5 sm:w-5"
            />
            <span className="pt-0.5">
              Acepto los{' '}
              <Link
                to="/terms-contract"
                className="text-accent underline-offset-2 hover:underline"
                target="_blank"
              >
                términos del contrato
              </Link>{' '}
              y confirmo mi firma electrónica.
            </span>
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:gap-4">
          <Button
            type="button"
            variant="outline"
            fullWidth
            className="touch-manipulation min-h-12 border-[#00CCCB]/50 py-3 text-base sm:min-h-0 md:py-3.5 md:text-lg"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <div className="relative flex-1 group">
            <Button
              type="button"
              fullWidth
              loading={signing}
              disabled={
                !hasSignature ||
                !termsAccepted ||
                pendingCount === 0 ||
                !hasSelectedPending
              }
              className="touch-manipulation min-h-12 py-3 text-base sm:min-h-0 md:py-3.5 md:text-lg"
              onClick={() => void handleSign()}
              leftIcon={<FiEdit3 className="h-5 w-5" />}
            >
              Firma contratos
            </Button>
            
            {(!hasSignature || !termsAccepted || !hasSelectedPending) && pendingCount > 0 && !signing && (
              <div className="pointer-events-none absolute bottom-full left-0 mb-3 w-64 translate-y-2 rounded-xl bg-black border border-white/10 p-3 text-xs text-white opacity-0 shadow-2xl transition-all group-hover:translate-y-0 group-hover:opacity-100 z-50">
                <p className="font-semibold text-amber-400 mb-1">Para continuar:</p>
                <ul className="space-y-1 text-white/70">
                  {!hasSelectedPending && <li>• Selecciona al menos un contrato</li>}
                  {!hasSignature && <li>• Dibuja o sube tu firma</li>}
                  {!termsAccepted && <li>• Acepta los términos y condiciones</li>}
                </ul>
                <div className="absolute -bottom-1 left-6 h-2 w-2 rotate-45 border-b border-r border-white/10 bg-black" />
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 flex items-start justify-center gap-2 px-1 text-center text-xs leading-relaxed text-white/45 sm:mt-5 sm:items-center sm:text-sm md:text-base">
          <FiLock className="mt-0.5 h-4 w-4 shrink-0 text-white/35 sm:mt-0 md:h-5 md:w-5" />
          Documento seguro y legalmente vinculable
        </p>

        <div className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-3 text-xs leading-relaxed text-emerald-100/90 sm:mt-5 sm:rounded-xl sm:px-4 sm:py-4 sm:text-sm md:px-5 md:text-base">
          <div className="flex gap-3">
            <FiCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400 md:h-6 md:w-6" />
            <p>
              Una vez firmado por ambas partes, el contrato quedará confirmado. Recibirás una copia por email y en tu
              panel de reservas.
            </p>
          </div>
        </div>
      </div>
    </div>
    <ClientCartContractDetailModal
      isOpen={detailLine !== null}
      line={detailLine}
      onClose={() => setDetailLine(null)}
    />
    <ClientConfirmDialog
      isOpen={linePendingRemoval !== null}
      title="Eliminar servicio"
      message="¿Seguro que desea eliminar este servicio?"
      cancelLabel="Cancelar"
      confirmLabel="Eliminar"
      confirmVariant="danger"
      onCancel={() => setLinePendingRemoval(null)}
      onConfirm={confirmRemoveLine}
    />
    </>
  );
}
