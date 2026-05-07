import React, { useRef, useState } from 'react';
import { Button } from './Button';
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
    PaymentCheckout?: {
      modal: PaymentCheckoutModalCtor;
    };
  }
}

interface PaymentezResponse {
  transaction?: { status: string; id: string; status_detail: number };
  error?: { type: string; help: string; description: string };
}

interface PaymentezCheckoutButtonProps {
  amount: number;
  description: string;
  devReference: string;
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
 * PaymentezCheckoutButton
 * Opens the Paymentez embedded card-payment modal.
 * Flow:
 *   1. Get a `reference` from the backend (init_reference).
 *   2. Load the Paymentez SDK if not loaded yet.
 *   3. Open the modal with the reference.
 *   4. Report success / failure / error via callbacks.
 */
export const PaymentezCheckoutButton: React.FC<PaymentezCheckoutButtonProps> = ({
  amount,
  description,
  devReference,
  children = 'Pagar con tarjeta',
  className = '',
  onSuccess,
  onFailure,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const checkoutRef = useRef<PaymentCheckoutInstance | null>(null);
  const orderKeyRef = useRef<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const res = await paymentService.createCheckoutReference({ amount, description, dev_reference: devReference });
      if (!res?.data?.reference) throw new Error('No se recibió referencia de pago');

      orderKeyRef.current = res.data.orderKey ?? null;

      await loadSdk();

      if (!window.PaymentCheckout) throw new Error('SDK de Paymentez no disponible');

      checkoutRef.current = new window.PaymentCheckout.modal({
        client_app_code: import.meta.env.VITE_NUVEI_CLIENT_APP_CODE,
        client_app_key: import.meta.env.VITE_NUVEI_CLIENT_APP_KEY,
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
            // Immediately confirm on the backend so the contract is marked as PAID
            // without waiting for the Nuvei webhook (which can't reach localhost in dev)
            try {
              if (orderKeyRef.current) {
                await paymentService.confirmCheckout(orderKeyRef.current, tx.id, amount);
              }
            } catch (confirmErr) {
              console.error('[PaymentezCheckout] confirm-checkout error:', confirmErr);
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
    <Button onClick={handlePayment} loading={isLoading} variant="primary" className={className}>
      <span className="flex items-center gap-2">
        {!isLoading && (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        )}
        {children}
      </span>
    </Button>
  );
};
