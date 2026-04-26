/** Aligned with OpenAPI `ContractRecord` / `CreateContractBody` in `local/backend-server/README.md`. */

export type ContractLifecycleStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type ContractPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export type ContractEventDetails = {
  name?: string;
  /** ISO string or Firestore-like `{ _seconds: number }` from API. */
  date?: string | { _seconds?: number; _nanoseconds?: number };
  location?: string;
  description?: string;
};

export type ContractFinancials = {
  totalAmount?: number;
  paidAmount?: number;
  paymentStatus?: ContractPaymentStatus;
};

export type ContractRecord = {
  id: string;
  status: ContractLifecycleStatus;
  eventDetails?: ContractEventDetails;
  financials?: ContractFinancials;
  contractUrl?: string;
  riderUrl?: string;
  /** Optional if backend adds them later (not in minimal OpenAPI). */
  artistId?: string;
  serviceId?: string;
  /**
   * Optional enrichment from API (e.g. joined profile). When set, the client contracts UI
   * shows this as the card headline and uses `artistPhotoUrl` for the avatar.
   */
  artistDisplayName?: string;
  /** Public URL for the artist avatar thumbnail on contract lists. */
  artistPhotoUrl?: string;
};

export type CreateContractBody = {
  artistId: string;
  serviceId: string;
  totalAmount: number;
  eventDetails: {
    name: string;
    date: string;
    location: string;
    description?: string;
  };
  /** Base64 original PNG signature from client. */
  clientSignatureDataUrl?: string;
  /** Legal confirmation. */
  acceptedTerms?: boolean;
};
