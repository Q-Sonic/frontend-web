export type ServiceCartLine = {
  id: string;
  artistId: string;
  serviceId: string;
  serviceName: string;
  price: number;
  /** YYYY-MM-DD keys; may be empty if the user only saved the service */
  selectedDateKeys: string[];
  addedAt: string;
  /** Denormalized for cart / modal UI without extra requests */
  artistDisplayName?: string;
  artistPhotoUrl?: string;
  locationLabel?: string;
  /** Copied from `ArtistServiceRecord.features` when adding to cart */
  serviceFeatures?: string[];
  /** Optional client notes captured during booking. */
  serviceDetails?: string;
};

const SIGNED_MOCK_STORAGE_KEY = 'stagego_client_signed_cart_mock_v1';

export const STAGEGO_CLIENT_SIGNED_RECORDS_UPDATED_EVENT = 'stagego-client-signed-records-updated';

export type SignedCartMockRecord = {
  signedAt: string;
  signatureDataUrl: string;
  applyToAll: boolean;
  lines: ServiceCartLine[];
  /** Cuando el artista también firmó (mock / API futura). Si falta o es false → pendiente (cliente ya firmó). */
  artistSignatureComplete?: boolean;
};

const STORAGE_KEY = 'stagego_client_service_cart_v1';

function newLineId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getServiceCartLines(): ServiceCartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is ServiceCartLine =>
        row &&
        typeof row === 'object' &&
        typeof (row as ServiceCartLine).id === 'string' &&
        typeof (row as ServiceCartLine).serviceId === 'string',
    );
  } catch {
    return [];
  }
}

export function addServiceCartLine(
  payload: Omit<ServiceCartLine, 'id' | 'addedAt'>,
): ServiceCartLine {
  const items = getServiceCartLines();
  const line: ServiceCartLine = {
    ...payload,
    id: newLineId(),
    addedAt: new Date().toISOString(),
  };
  items.push(line);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('stagego-service-cart-updated'));
  return line;
}

export function removeServiceCartLine(id: string): void {
  const items = getServiceCartLines().filter((row) => row.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('stagego-service-cart-updated'));
}

export function clearServiceCart(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('stagego-service-cart-updated'));
}

function isSignedCartMockRecord(row: unknown): row is SignedCartMockRecord {
  if (!row || typeof row !== 'object') return false;
  const r = row as SignedCartMockRecord;
  return (
    typeof r.signedAt === 'string' &&
    typeof r.signatureDataUrl === 'string' &&
    typeof r.applyToAll === 'boolean' &&
    Array.isArray(r.lines)
  );
}

export function getSignedCartMockStorageKey(): string {
  return SIGNED_MOCK_STORAGE_KEY;
}

export function getSignedCartMockRecords(): SignedCartMockRecord[] {
  try {
    const raw = localStorage.getItem(SIGNED_MOCK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSignedCartMockRecord);
  } catch {
    return [];
  }
}

export function appendSignedCartMockRecord(record: SignedCartMockRecord): void {
  try {
    const raw = localStorage.getItem(SIGNED_MOCK_STORAGE_KEY);
    let prev: SignedCartMockRecord[] = [];
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) prev = parsed.filter(isSignedCartMockRecord);
    }
    prev.push(record);
    localStorage.setItem(SIGNED_MOCK_STORAGE_KEY, JSON.stringify(prev));
    window.dispatchEvent(new CustomEvent(STAGEGO_CLIENT_SIGNED_RECORDS_UPDATED_EVENT));
  } catch {
    /* ignore quota / parse errors */
  }
}

/** When the artist also signs (or for manual QA). `recordIndex` is the order in `getSignedCartMockRecords()`. */
export function setSignedCartRecordArtistComplete(recordIndex: number, complete: boolean): void {
  const list = getSignedCartMockRecords();
  if (recordIndex < 0 || recordIndex >= list.length) return;
  const next = list.map((r, i) =>
    i === recordIndex ? { ...r, artistSignatureComplete: complete } : r,
  );
  try {
    localStorage.setItem(SIGNED_MOCK_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(STAGEGO_CLIENT_SIGNED_RECORDS_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}

/** For cross-tab sync in `ClientServiceCartProvider`. */
export function getServiceCartStorageKey(): string {
  return STORAGE_KEY;
}
