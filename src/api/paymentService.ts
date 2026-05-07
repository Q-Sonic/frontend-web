import { api } from './client';
import type { CreateLinkToPayRequest, CreateLinkToPayResponse } from '../types';

export interface CheckoutReferenceRequest {
  amount: number;
  description: string;
  dev_reference: string;
}

export interface CheckoutReferenceResponse {
  success: boolean;
  data: { reference: string; checkoutUrl: string; orderKey: string };
  message: string;
}

/**
 * Payment Service - Nuvei Integration
 */
export const paymentService = {
  /**
   * Confirms a successful checkout payment on the backend (client-side fallback for webhook).
   */
  confirmCheckout: async (orderKey: string, transactionId: string, amount: number): Promise<void> => {
    await api('payments/confirm-checkout', {
      method: 'POST',
      body: JSON.stringify({ orderKey, transactionId, amount }),
    });
  },

  /**
   * Creates a Checkout reference for the Paymentez SDK modal (embedded card payment).
   */
  createCheckoutReference: async (payload: CheckoutReferenceRequest): Promise<CheckoutReferenceResponse> => {
    return api<CheckoutReferenceResponse>('payments/checkout-reference', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Creates a single Checkout reference for multiple contracts (group payment).
   * Returns the combined total amount from all selected contracts.
   */
  createGroupCheckoutReference: async (payload: {
    contractIds: string[];
    description?: string;
  }): Promise<CheckoutReferenceResponse & { data: { totalAmount: number } }> => {
    return api<CheckoutReferenceResponse & { data: { totalAmount: number } }>('payments/checkout-group-reference', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Generates a Link-to-Pay URL (redirects to external payment page).
   */
  createLinkToPay: async (payload: CreateLinkToPayRequest): Promise<CreateLinkToPayResponse> => {
    return api<CreateLinkToPayResponse>('payments/link-to-pay', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * (Utility) If you need to manually check refund status or other server-side ops
   */
  refund: async (transactionId: string, amount?: number): Promise<any> => {
    return api('payments/refund', {
      method: 'POST',
      body: JSON.stringify({ transactionId, amount }),
    });
  },

  /**
   * Requests a withdrawal of artist balance.
   */
  withdraw: async (amount: number, bankDetails: {
    bankName: string;
    accountNumber: string;
    accountType: string;
    holderName: string;
    holderDocument: string;
  }): Promise<any> => {
    return api('payments/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, bankDetails }),
    });
  },
};
