import React, { useRef, useState } from 'react';
import { paymentService } from '../api/paymentService';

const PAYMENTEZ_SDK_URL = 'https://cdn.paymentez.com/ccapi/sdk/payment_checkout_3.0.0.min.js';
const NUVEI_ENV = (import.meta.env.VITE_NUVEI_ENV as string) || 'stg';

interface PaymentCheckoutInstance {
  open: (opts: { reference: string }) => void;
  close: () => void;
}
interface PaymentCheckoutModalCtor {
  new (config: {
    env_mode: string;
    onOpen?: () => void;
    onClose?: () => void;
    onResponse: (response: PaymentezResponse) => void;
  }): PaymentCheckoutInstance;
}
declare global {
  interface Window {
    PaymentCheckout?: { modal: PaymentCheckoutModalCtor };
  }
}
interface PaymentezResponse {
  transaction?: { status: string; id: string; status_detail: number };
  error?: { type: string; help: string; description: string };
}

interface GroupPaymentButtonProps {
  contractIds: string[];
  children?: React.ReactNode;
  className?: string;
  onSuccess?: (transactionId: string) => void;
  onFailure?: (detail: string) => void;
  onError?: (err: string) => void;
}

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaymentCheckout) { resolve(); return; }
    const existing = document.querySelector(`script[src="${PAYMENTEZ_SDK_URL}"]`);
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const script = document.createElement('script');
    script.src = PAYMENTEZ_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de Paymentez'));
    document.head.appendChild(script);
  });
}

/**
 * GroupPaymentButton
 * Opens the Paymentez modal for a combined payment of multiple contracts.
 * Creates a single Nuvei reference covering the total of all selected contracts.
 */
export const GroupPaymentButton: React.FC<GroupPaymentButtonProps> = ({
  contractIds,
  children,
  className = '',
  onSuccess,
  onFailure,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const checkoutRef = useRef<PaymentCheckoutInstance | null>(null);
  const orderKeyRef = useRef<string | null>(null);
  const totalRef = useRef<number>(0);

  const handlePayment = async () => {
    if (contractIds.length < 1) return;
    setIsLoading(true);
    try {
      const res = await paymentService.createGroupCheckoutReference({
        contractIds,
        description: `Pago grupal — ${contractIds.length} contrato${contractIds.length === 1 ? '' : 's'}`,
      });

      if (!res?.data?.reference) throw new Error('No se recibió referencia de pago');
      orderKeyRef.current = res.data.orderKey ?? null;
      totalRef.current = res.data.totalAmount ?? 0;

      await loadSdk();
      if (!window.PaymentCheckout) throw new Error('SDK de Paymentez no disponible');

      checkoutRef.current = new window.PaymentCheckout.modal({
        env_mode: NUVEI_ENV,
        onClose: () => setIsLoading(false),
        onResponse: async (response: PaymentezResponse) => {
          setIsLoading(false);
          if (response.error) {
            const msg = response.error.description || response.error.type || 'Error en el pago';
            if (onError) onError(msg);
            return;
          }
          const tx = response.transaction;
          if (!tx) return;
          const approved = tx.status === 'success' && (tx.status_detail === 3 || (tx.status_detail as any) === '3');
          if (approved) {
            try {
              if (orderKeyRef.current) {
                await paymentService.confirmCheckout(orderKeyRef.current, tx.id, totalRef.current);
              }
            } catch (confirmErr) {
              console.error('[GroupPayment] confirm-checkout error:', confirmErr);
            }
            if (onSuccess) onSuccess(tx.id);
          } else {
            if (onFailure) onFailure(`Pago rechazado (status_detail: ${tx.status_detail})`);
          }
        },
      });

      checkoutRef.current.open({ reference: res.data.reference });
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.message || 'Error inesperado al iniciar el pago';
      if (onError) onError(msg);
      else alert(msg);
    }
  };

  return (
    <button
      type="button"
      disabled={isLoading || contractIds.length < 1}
      onClick={() => void handlePayment()}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#38BACC] px-6 py-3 text-sm font-bold text-black shadow-[0_0_24px_rgba(56,186,204,0.4)] transition hover:bg-[#5dd0de] disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Preparando pago…
        </span>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          {children ?? 'Pagar seleccionados'}
        </>
      )}
    </button>
  );
};
