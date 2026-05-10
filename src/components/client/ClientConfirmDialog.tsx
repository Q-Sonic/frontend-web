import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { acquireBodyScrollLock } from '../../helpers/bodyScrollLock';
import { Button } from '../Button';

export type ClientConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  /** Plain text or structured content (e.g. line breaks, emphasis). */
  message: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  /** `danger` for destructive actions (e.g. delete). */
  confirmVariant?: 'primary' | 'danger';
  /** Disables actions and backdrop dismiss while an async confirm runs. */
  isBusy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Small confirmation overlay aligned with client modals (dark panel, teal border).
 * Renders above nested modals when given a high z-index from the parent wrapper.
 */
export function ClientConfirmDialog({
  isOpen,
  title,
  message,
  cancelLabel = 'Cancelar',
  confirmLabel = 'Aceptar',
  confirmVariant = 'primary',
  isBusy = false,
  onCancel,
  onConfirm,
}: ClientConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    return acquireBodyScrollLock();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={
        'fixed inset-0 z-[100] flex items-end justify-center bg-black/80 ' +
        'pt-[max(0.25rem,env(safe-area-inset-top,0px))] sm:items-center sm:bg-black/75 sm:p-6'
      }
      role="presentation"
      onPointerDown={(e) => {
        if (isBusy) return;
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={
          'w-full max-w-[420px] border-[#00CCCB]/35 bg-[#111214] shadow-2xl ' +
          'rounded-t-2xl border-x border-t border-b-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 ' +
          'sm:rounded-3xl sm:border sm:px-6 sm:pb-6 sm:pt-6 md:p-7'
        }
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="client-confirm-dialog-title"
        aria-describedby="client-confirm-dialog-desc"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="touch-manipulation inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 p-2 text-white/60 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Cerrar"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <h2
          id="client-confirm-dialog-title"
          className="-mt-1 pr-10 text-base font-semibold tracking-tight text-white sm:text-lg md:text-xl"
        >
          {title}
        </h2>
        <div
          id="client-confirm-dialog-desc"
          className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base"
        >
          {message}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:mt-8 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isBusy}
            className="touch-manipulation min-h-12 w-full rounded-full border-[#00CCCB]/45 px-6 py-3 text-sm disabled:opacity-50 sm:min-h-0 sm:w-auto sm:py-2.5"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={isBusy}
            className="touch-manipulation min-h-12 w-full rounded-full px-6 py-3 text-sm sm:min-h-0 sm:w-auto sm:py-2.5"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
