import { api } from './client';
import type { CreateLinkToPayRequest, CreateLinkToPayResponse } from '../types';


/**
 * Payment Service - Nuvei Integration
 */
export const paymentService = {
  /**
   * Generates a payment link from the backend.
   * This will redirect the user to the Nuvei payment session.
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
