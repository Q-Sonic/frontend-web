import { config } from '../config';
import type { ArtistProfile } from '../types/profile';
import type { ArtistServiceRecord } from '../types/artistService';

/** Turn API-relative paths into absolute URLs for opening in a new tab. */
export function normalizeMediaDownloadUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (/^(blob|data):/i.test(u)) return u;
  const base = config.apiBaseUrl.replace(/\/$/, '');
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
}

/** Gallery / streaming src: absolute https, blob/data as-is, else prefix with API base. */
export function resolveArtistProfileMediaUrl(url: string | undefined): string {
  return normalizeMediaDownloadUrl(url) ?? '';
}

function isGoogleCloudStorageHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'storage.googleapis.com' || h.endsWith('.storage.googleapis.com');
}

/** True if URL looks like a GCS object URL without V2/V4 signature (anonymous GET returns AccessDenied). */
export function isUnsignedGoogleStorageObjectUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!isGoogleCloudStorageHost(u.hostname)) return false;
    const q = u.search;
    const upper = q.toUpperCase();
    if (upper.includes('X-GOOG-SIGNATURE') || upper.includes('X-GOOG-ALGORITHM')) return false;
    if (upper.includes('GOOGLEACCESSID')) return false;
    if (upper.includes('SIGNATURE') && upper.includes('EXPIRES')) return false;
    return true;
  } catch {
    return false;
  }
}

/** Technical rider PDF from artist profile (OpenAPI: rider upload on PUT /artist-profiles). */
export function technicalRiderPdfFromProfile(profile: ArtistProfile | null | undefined): string | undefined {
  if (!profile) return undefined;
  const raw = profile.technicalRiderUrl ?? profile.riderUrl;
  return normalizeMediaDownloadUrl(raw);
}

/**
 * PDF for a row in "Listado de contratos por servicio".
 * Prefer per-service fields if backend adds them; else same rider as profile.
 */
export function contractPdfUrlForService(
  service: ArtistServiceRecord,
  profile: ArtistProfile | null | undefined,
): string | undefined {
  const raw =
    service.pdfUrl ??
    service.contractPdfUrl ??
    service.documentUrl ??
    service.riderPdfUrl ??
    service.contractDocumentUrl;
  if (raw) return normalizeMediaDownloadUrl(raw);
  return technicalRiderPdfFromProfile(profile);
}
