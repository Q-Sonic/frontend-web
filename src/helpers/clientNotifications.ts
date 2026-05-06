export type ClientNotificationKind = 'contract_signed_pending_artist';

export type ClientNotificationRecord = {
  id: string;
  kind: ClientNotificationKind;
  createdAt: string;
  read: boolean;
  artistId?: string;
  artistDisplayName: string;
  serviceName?: string;
  /** Cart line id when the notification comes from batch signing */
  lineId?: string;
};

import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, query, where, orderBy, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';

const STORAGE_KEY = 'stagego_client_notifications_v1';
const MAX_ITEMS = 50;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getClientNotificationsStorageKey(): string {
  return STORAGE_KEY;
}

export function getClientNotifications(): ClientNotificationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is ClientNotificationRecord =>
        row &&
        typeof row === 'object' &&
        typeof (row as ClientNotificationRecord).id === 'string' &&
        typeof (row as ClientNotificationRecord).kind === 'string' &&
        typeof (row as ClientNotificationRecord).createdAt === 'string' &&
        typeof (row as ClientNotificationRecord).read === 'boolean' &&
        typeof (row as ClientNotificationRecord).artistDisplayName === 'string',
    );
  } catch {
    return [];
  }
}

function persistAndNotify(list: ClientNotificationRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('stagego-client-notifications-updated'));
}

export async function pushClientNotificationToFirestore(
  userId: string,
  notification: Omit<ClientNotificationRecord, 'id'>
): Promise<void> {
  try {
    const colRef = collection(db, 'users', userId, 'notifications');
    await addDoc(colRef, notification);
  } catch (err) {
    console.error('Error pushing notification to Firestore:', err);
  }
}

export function appendContractSignedPendingArtistNotifications(
  items: Array<{
    artistDisplayName?: string;
    artistId?: string;
    serviceName?: string;
    lineId?: string;
  }>,
): void {
  // Logic moved to context/caller for Firestore compatibility
  if (items.length === 0) return;
  // This helper will soon be deprecated or refactored
}

export function markClientNotificationRead(id: string): void {
  const list = getClientNotifications();
  const next = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  persistAndNotify(next);
}

export function markAllClientNotificationsRead(): void {
  const list = getClientNotifications();
  if (list.every((n) => n.read)) return;
  persistAndNotify(list.map((n) => ({ ...n, read: true })));
}

/** Short relative label for notification timestamps (es-ES). */
export function formatClientNotificationTimeEs(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 45) return 'Hace un momento';
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `Hace ${m} min`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `Hace ${h} h`;
  }
  const d = Math.floor(diffSec / 86400);
  if (d === 1) return 'Ayer';
  if (d < 7) return `Hace ${d} días`;
  return new Date(t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
