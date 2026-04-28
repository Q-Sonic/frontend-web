import type { ReactNode } from 'react';
import { FiX } from 'react-icons/fi';
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
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (isBusy) return;
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-[420px] rounded-3xl border border-[#00CCCB]/35 bg-[#111214] p-6 shadow-2xl md:p-7"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="client-confirm-dialog-title"
        aria-describedby="client-confirm-dialog-desc"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-full border border-white/15 p-2 text-white/60 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Cerrar"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <h2
          id="client-confirm-dialog-title"
          className="-mt-1 pr-10 text-lg font-semibold tracking-tight text-white md:text-xl"
        >
          {title}
        </h2>
        <div
          id="client-confirm-dialog-desc"
          className="mt-3 text-sm leading-relaxed text-white/70 md:text-base"
        >
          {message}
        </div>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-full border-[#00CCCB]/45 px-6 py-2.5 text-sm sm:w-auto disabled:opacity-50"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={isBusy}
            className="rounded-full px-6 py-2.5 text-sm sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
