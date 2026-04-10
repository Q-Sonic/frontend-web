export interface CreateLinkToPayRequest {
  amount: number;
  description: string;
  dev_reference: string;
}

export interface NuveiOrder {
  status: string;
  dev_reference: string;
  amount: number;
  currency: string;
  description: string;
  id: string;
}

export interface NuveiPayment {
  payment_url: string;
}

export interface CreateLinkToPayResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    payment_url: string;
  };
}

export interface WebhookProcessedResponse {
  success: boolean;
  data: {
    orderId: string;
    isApproved: boolean;
  };
}
