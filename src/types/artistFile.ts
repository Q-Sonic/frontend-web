import type { ApiResponse } from './api';

/** Matches OpenAPI `ArtistFileRecord` in `local/backend-server/README.md`. */
export type ArtistFileType = 'contract' | 'technical_rider';

export type ArtistFileRecord = {
  id: string;
  artistId: string;
  type: ArtistFileType;
  /** Display name from API when present; otherwise derive from `originalName`. */
  name?: string;
  description?: string;
  originalName: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  storagePath?: string;
  url: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ArtistFileListResponse = ApiResponse<ArtistFileRecord[]>;
export type ArtistFileSingleResponse = ApiResponse<ArtistFileRecord>;
