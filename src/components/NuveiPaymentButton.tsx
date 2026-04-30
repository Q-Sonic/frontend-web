import React, { useState } from 'react';
import { Button } from './Button';
import { paymentService } from '../api/paymentService';
import type { CreateLinkToPayRequest } from '../types';


interface NuveiPaymentButtonProps extends Partial<CreateLinkToPayRequest> {
  contractId?: string;
  amount: number;
  description: string;
  children?: React.ReactNode;
  className?: string;
  onSuccess?: (url: string) => void;
  onError?: (err: string) => void;
}

/**
 * NuveiPaymentButton
 * A premium button component to initiate a Nuvei (Paymentez) session.
 */
export const NuveiPaymentButton: React.FC<NuveiPaymentButtonProps> = ({
  amount,
  description,
  dev_reference,
  contractId,
  children = 'Pagar Ahora',
  className = '',
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const response = await paymentService.createLinkToPay({
        amount,
        description,
        dev_reference: dev_reference || contractId || '',
      });

      if (response.success && response.data.payment_url) {
        const url_para_pago = response.data.payment_url;
        
        if (onSuccess) {
          onSuccess(url_para_pago);
        }

        // Redirigir al usuario al checkout de Nuvei
        window.location.href = url_para_pago;
      } else {
        throw new Error(response.message || 'Error al generar el link de pago');
      }
    } catch (err: any) {
      console.error('[NuveiPayment] Error:', err);
      const errorMessage = err.message || 'Error inesperado al procesar el pago';
      if (onError) onError(errorMessage);
      else alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      loading={isLoading}
      variant="primary"
      className={className}
    >
      <span className="flex items-center gap-2">
        {!isLoading && (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
        )}
        {children}
      </span>
    </Button>
  );
};
