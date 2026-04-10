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
  createdAt: string;
  updatedAt: string;
  /** Optional PDF / document URL per service (if backend returns it on list/detail). */
  pdfUrl?: string;
  contractPdfUrl?: string;
  documentUrl?: string;
  riderPdfUrl?: string;
  contractDocumentUrl?: string;
}

export interface CreateArtistServiceBody {
  name: string;
  price: number;
  description?: string;
  duration?: string;
  features?: string[];
}

export interface UpdateArtistServiceBody {
  name?: string;
  price?: number;
  description?: string;
  duration?: string;
  features?: string[];
}

export type ArtistServiceResponse = ApiResponse<ArtistServiceRecord>;
export type ArtistServiceListResponse = ApiResponse<ArtistServiceRecord[]>;
