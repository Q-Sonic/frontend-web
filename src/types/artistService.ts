import type { ApiResponse } from './api';

export interface ArtistServiceRecord {
  id: string;
  artistId: string;
  name: string;
  price: number;
  description: string;
  duration?: string;
  features?: string[];
  imageUrl?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
  /** Optional PDF / document URL per service (if backend returns it on list/detail). */
  pdfUrl?: string;
  contractPdfUrl?: string;
  documentUrl?: string;
  riderPdfUrl?: string;
  contractDocumentUrl?: string;
  /**
   * Artist file id linked as contract template (same as `contractId` from API).
   * Prefer reading `contractId` / `contractTemplateId` via `normalizeArtistServiceRecord` from API layer.
   */
  contractTemplateId?: string;
  /**
   * Artist file id linked as technical rider (same as `technicalRiderId` from API).
   */
  technicalRiderTemplateId?: string;
  /** OpenAPI / backend field for linked contract `artist-files` record. */
  contractId?: string;
  /** OpenAPI / backend field for linked rider `artist-files` record. */
  technicalRiderId?: string;
  /** Populated on some GET responses when contract is expanded. */
  contract?: { id?: string; originalName?: string; url?: string } | null;
  /** Populated on some GET responses when rider is expanded. */
  technicalRider?: { id?: string; originalName?: string; url?: string } | null;
}

export interface CreateArtistServiceBody {
  name: string;
  price: number;
  description?: string;
  duration?: string;
  features?: string[];
  isPinned?: boolean;
  /** Artist file id; sent to API as `contractId`. */
  contractTemplateId?: string;
  /** Artist file id; sent to API as `technicalRiderId`. */
  technicalRiderTemplateId?: string;
}

export interface UpdateArtistServiceBody {
  name?: string;
  price?: number;
  description?: string;
  duration?: string;
  features?: string[];
  isPinned?: boolean;
  contractTemplateId?: string;
  technicalRiderTemplateId?: string;
}

export type ArtistServiceResponse = ApiResponse<ArtistServiceRecord>;
export type ArtistServiceListResponse = ApiResponse<ArtistServiceRecord[]>;
