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

/** Single media item (audio, video, image) URL from Firebase Storage. */
export interface ArtistMediaItem {
  url: string;
  type: 'image' | 'audio' | 'video';
  /** Optional original filename. */
  name?: string;
  /** Optional cover image URL for audio songs. */
  coverUrl?: string;
}

export interface ArtistProfile {
  biography?: string;
  city?: string;
  socialNetworks?: ArtistSocialNetworks;
  photo?: string;
  /** Featured song for the profile player (if provided by backend). */
  featuredSong?: {
    title: string;
    artistName: string;
    streamUrl: string;
    coverUrl?: string;
  };
  /** Link to technical rider (PDF), e.g. after multipart `rider` on PUT /artist-profiles */
  technicalRiderUrl?: string;
  /** Some backends expose the same file under this name */
  riderUrl?: string;
  /** Manual blocked dates (YYYY-MM-DD). */
  blockedDates?: string[];
  /** Media gallery URLs (stored client-side until backend supports it). */
  media?: ArtistMediaItem[];
  /** Songs are independent from gallery media. */
  songs?: Array<{
    url: string;
    title: string;
    coverUrl?: string;
  }>;
}

/** Artist profile as returned by list endpoint (with displayName). */
export interface ArtistProfileListItem extends ArtistProfile {
  uid: string;
  displayName: string;
  /** When provided by list/filters API (discovery). */
  genre?: string;
  /** Primary service price (if provided by discovery API). */
  price?: number;
}

export interface ArtistProfileUpdate {
  biography?: string;
  city?: string;
  socialNetworks?: ArtistSocialNetworks;
  photo?: string;
  media?: ArtistMediaItem[];
  songs?: Array<{
    url: string;
    title: string;
    coverUrl?: string;
  }>;
  blockedDates?: string[];
  featuredSong?: {
    title: string;
    artistName: string;
    streamUrl: string;
    coverUrl?: string;
  };
}

export type ClientProfileResponse = ApiResponse<ClientProfile>;
export type ArtistProfileResponse = ApiResponse<ArtistProfile>;
