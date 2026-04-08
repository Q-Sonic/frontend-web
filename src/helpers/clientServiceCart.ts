export type ServiceCartLine = {
  id: string;
  artistId: string;
  serviceId: string;
  serviceName: string;
  price: number;
  /** YYYY-MM-DD keys; may be empty if the user only saved the service */
  selectedDateKeys: string[];
  addedAt: string;
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
