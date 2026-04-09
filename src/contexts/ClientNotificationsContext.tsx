import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ServiceCartLine } from '../helpers/clientServiceCart';
import {
  appendContractSignedPendingArtistNotifications,
  getClientNotifications,
  getClientNotificationsStorageKey,
  markAllClientNotificationsRead,
  markClientNotificationRead,
  type ClientNotificationRecord,
} from '../helpers/clientNotifications';

type ClientNotificationsContextValue = {
  notifications: ClientNotificationRecord[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  pushSignedContractNotifications: (lines: ServiceCartLine[]) => void;
};

const ClientNotificationsContext = createContext<ClientNotificationsContextValue | null>(null);

export function useClientNotifications(): ClientNotificationsContextValue {
  const ctx = useContext(ClientNotificationsContext);
  if (!ctx) {
    throw new Error('useClientNotifications must be used within ClientNotificationsProvider');
  }
  return ctx;
}

export function useClientNotificationsOptional(): ClientNotificationsContextValue | null {
  return useContext(ClientNotificationsContext);
}

export function ClientNotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<ClientNotificationRecord[]>(() =>
    getClientNotifications(),
  );

  const sync = useCallback(() => {
    setNotifications(getClientNotifications());
  }, []);

  useEffect(() => {
    const key = getClientNotificationsStorageKey();
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) sync();
    };
    const onCustom = () => sync();
    window.addEventListener('storage', onStorage);
    window.addEventListener('stagego-client-notifications-updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('stagego-client-notifications-updated', onCustom);
    };
  }, [sync]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markRead = useCallback((id: string) => {
    markClientNotificationRead(id);
    sync();
  }, [sync]);

  const markAllRead = useCallback(() => {
    markAllClientNotificationsRead();
    sync();
  }, [sync]);

  const pushSignedContractNotifications = useCallback((lines: ServiceCartLine[]) => {
    appendContractSignedPendingArtistNotifications(
      lines.map((line) => ({
        artistId: line.artistId,
        artistDisplayName: line.artistDisplayName,
        serviceName: line.serviceName,
        lineId: line.id,
      })),
    );
  }, []);

  const value = useMemo(
    (): ClientNotificationsContextValue => ({
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      pushSignedContractNotifications,
    }),
    [notifications, unreadCount, markRead, markAllRead, pushSignedContractNotifications],
  );

  return (
    <ClientNotificationsContext.Provider value={value}>{children}</ClientNotificationsContext.Provider>
  );
}
