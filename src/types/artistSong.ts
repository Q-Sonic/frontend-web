import type { ApiResponse } from './api';

export interface ArtistSongRecord {
  id: string;
  artistId: string;
  title: string;
  audioUrl: string;
  coverUrl?: string;
  isFeatured?: boolean;
}

export type ArtistSongResponse = ApiResponse<ArtistSongRecord>;
export type ArtistSongListResponse = ApiResponse<ArtistSongRecord[]>;
