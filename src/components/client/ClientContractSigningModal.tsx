import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  FiCheck,
  FiCpu,
  FiEdit3,
  FiEye,
  FiFileText,
  FiLock,
  FiRefreshCw,
  FiUpload,
  FiX,
} from 'react-icons/fi';
import { Button } from '../Button';
import { Link } from 'react-router-dom';
import { acquireBodyScrollLock } from '../../helpers/bodyScrollLock';

export type ContractSigningParty = {
  roleLabel: string;
  name: string;
  signed: boolean;
  avatarUrl?: string;
  initials?: string;
};

export type ContractSummaryFields = {
  event: string;
  dateLabel: ReactNode;
  location: string;
  totalValue: string;
  duration: string;
  service: string;
};

export type ClientContractSigningModalProps = {
  isOpen: boolean;
  onClose: () => void;
  artistParty: ContractSigningParty;
  clientParty: ContractSigningParty;
  summary: ContractSummaryFields;
  onViewContract?: () => void;
  onViewTechnicalRider?: () => void;
  /** Called with PNG data URL when the user confirms signature and terms. */
  onSign?: (payload: { dataUrl: string; acceptedTerms: boolean }) => void | Promise<void>;
};

const subtleScrollbarClass =
  'scrollbar-thin [scrollbar-color:rgba(255,255,255,0.20)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30';

function PartyAvatar({ party }: { party: ContractSigningParty }) {
  if (party.avatarUrl) {
    return (
      <img
        src={party.avatarUrl}
        alt=""
        className="h-16 w-16 rounded-full border-2 border-[#00CCCB]/40 object-cover md:h-[4.5rem] md:w-[4.5rem]"
      />
    );
  }
  const letters =
    party.initials?.trim() ||
    party.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') ||
    '?';
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#00CCCB]/40 bg-white/10 text-base font-semibold text-white md:h-[4.5rem] md:w-[4.5rem] md:text-lg">
      {letters}
    </div>
  );
}

export function ClientContractSigningModal({
  isOpen,
  onClose,
  artistParty,
  clientParty,
  summary,
  onViewContract,
  onViewTechnicalRider,
  onSign,
}: ClientContractSigningModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signing, setSigning] = useState(false);

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
    const release = acquireBodyScrollLock();
    return release;
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
    if (!hasSignature || !termsAccepted || !onSign) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSigning(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      await onSign({ dataUrl, acceptedTerms: true });
    } finally {
      setSigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={
        'fixed inset-0 z-[80] flex items-end justify-center bg-black/75 ' +
        'pt-[max(0.25rem,env(safe-area-inset-top,0px))] sm:items-center sm:bg-black/70 sm:p-6'
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-signing-title"
    >
      <div
        className={
          `w-full max-w-3xl max-h-[min(96dvh,900px)] overflow-y-auto overscroll-y-contain border-[#00CCCB]/35 bg-[#111214] ` +
          `rounded-t-2xl border-x border-t border-b-0 shadow-[0_-8px_40px_rgba(0,0,0,0.35)] ` +
          `px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 xl:max-w-4xl ` +
          `sm:max-h-[min(92dvh,900px)] sm:rounded-3xl sm:border sm:shadow-none sm:p-6 md:p-8 ` +
          `${subtleScrollbarClass}`
        }
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/20 p-2.5 text-white/70 transition hover:text-white active:opacity-90"
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
            id="contract-signing-title"
            className="mt-3 text-xl font-semibold tracking-tight text-white sm:mt-4 sm:text-2xl md:text-3xl"
          >
            Firma de contrato
          </h2>
          <p className="mt-2 max-w-md px-1 text-sm leading-relaxed text-white/60 sm:text-base md:text-lg">
            Revisa los detalles y firma para confirmar el acuerdo
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-5 sm:mt-6 sm:rounded-2xl sm:px-5 sm:py-6 md:px-7 md:py-7">
          <div className="flex flex-col items-stretch gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 md:gap-4">
            <div className="flex flex-1 flex-col items-center gap-2 text-center sm:gap-2.5">
              <PartyAvatar party={artistParty} />
              <p className="text-xs text-white/50 sm:text-sm">{artistParty.roleLabel}</p>
              <p className="text-sm font-medium text-white sm:text-base md:text-lg">{artistParty.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 sm:text-sm">
                {artistParty.signed ? (
                  <>
                    <FiCheck className="h-4 w-4" />
                    Firmado
                  </>
                ) : (
                  <span className="text-white/40">Pendiente</span>
                )}
              </div>
            </div>

            <div className="hidden flex-shrink-0 flex-col items-center px-1 pt-2 sm:flex">
              <div className="h-px w-12 border-t border-dashed border-white/20" />
              <div className="my-1.5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#00CCCB]/15 text-[#00CCCB] md:h-14 md:w-14">
                <FiEdit3 className="h-6 w-6" />
              </div>
              <div className="h-px w-12 border-t border-dashed border-white/20" />
            </div>

            <div
              className="flex items-center justify-center gap-3 py-1 sm:hidden"
              aria-hidden
            >
              <span className="h-px min-w-[2.5rem] flex-1 border-t border-dashed border-white/20" />
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00CCCB]/15 text-[#00CCCB]">
                <FiEdit3 className="h-5 w-5" />
              </div>
              <span className="h-px min-w-[2.5rem] flex-1 border-t border-dashed border-white/20" />
            </div>

            <div className="flex flex-1 flex-col items-center gap-2 text-center sm:gap-2.5">
              <PartyAvatar party={clientParty} />
              <p className="text-xs text-white/50 sm:text-sm">{clientParty.roleLabel}</p>
              <p className="text-sm font-medium text-white sm:text-base md:text-lg">{clientParty.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 sm:text-sm">
                {clientParty.signed ? (
                  <>
                    <FiCheck className="h-4 w-4" />
                    Firmado
                  </>
                ) : (
                  <span className="text-white/40">Pendiente</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:mt-5 sm:rounded-2xl sm:p-5 md:p-7">
          <div className="mb-4 flex items-center gap-2.5 text-white">
            <FiFileText className="h-5 w-5 shrink-0 text-[#00CCCB] md:h-6 md:w-6" />
            <span className="text-base font-semibold md:text-lg">Resumen del contrato</span>
          </div>
          <div className="grid grid-cols-1 gap-x-10 gap-y-4 text-base sm:grid-cols-2 md:text-lg">
            <div>
              <p className="text-sm text-white/45 md:text-base">Evento</p>
              <p className="mt-0.5 text-white">{summary.event}</p>
            </div>
            <div>
              <p className="text-sm text-white/45 md:text-base">Fecha</p>
              <div className="mt-0.5 text-white">{summary.dateLabel}</div>
            </div>
            <div>
              <p className="text-sm text-white/45 md:text-base">Ubicación</p>
              <p className="mt-0.5 text-white">{summary.location}</p>
            </div>
            <div>
              <p className="text-sm text-white/45 md:text-base">Valor total</p>
              <p className="mt-0.5 font-semibold text-[#00CCCB]">{summary.totalValue}</p>
            </div>
            <div>
              <p className="text-sm text-white/45 md:text-base">Duración</p>
              <p className="mt-0.5 text-white">{summary.duration}</p>
            </div>
            <div>
              <p className="text-sm text-white/45 md:text-base">Servicio</p>
              <p className="mt-0.5 text-white">{summary.service}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3.5 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4 md:px-5 md:py-4">
            <p className="text-xs leading-relaxed text-white/55 sm:text-sm md:text-base">
              Al firmar, aceptas los términos y condiciones del contrato
            </p>
            {onViewContract || onViewTechnicalRider ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2.5">
                {onViewContract ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="touch-manipulation min-h-12 shrink-0 justify-center py-2.5 text-sm sm:py-2.5 md:py-3 md:text-base"
                    onClick={onViewContract}
                  >
                    <FiEye className="h-4 w-4 md:h-5 md:w-5" />
                    Ver contrato
                  </Button>
                ) : null}
                {onViewTechnicalRider ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="touch-manipulation min-h-12 shrink-0 justify-center px-4 py-2.5 text-xs sm:text-sm md:px-4 md:py-2.5"
                    onClick={onViewTechnicalRider}
                  >
                    <FiCpu className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Rider técnico
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
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
              y confirmo mi firma electrónica
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
          <Button
            type="button"
            fullWidth
            loading={signing}
            disabled={!hasSignature || !termsAccepted || !onSign}
            className="touch-manipulation min-h-12 py-3 text-base sm:min-h-0 md:py-3.5 md:text-lg"
            onClick={() => void handleSign()}
            leftIcon={<FiEdit3 className="h-5 w-5" />}
          >
            Firma contrato
          </Button>
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
  );
}
