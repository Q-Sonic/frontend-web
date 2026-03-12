import type { ApiResponse } from './api';

export interface ArtistServiceRecord {
  id: string;
  artistId: string;
  name: string;
  price: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArtistServiceBody {
  name: string;
  price: number;
  description?: string;
}

export interface UpdateArtistServiceBody {
  name?: string;
  price?: number;
  description?: string;
}

export type ArtistServiceResponse = ApiResponse<ArtistServiceRecord>;
export type ArtistServiceListResponse = ApiResponse<ArtistServiceRecord[]>;
