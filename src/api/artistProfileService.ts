import type {
  ArtistProfile,
  ArtistProfileUpdate,
  ArtistProfileListItem,
  ArtistMediaItem,
  ApiResponse,
} from '../types';
import { api, apiPostFormData, apiPutFormData, ApiError } from './client';

/** Query params for `GET /artist-profiles` (backend may ignore unknown keys). */
export type ArtistProfileListFilters = {
  genre?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  availableToday?: boolean;
};

function buildArtistProfilesQuery(filters: ArtistProfileListFilters): string {
  const p = new URLSearchParams();
  const g = filters.genre?.trim();
  const c = filters.city?.trim();
  const s = filters.search?.trim();
  if (g) p.set('genre', g);
  if (c) p.set('city', c);
  if (s) p.set('search', s);
  if (filters.minPrice != null && Number.isFinite(filters.minPrice)) p.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null && Number.isFinite(filters.maxPrice)) p.set('maxPrice', String(filters.maxPrice));
  if (filters.availableToday === true) p.set('availableToday', 'true');
  const q = p.toString();
  return q ? `?${q}` : '';
}

function dedupeArtistListByUid(rows: ArtistProfileListItem[]): ArtistProfileListItem[] {
  const seen = new Set<string>();
  const out: ArtistProfileListItem[] = [];
  for (const r of rows) {
    const id = r.uid?.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(r);
  }
  return out;
}

/** Accepts `{ data: T[] }`, a bare array, or `{ profiles: T[] }` from the wire. */
function normalizeArtistProfileListPayload(body: unknown): ArtistProfileListItem[] {
  if (Array.isArray(body)) {
    return body as ArtistProfileListItem[];
  }
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (Array.isArray(o.data)) {
      return o.data as ArtistProfileListItem[];
    }
    if (o.data && typeof o.data === 'object') {
      const inner = o.data as Record<string, unknown>;
      if (Array.isArray(inner.profiles)) {
        return inner.profiles as ArtistProfileListItem[];
      }
      if (Array.isArray(inner.items)) {
        return inner.items as ArtistProfileListItem[];
      }
    }
    if (Array.isArray(o.profiles)) {
      return o.profiles as ArtistProfileListItem[];
    }
    if (Array.isArray(o.items)) {
      return o.items as ArtistProfileListItem[];
    }
  }
  return [];
}

/** List artist profiles (client browse / discovery). Requires cliente/admin/organizacion/soporte. */
export async function listArtistProfiles(
  filters: ArtistProfileListFilters = {},
): Promise<ArtistProfileListItem[]> {
  const suffix = buildArtistProfilesQuery(filters);
  const raw = await api<unknown>(`artist-profiles${suffix}`);
  const list = normalizeArtistProfileListPayload(raw);
  return dedupeArtistListByUid(list);
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

function artistProfileHasMeaningfulContent(profile: ArtistProfile): boolean {
  const o = profile as Record<string, unknown>;
  const str = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  if (str(o.biography)) return true;
  if (str(o.city)) return true;
  if (str(o.photo)) return true;
  if (Array.isArray(o.media) && o.media.length > 0) return true;
  const sn = o.socialNetworks;
  if (sn && typeof sn === 'object') {
    if (Object.values(sn as Record<string, unknown>).some((x) => str(x))) return true;
  }
  if (o.featuredSong && typeof o.featuredSong === 'object') return true;
  if (Array.isArray(o.blockedDates) && o.blockedDates.length > 0) return true;
  return false;
}

/**
 * True when the server returned no usable document yet (new artist). `{}` or all-empty fields still need a seed PUT
 * so discovery lists can pick up the uid.
 */
function artistProfileNeedsDiscoverySeed(profile: ArtistProfile | null | undefined): boolean {
  if (profile == null) return true;
  if (typeof profile !== 'object') return true;
  if (!artistProfileHasMeaningfulContent(profile)) return true;
  return false;
}

const DISCOVERY_SEED_SESSION_PREFIX = 'artistDiscoverySeeded:';

/**
 * Ensures the signed-in artist has a persisted artist profile row for client discovery (`GET /artist-profiles`).
 * Seeds with a minimal PUT when GET /me is missing (404/403) or returns an empty profile; repeats empty-profile PUT
 * at most once per tab session (sessionStorage) to avoid hammering the API.
 */
export async function ensureArtistProfileListedForDiscovery(artistUid: string): Promise<boolean> {
  const seedKey = `${DISCOVERY_SEED_SESSION_PREFIX}${artistUid}`;

  let profile: ArtistProfile | null | undefined;
  try {
    const raw = await getArtistProfile();
    profile = raw ?? null;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 403)) {
      profile = null;
    } else {
      return false;
    }
  }

  if (!artistProfileNeedsDiscoverySeed(profile)) {
    return true;
  }

  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(seedKey)) {
    return true;
  }

  try {
    await updateArtistProfile({
      biography: '',
      city: '',
      socialNetworks: {},
    });
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(seedKey, '1');
    }
    return true;
  } catch {
    return false;
  }
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

/**
 * Toggles a date (YYYY-MM-DD) in the artist's blockedDates list.
 */
export async function toggleArtistBlockedDate(dateKey: string): Promise<string[]> {
  const profile = await getArtistProfile();
  const current = profile.blockedDates || [];
  const exists = current.includes(dateKey);
  const next = exists ? current.filter((d) => d !== dateKey) : [...current, dateKey];

  await updateArtistProfile({
    ...profile,
    blockedDates: next,
  });

  return next;
}
