import type { ArtistProfile } from '../types/profile';
import type { ArtistServiceRecord } from '../types/artistService';
import type { ArtistRiderItem } from '../components/artist-profile/ArtistProfileRidersGrid';
import { normalizeMediaDownloadUrl, technicalRiderPdfFromProfile } from './artistDocumentUrls';
import { RIDER_SECTION_IMAGES } from './artistRiderSections';

/** Row id prefix when the PDF comes only from the service (no `contractId`). */
export const CLIENT_LEGACY_CONTRACT_ROW_PREFIX = 'legacy-c:';

/** Row id prefix for per-service rider PDF without `technicalRiderId`. */
export const CLIENT_LEGACY_RIDER_ROW_PREFIX = 'legacy-r:';

/** Synthetic rider card id when only the profile stores a global rider URL. */
export const CLIENT_PROFILE_RIDER_ROW_ID = 'profile-rider';

export function serviceContractPdfUrl(service: ArtistServiceRecord): string | undefined {
  const c = service.contract;
  const nestedUrl =
    c && typeof c === 'object' && 'url' in c ? String((c as { url?: string }).url || '').trim() : '';
  const raw =
    (nestedUrl || undefined) ??
    service.contractPdfUrl ??
    service.pdfUrl ??
    service.contractDocumentUrl ??
    service.documentUrl;
  return normalizeMediaDownloadUrl(raw);
}

export function serviceTechnicalRiderPdfUrl(service: ArtistServiceRecord): string | undefined {
  const r = service.technicalRider;
  const nestedUrl =
    r && typeof r === 'object' && 'url' in r ? String((r as { url?: string }).url || '').trim() : '';
  const raw = (nestedUrl || undefined) ?? service.riderPdfUrl;
  return normalizeMediaDownloadUrl(raw);
}

function nestedContractLabel(service: ArtistServiceRecord): string {
  const c = service.contract;
  if (c && typeof c === 'object') {
    const name = 'name' in c ? String((c as { name?: string }).name || '').trim() : '';
    const orig = 'originalName' in c ? String((c as { originalName?: string }).originalName || '').trim() : '';
    const pick = name || orig.replace(/\.pdf$/i, '');
    if (pick) return pick;
  }
  return '';
}

function nestedRiderLabel(service: ArtistServiceRecord): string {
  const r = service.technicalRider;
  if (r && typeof r === 'object') {
    const name = 'name' in r ? String((r as { name?: string }).name || '').trim() : '';
    const orig = 'originalName' in r ? String((r as { originalName?: string }).originalName || '').trim() : '';
    const pick = name || orig.replace(/\.pdf$/i, '');
    if (pick) return pick;
  }
  return '';
}

/**
 * One row per contract file linked from services (or one legacy row per service with a contract URL).
 * Only documents reachable via the public services list are included (same visibility as the API).
 */
export function buildClientContractTableRows(
  services: ArtistServiceRecord[],
  artistId: string,
): ArtistServiceRecord[] {
  const now = new Date().toISOString();
  type Agg = {
    rowId: string;
    url?: string;
    description: string;
    displayName: string;
  };
  const byKey = new Map<string, Agg>();

  for (const s of services) {
    const url = serviceContractPdfUrl(s);
    const fileId = (s.contractId ?? s.contractTemplateId)?.trim();
    if (fileId) {
      const prev = byKey.get(fileId);
      const label = nestedContractLabel(s) || s.name.trim() || 'Contrato';
      if (!prev) {
        byKey.set(fileId, {
          rowId: fileId,
          url,
          description: (s.description ?? '').trim(),
          displayName: label,
        });
      } else {
        if (url && !prev.url) prev.url = url;
        const nl = nestedContractLabel(s);
        if (nl && (prev.displayName === 'Contrato' || prev.displayName === s.name)) prev.displayName = nl;
      }
    } else if (url) {
      const rowId = `${CLIENT_LEGACY_CONTRACT_ROW_PREFIX}${s.id}`;
      byKey.set(rowId, {
        rowId,
        url,
        description: (s.description ?? '').trim(),
        displayName: s.name.trim() || 'Contrato',
      });
    }
  }

  const rows: ArtistServiceRecord[] = [];
  for (const g of byKey.values()) {
    rows.push({
      id: g.rowId,
      artistId,
      name: g.displayName,
      description: g.description,
      price: 0,
      features: [],
      imageUrl: '',
      createdAt: now,
      updatedAt: now,
      contractPdfUrl: g.url,
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

export function getLinkedServicesForClientContractRow(
  row: ArtistServiceRecord,
  services: ArtistServiceRecord[],
): { id: string; name: string }[] {
  if (row.id.startsWith(CLIENT_LEGACY_CONTRACT_ROW_PREFIX)) {
    const sid = row.id.slice(CLIENT_LEGACY_CONTRACT_ROW_PREFIX.length);
    const s = services.find((x) => x.id === sid);
    return s ? [{ id: s.id, name: s.name.trim() || 'Servicio' }] : [];
  }
  return services
    .filter((s) => (s.contractId ?? s.contractTemplateId)?.trim() === row.id)
    .map((s) => ({ id: s.id, name: s.name.trim() || 'Servicio' }))
    .filter((x) => x.name.length > 0);
}

export function buildClientRiderCatalogItems(
  services: ArtistServiceRecord[],
  profile: ArtistProfile | null,
): ArtistRiderItem[] {
  type Agg = {
    rowId: string;
    url?: string;
    title: string;
    description: string;
  };
  const byKey = new Map<string, Agg>();
  let idx = 0;

  for (const s of services) {
    const url = serviceTechnicalRiderPdfUrl(s);
    const fileId = (s.technicalRiderId ?? s.technicalRiderTemplateId)?.trim();
    if (fileId) {
      const prev = byKey.get(fileId);
      const label = nestedRiderLabel(s) || 'Rider técnico';
      if (!prev) {
        byKey.set(fileId, {
          rowId: fileId,
          url,
          title: label,
          description: (s.description ?? '').trim(),
        });
      } else {
        if (url && !prev.url) prev.url = url;
        const nl = nestedRiderLabel(s);
        if (nl && prev.title === 'Rider técnico') prev.title = nl;
      }
    } else if (url) {
      const rowId = `${CLIENT_LEGACY_RIDER_ROW_PREFIX}${s.id}`;
      byKey.set(rowId, {
        rowId,
        url,
        title: s.name.trim() || 'Rider técnico',
        description: (s.description ?? '').trim(),
      });
    }
  }

  const items: ArtistRiderItem[] = [];
  for (const g of byKey.values()) {
    items.push({
      id: g.rowId,
      title: g.title,
      description: g.description || 'Requisitos técnicos del artista para este tipo de presentación.',
      bulletItems: [],
      imageUrl: RIDER_SECTION_IMAGES[idx % RIDER_SECTION_IMAGES.length],
      documentUrl: g.url,
    });
    idx += 1;
  }

  if (items.length === 0) {
    const profileUrl = technicalRiderPdfFromProfile(profile);
    if (profileUrl) {
      items.push({
        id: CLIENT_PROFILE_RIDER_ROW_ID,
        title: 'Rider técnico',
        description: 'Documento técnico general del artista.',
        bulletItems: [],
        imageUrl: RIDER_SECTION_IMAGES[0],
        documentUrl: profileUrl,
      });
    }
  }

  return items.sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));
}

export function getLinkedServicesForClientRiderRow(
  riderRowId: string,
  services: ArtistServiceRecord[],
): { id: string; name: string }[] {
  if (riderRowId === CLIENT_PROFILE_RIDER_ROW_ID) {
    return services
      .map((s) => ({ id: s.id, name: s.name.trim() || 'Servicio' }))
      .filter((x) => x.name.length > 0);
  }
  if (riderRowId.startsWith(CLIENT_LEGACY_RIDER_ROW_PREFIX)) {
    const sid = riderRowId.slice(CLIENT_LEGACY_RIDER_ROW_PREFIX.length);
    const s = services.find((x) => x.id === sid);
    return s ? [{ id: s.id, name: s.name.trim() || 'Servicio' }] : [];
  }
  return services
    .filter((s) => (s.technicalRiderId ?? s.technicalRiderTemplateId)?.trim() === riderRowId)
    .map((s) => ({ id: s.id, name: s.name.trim() || 'Servicio' }))
    .filter((x) => x.name.length > 0);
}
