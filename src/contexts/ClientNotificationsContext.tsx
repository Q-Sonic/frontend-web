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
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  writeBatch 
} from 'firebase/firestore';
import {
  pushClientNotificationToFirestore,
  type ClientNotificationRecord,
} from '../helpers/clientNotifications';

type ClientNotificationsContextValue = {
  notifications: ClientNotificationRecord[];
  unreadCount: number;
  loading: boolean;
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

export function ClientNotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ClientNotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const colRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: ClientNotificationRecord[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ClientNotificationRecord);
      });
      setNotifications(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markRead = useCallback(async (id: string) => {
    if (!user?.uid) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'notifications', id);
      await updateDoc(docRef, { read: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [user?.uid]);

  const markAllRead = useCallback(async () => {
    if (!user?.uid || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.read) {
          const docRef = doc(db, 'users', user.uid!, 'notifications', n.id);
          batch.update(docRef, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user?.uid, notifications]);

  const pushSignedContractNotifications = useCallback(async (lines: ServiceCartLine[]) => {
    if (!user?.uid || lines.length === 0) return;
    
    const now = new Date().toISOString();
    for (const line of lines) {
      await pushClientNotificationToFirestore(user.uid, {
        kind: 'contract_signed_pending_artist',
        createdAt: now,
        read: false,
        artistId: line.artistId,
        artistDisplayName: line.artistDisplayName || 'Artista',
        serviceName: line.serviceName,
        lineId: line.id,
      });
    }
  }, [user?.uid]);

  const value = useMemo(
    (): ClientNotificationsContextValue => ({
      notifications,
      unreadCount,
      loading,
      markRead,
      markAllRead,
      pushSignedContractNotifications,
    }),
    [notifications, unreadCount, loading, markRead, markAllRead, pushSignedContractNotifications],
  );

  return (
    <ClientNotificationsContext.Provider value={value}>
      {children}
    </ClientNotificationsContext.Provider>
  );
}
