import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiX } from 'react-icons/fi';
import { ApiError, updateArtistService } from '../../api';
import type { ArtistServiceRecord } from '../../types';

export type ArtistDocumentLinkVariant = 'contract' | 'rider';

export type ArtistDocumentLinkServiceModalProps = {
  isOpen: boolean;
  variant: ArtistDocumentLinkVariant;
  fileId: string;
  documentTitle: string;
  services: ArtistServiceRecord[];
  onClose: () => void;
  onSuccess: (message: string) => void;
};

function linkedContractFileId(s: ArtistServiceRecord): string | undefined {
  const v = s.contractId ?? s.contractTemplateId;
  if (v == null || String(v).trim() === '') return undefined;
  return String(v);
}

function linkedRiderFileId(s: ArtistServiceRecord): string | undefined {
  const v = s.technicalRiderId ?? s.technicalRiderTemplateId;
  if (v == null || String(v).trim() === '') return undefined;
  return String(v);
}

type ListBoxMetrics = { top: number; left: number; width: number; maxHeight: number };

function computeListBoxMetrics(trigger: HTMLElement): ListBoxMetrics {
  const rect = trigger.getBoundingClientRect();
  const margin = 10;
  const gap = 6;
  const spaceBelow = window.innerHeight - rect.bottom - margin;
  const spaceAbove = rect.top - margin;
  const openUpward = spaceBelow < 160 && spaceAbove > spaceBelow;
  const rawMax = Math.min(440, Math.max(120, openUpward ? spaceAbove - gap : spaceBelow - gap));
  const maxHeight = Math.floor(rawMax);
  const top = openUpward ? rect.top - gap - maxHeight : rect.bottom + gap;
  let left = rect.left;
  const width = rect.width;
  if (left + width > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - margin - width);
  }
  if (left < margin) left = margin;
  return { top, left, width, maxHeight };
}

export function ArtistDocumentLinkServiceModal({
  isOpen,
  variant,
  fileId,
  documentTitle,
  services,
  onClose,
  onSuccess,
}: ArtistDocumentLinkServiceModalProps) {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [listMetrics, setListMetrics] = useState<ListBoxMetrics | null>(null);

  const comboboxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  /** All services except those already using this exact document (same artist-file id). */
  const eligibleServices = useMemo(() => {
    const target = String(fileId);
    return services.filter((s) => {
      if (variant === 'contract') {
        const cur = linkedContractFileId(s);
        return cur == null || String(cur) !== target;
      }
      const cur = linkedRiderFileId(s);
      return cur == null || String(cur) !== target;
    });
  }, [services, variant, fileId]);

  const selectedService = useMemo(
    () => eligibleServices.find((s) => s.id === selectedServiceId) ?? null,
    [eligibleServices, selectedServiceId],
  );

  const updateListMetrics = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    setListMetrics(computeListBoxMetrics(el));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setIsSaving(false);
    setListOpen(false);
    setListMetrics(null);
    setSelectedServiceId('');
  }, [isOpen, variant, fileId]);

  useLayoutEffect(() => {
    if (!listOpen) {
      setListMetrics(null);
      return;
    }
    updateListMetrics();
  }, [listOpen, updateListMetrics, eligibleServices.length]);

  useEffect(() => {
    if (!listOpen) return;
    const onViewportChange = () => {
      updateListMetrics();
    };
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [listOpen, updateListMetrics]);

  useEffect(() => {
    if (!listOpen) return;
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (comboboxRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setListOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setListOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [listOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!selectedServiceId) {
      setError('Selecciona un servicio de la lista.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      if (variant === 'contract') {
        await updateArtistService(selectedServiceId, { contractTemplateId: fileId });
      } else {
        await updateArtistService(selectedServiceId, { technicalRiderTemplateId: fileId });
      }
      onSuccess(
        variant === 'contract'
          ? 'El contrato quedó vinculado al servicio seleccionado.'
          : 'El rider técnico quedó vinculado al servicio seleccionado.',
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'No se pudo guardar la vinculación.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const docLabel = documentTitle.trim() || (variant === 'contract' ? 'este contrato' : 'este rider técnico');
  const titleId = 'link-service-modal-title';

  const hasAnyServices = services.length > 0;
  const hasEligible = eligibleServices.length > 0;
  const allServicesAlreadyUseThisFile = hasAnyServices && !hasEligible;

  const listboxPortal =
    listOpen && listMetrics && hasEligible
      ? createPortal(
          <ul
            ref={listRef}
            id="link-service-listbox"
            role="listbox"
            aria-labelledby="link-service-combobox"
            style={{
              position: 'fixed',
              top: listMetrics.top,
              left: listMetrics.left,
              width: listMetrics.width,
              maxHeight: listMetrics.maxHeight,
              zIndex: 200,
            }}
            className="overflow-y-auto overscroll-contain rounded-xl border border-[#00d4c8]/25 bg-[#0c0d0f] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
          >
            {eligibleServices.map((s) => {
              const name = s.name.trim() || 'Sin nombre';
              const isSelected = s.id === selectedServiceId;
              return (
                <li key={s.id} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedServiceId(s.id);
                      setListOpen(false);
                      setError('');
                    }}
                    className={`flex min-h-[44px] w-full items-center px-3 py-2.5 text-left text-sm transition-colors sm:min-h-0 ${
                      isSelected
                        ? 'bg-[#00d4c8]/15 text-[#00ece0]'
                        : 'text-neutral-200 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {name}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4"
      role="presentation"
      onClick={(e) => {
        /* Portal listbox is a React child of this node but portaled to body; clicks on options
         * still bubble through the React tree and would otherwise invoke onClose. */
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(96dvh,880px)] w-full max-w-[min(calc(100vw-1.5rem),580px)] flex-col overflow-hidden rounded-2xl border border-[#00d4c8]/30 bg-[#111214] shadow-[0_0_35px_rgba(0,212,200,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 pr-1 sm:pr-2">
              <h3
                id={titleId}
                className="text-base font-semibold tracking-tight text-white leading-snug sm:text-lg"
              >
                {variant === 'contract' ? (
                  <>
                    Asociar el contrato{' '}
                    <span className="break-words text-[#00d4c8]" title={docLabel}>
                      {docLabel}
                    </span>{' '}
                    con un servicio
                  </>
                ) : (
                  <>
                    Asociar el rider técnico{' '}
                    <span className="break-words text-[#00d4c8]" title={docLabel}>
                      {docLabel}
                    </span>{' '}
                    con un servicio
                  </>
                )}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="shrink-0 rounded-full border border-white/20 p-2.5 text-white/70 transition hover:border-white/35 hover:bg-white/5 hover:text-white disabled:opacity-50 sm:p-2"
              aria-label="Cerrar"
            >
              <FiX size={17} />
            </button>
          </div>

          <p className="mb-4 text-sm text-neutral-400 leading-relaxed [overflow-wrap:anywhere]">
            {variant === 'contract' ? (
              <>
                Elige el servicio al que quieres vincular este contrato. Verás{' '}
                <span className="text-white/80">todos tus servicios</span>, salvo los que ya usan{' '}
                <span className="text-white/80">este mismo contrato</span>. Si el servicio tenía otro contrato distinto,
                al guardar pasará a usar este.
              </>
            ) : (
              <>
                Elige el servicio al que quieres vincular este rider técnico. Verás{' '}
                <span className="text-white/80">todos tus servicios</span>, salvo los que ya usan{' '}
                <span className="text-white/80">este mismo rider técnico</span>. Si el servicio tenía otro rider
                distinto, al guardar pasará a usar este.
              </>
            )}
          </p>

          {!hasAnyServices ? (
            <p className="m-0 text-sm text-neutral-400">
              No hay servicios registrados. Crea al menos un servicio desde la administración de tu perfil para poder
              vincularlo.
            </p>
          ) : allServicesAlreadyUseThisFile ? (
            <p className="m-0 text-sm text-neutral-400 leading-relaxed">
              {variant === 'contract'
                ? 'Todos tus servicios ya están vinculados a este mismo contrato. No queda ninguno pendiente por asociar.'
                : 'Todos tus servicios ya están vinculados a este mismo rider técnico. No queda ninguno pendiente por asociar.'}
            </p>
          ) : (
            <div ref={comboboxRef} className="relative">
              <p className="mb-1.5 text-sm font-medium text-neutral-300">Servicio</p>
              <button
                ref={triggerRef}
                type="button"
                id="link-service-combobox"
                aria-haspopup="listbox"
                aria-expanded={listOpen}
                aria-controls="link-service-listbox"
                disabled={isSaving}
                onClick={() => {
                  setError('');
                  setListOpen((o) => !o);
                }}
                className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border border-white/20 bg-black/25 px-3 py-2.5 text-left text-sm text-white outline-none transition hover:border-white/30 focus:border-[#00d4c8]/50 focus:ring-2 focus:ring-[#00d4c8]/25 disabled:opacity-50 sm:min-h-0"
              >
                <span
                  className={`min-w-0 flex-1 truncate text-left ${selectedService ? 'text-white/95' : 'text-neutral-500'}`}
                >
                  {selectedService ? (selectedService.name.trim() || 'Sin nombre') : 'Elige un servicio'}
                </span>
                <FiChevronDown
                  size={18}
                  aria-hidden
                  className={`shrink-0 text-[#00d4c8] transition-transform ${listOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          )}

          {error ? (
            <p role="alert" className="mt-3 text-sm text-red-300/95 leading-relaxed">
              {error}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 bg-[#111214] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="min-h-[44px] w-full rounded-full border border-white/25 px-4 py-2.5 text-sm text-white/80 transition hover:border-white/40 hover:text-white disabled:opacity-50 sm:min-h-0 sm:w-auto sm:py-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || !hasEligible || !selectedServiceId}
              className="min-h-[44px] w-full rounded-full border border-[#00d4c8]/40 bg-[#00d4c8]/20 px-4 py-2.5 text-sm font-medium text-[#00ece0] transition-colors hover:border-[#00ece0] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:w-auto sm:py-2"
            >
              {isSaving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
      {listboxPortal}
    </div>
  );
}
