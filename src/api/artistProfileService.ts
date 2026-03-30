import type {
  ArtistProfile,
  ArtistProfileUpdate,
  ArtistProfileListItem,
  ArtistMediaItem,
  ApiResponse,
} from '../types';
import { api, apiPostFormData, apiPutFormData, ApiError } from './client';

/** List all artist profiles (for client browse). Requires cliente/admin/organizacion/soporte. */
export async function listArtistProfiles(): Promise<ArtistProfileListItem[]> {
  const res = await api<ApiResponse<ArtistProfileListItem[]>>('artist-profiles');
  return res.data ?? [];
}

export async function getArtistProfile(): Promise<ArtistProfile> {
  const res = await api<ApiResponse<ArtistProfile>>('artist-profiles/me');
  return res.data;
}

/** Get artist profile by id (for clients viewing an artist). */
export async function getArtistProfileById(id: string): Promise<ArtistProfile & { uid: string }> {
  const res = await api<ApiResponse<ArtistProfile & { uid: string }>>(`artist-profiles/${id}`);
  return res.data;
}

export async function updateArtistProfile(payload: ArtistProfileUpdate): Promise<ArtistProfile> {
  const res = await api<ApiResponse<ArtistProfile>>('artist-profiles', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/** Update artist profile with photo as file (multipart). Use this instead of upload + update when changing photo. */
export async function updateArtistProfileWithFormData(formData: FormData): Promise<ArtistProfile> {
  const res = await apiPutFormData<ApiResponse<ArtistProfile>>('artist-profiles', formData);
  return res.data;
}

/** POST /artist-profiles/media — append gallery files (multipart field `media` per OpenAPI). */
export async function addArtistProfileMedia(files: File[]): Promise<ArtistProfile> {
  if (files.length === 0) {
    return getArtistProfile();
  }

  async function postMediaParts(parts: File[]): Promise<void> {
    const formData = new FormData();
    for (const file of parts) {
      formData.append('media', file);
    }
    await apiPostFormData<ApiResponse<ArtistProfile>>('artist-profiles/media', formData);
  }

  try {
    await postMediaParts(files);
  } catch (err) {
    // OpenAPI allows an array of files; some stacks use multer.single and only accept one part per request.
    if (files.length <= 1) throw err;
    if (!(err instanceof ApiError)) throw err;
    for (const file of files) {
      await postMediaParts([file]);
    }
  }

  return getArtistProfile();
}

function sameGalleryUrl(stored: string, target: string): boolean {
  const a = stored.trim();
  const b = target.trim();
  if (a === b) return true;
  try {
    return decodeURIComponent(a) === decodeURIComponent(b);
  } catch {
    return false;
  }
}

/**
 * Best-effort DELETE /artist-profiles/media (query + JSON body variants). Returns true if any call succeeds.
 */
async function tryDeleteArtistProfileMediaVariants(fileUrl: string): Promise<boolean> {
  const url = fileUrl.trim();
  if (!url) return false;

  const tryOnce = async (fn: () => Promise<unknown>): Promise<boolean> => {
    try {
      await fn();
      return true;
    } catch {
      return false;
    }
  };

  if (
    await tryOnce(() =>
      api<ApiResponse<unknown>>(`artist-profiles/media?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      }),
    )
  ) {
    return true;
  }

  if (
    await tryOnce(() =>
      api<ApiResponse<unknown>>('artist-profiles/media', {
        method: 'DELETE',
        body: JSON.stringify({ url }),
      }),
    )
  ) {
    return true;
  }

  if (
    await tryOnce(() =>
      api<ApiResponse<unknown>>('artist-profiles/media', {
        method: 'DELETE',
        body: JSON.stringify({ mediaUrl: url }),
      }),
    )
  ) {
    return true;
  }

  if (
    await tryOnce(() =>
      api<ApiResponse<unknown>>('artist-profiles/media', {
        method: 'DELETE',
        body: JSON.stringify({ media_url: url }),
      }),
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Remove one gallery item: tries DELETE variants, then refreshes. If the URL is still present, updates profile via PUT with a filtered `media` list (many backends only persist gallery through profile JSON).
 */
export async function removeArtistProfileGalleryItem(fileUrl: string): Promise<ArtistProfile> {
  const url = fileUrl.trim();
  if (!url) {
    throw new Error('Falta la URL del archivo.');
  }

  await tryDeleteArtistProfileMediaVariants(url);

  let profile = await getArtistProfile();
  const list = profile.media ?? [];
  if (!list.some((m) => sameGalleryUrl(m.url, url))) {
    return profile;
  }

  const nextMedia: ArtistMediaItem[] = list.filter((m) => !sameGalleryUrl(m.url, url));
  const payload: ArtistProfileUpdate = {
    biography: profile.biography,
    city: profile.city,
    socialNetworks: profile.socialNetworks,
    photo: profile.photo,
    media: nextMedia,
  };

  await updateArtistProfile(payload);
  profile = await getArtistProfile();
  if ((profile.media ?? []).some((m) => sameGalleryUrl(m.url, url))) {
    throw new ApiError(
      'El servidor no aplicó la eliminación. Revisa que el backend permita actualizar la galería.',
      500,
    );
  }
  return profile;
}
