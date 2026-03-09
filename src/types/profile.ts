import type { ApiResponse } from './api';

export interface ClientProfile {
  name?: string;
  phone?: string;
  location?: string;
  photo?: string;
}

export interface ClientProfileUpdate {
  name: string;
  phone?: string;
  location?: string;
  photo?: string;
}

export interface ArtistSocialNetworks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
}

export interface ArtistProfile {
  biography?: string;
  city?: string;
  socialNetworks?: ArtistSocialNetworks;
  photo?: string;
}

export interface ArtistProfileUpdate {
  biography?: string;
  city?: string;
  socialNetworks?: ArtistSocialNetworks;
  photo?: string;
}

export type ClientProfileResponse = ApiResponse<ClientProfile>;
export type ArtistProfileResponse = ApiResponse<ArtistProfile>;
