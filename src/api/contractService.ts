import type { ContractRecord, CreateContractBody } from '../types/contract';
import type { ApiResponse } from '../types';
import type { ServiceCartLine, SignedCartMockRecord } from '../helpers/clientServiceCart';
import { api, getIdToken } from './client';

export const STAGEGO_CLIENT_CONTRACTS_API_REFRESH_EVENT = 'stagego-client-contracts-api-refresh';

export function dispatchContractsApiRefresh(): void {
  window.dispatchEvent(new CustomEvent(STAGEGO_CLIENT_CONTRACTS_API_REFRESH_EVENT));
}

function stringFromUnknown(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t || undefined;
}

/**
 * Merges snake_case / legacy keys from the API into `ContractRecord` so the client UI can show
 * artist name and photo without further changes when the backend adds them.
 */
function enrichContractRecord(row: ContractRecord): ContractRecord {
  const x = row as ContractRecord & Record<string, unknown>;
  const artistDisplayName =
    stringFromUnknown(x.artistDisplayName) ||
    stringFromUnknown(x.artist_display_name) ||
    stringFromUnknown(x['artistName']);
  const artistPhotoUrl =
    stringFromUnknown(x.artistPhotoUrl) ||
    stringFromUnknown(x.artist_photo_url) ||
    stringFromUnknown(x.image_url) ||
    stringFromUnknown(x.artistImageUrl);
  const out: ContractRecord = { ...row };
  if (artistDisplayName) out.artistDisplayName = artistDisplayName;
  if (artistPhotoUrl) out.artistPhotoUrl = artistPhotoUrl;
  return out;
}

function rawContractArrayFromPayload(body: unknown): ContractRecord[] {
  if (Array.isArray(body)) {
    return body as ContractRecord[];
  }
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (Array.isArray(o.data)) {
      return o.data as ContractRecord[];
    }
    if (o.data && typeof o.data === 'object') {
      const inner = o.data as Record<string, unknown>;
      if (Array.isArray(inner.contracts)) {
        return inner.contracts as ContractRecord[];
      }
      if (Array.isArray(inner.items)) {
        return inner.items as ContractRecord[];
      }
    }
    if (Array.isArray(o.contracts)) {
      return o.contracts as ContractRecord[];
    }
  }
  return [];
}

function normalizeContractListPayload(body: unknown): ContractRecord[] {
  return rawContractArrayFromPayload(body).map(enrichContractRecord);
}

/**
 * GET /contracts/my-history — requires cliente auth.
 * Returns [] if unauthenticated or on failure (caller may treat as "no server data").
 */
export async function fetchMyContractHistorySafe(): Promise<ContractRecord[]> {
  if (!getIdToken()) return [];
  try {
    const raw = await api<unknown>('contracts/my-history');
    return normalizeContractListPayload(raw);
  } catch {
    return [];
  }
}

export async function fetchMyContractHistory(): Promise<ContractRecord[]> {
  const raw = await api<unknown>('contracts/my-history');
  return normalizeContractListPayload(raw);
}

export async function createContract(body: CreateContractBody): Promise<ContractRecord | undefined> {
  const res = await api<ApiResponse<ContractRecord> | ContractRecord>('contracts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (res && typeof res === 'object' && 'data' in res && (res as ApiResponse<ContractRecord>).data) {
    return (res as ApiResponse<ContractRecord>).data;
  }
  if (res && typeof res === 'object' && 'id' in res) {
    return res as ContractRecord;
  }
  return undefined;
}

function dateKeyFromLineFallback(line: ServiceCartLine): string {
  const t = Date.parse(line.addedAt);
  if (!Number.isNaN(t)) {
    const dt = new Date(t);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function buildCreateBodiesForLine(
  line: ServiceCartLine,
  signatureDataUrl?: string,
  acceptedTerms?: boolean,
): CreateContractBody[] {
  const location = line.locationLabel?.trim() || 'Por definir';
  const keys =
    line.selectedDateKeys.length > 0 ? [...line.selectedDateKeys].sort() : [dateKeyFromLineFallback(line)];
  const perDate =
    line.selectedDateKeys.length > 0
      ? Math.round((line.price / line.selectedDateKeys.length) * 100) / 100
      : line.price;

  return keys.map((dateKey) => ({
    artistId: line.artistId,
    serviceId: line.serviceId,
    totalAmount: Number.isFinite(perDate) ? perDate : 0,
    eventDetails: {
      name: line.serviceName,
      date: `${dateKey}T12:00:00.000Z`,
      location,
    },
    clientSignatureDataUrl: signatureDataUrl,
    acceptedTerms: acceptedTerms,
  }));
}

/**
 * POST /contracts once per selected date per cart line. Throws if any request fails.
 */
export async function createContractsForSignedLines(
  signedLines: ServiceCartLine[],
  signatureDataUrl?: string,
  acceptedTerms?: boolean,
): Promise<ContractRecord[]> {
  const bodies: CreateContractBody[] = [];
  for (const line of signedLines) {
    bodies.push(...buildCreateBodiesForLine(line, signatureDataUrl, acceptedTerms));
  }
  const results: ContractRecord[] = [];
  for (const body of bodies) {
    const res = await createContract(body);
    if (res) results.push(res);
  }
  return results;
}

function dateKeyFromContractEvent(dateRaw: unknown): string | null {
  if (typeof dateRaw === 'string') {
    const head = dateRaw.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
    const t = Date.parse(dateRaw);
    if (!Number.isNaN(t)) {
      const d = new Date(t);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }
  if (dateRaw && typeof dateRaw === 'object' && '_seconds' in dateRaw) {
    const s = Number((dateRaw as { _seconds: number })._seconds);
    if (!Number.isFinite(s)) return null;
    const d = new Date(s * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return null;
}

function signedAtIsoFromContract(c: ContractRecord): string {
  const dk = dateKeyFromContractEvent(c.eventDetails?.date);
  if (dk) return `${dk}T12:00:00.000Z`;
  return new Date().toISOString();
}

/**
 * Maps API contracts to the same shape the client calendar uses for localStorage-backed records.
 */
export function contractRecordsToSignedMockRecords(contracts: ContractRecord[]): SignedCartMockRecord[] {
  const out: SignedCartMockRecord[] = [];
  for (const c of contracts) {
    const name = c.eventDetails?.name?.trim();
    const dateKey = dateKeyFromContractEvent(c.eventDetails?.date);
    if (!name || !dateKey || !c.id) continue;
    const artistComplete = c.status === 'ACCEPTED' || c.status === 'COMPLETED';
    const signedAt = signedAtIsoFromContract(c);
    out.push({
      signedAt,
      signatureDataUrl: '',
      applyToAll: false,
      artistSignatureComplete: artistComplete,
      lines: [
        {
          id: `api-contract-${c.id}`,
          artistId: c.artistId?.trim() || '__api__',
          serviceId: c.serviceId?.trim() || '__service__',
          serviceName: name,
          price: typeof c.financials?.totalAmount === 'number' ? c.financials.totalAmount : 0,
          selectedDateKeys: [dateKey],
          addedAt: signedAt,
          artistDisplayName: c.artistDisplayName?.trim() || 'Artista',
          locationLabel: c.eventDetails?.location?.trim(),
        },
      ],
    });
  }
  return out;
}

export async function fetchSignedCartMockRecordsFromApi(): Promise<SignedCartMockRecord[]> {
  const rows = await fetchMyContractHistorySafe();
  return contractRecordsToSignedMockRecords(rows);
}
