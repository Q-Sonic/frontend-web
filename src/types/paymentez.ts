export interface PaymentCheckoutInstance {
  open: (opts: { reference: string }) => void;
  close: () => void;
}

export interface PaymentezResponse {
  transaction?: { status: string; id: string; status_detail: number };
  error?: { type: string; help: string; description: string };
}

export interface PaymentCheckoutModalCtor {
  new (config: {
    client_app_code: string;
    client_app_key: string;
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
