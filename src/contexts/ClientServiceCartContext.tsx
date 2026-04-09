import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import { ClientBatchContractSigningModal } from '../components/client/ClientBatchContractSigningModal';
import { useClientNotifications } from './ClientNotificationsContext';
import {
  appendSignedCartMockRecord,
  getServiceCartLines,
  getServiceCartStorageKey,
  removeServiceCartLine,
  type ServiceCartLine,
} from '../helpers/clientServiceCart';

type ClientServiceCartContextValue = {
  lines: ServiceCartLine[];
  lineCount: number;
  openSigningModal: () => void;
};

const ClientServiceCartContext = createContext<ClientServiceCartContextValue | null>(null);

export function useClientServiceCart(): ClientServiceCartContextValue {
  const ctx = useContext(ClientServiceCartContext);
  if (!ctx) {
    throw new Error('useClientServiceCart must be used within ClientServiceCartProvider');
  }
  return ctx;
}

export function useClientServiceCartOptional(): ClientServiceCartContextValue | null {
  return useContext(ClientServiceCartContext);
}

function ClientServiceCartFloatingButton({
  onOpen,
  lineCount,
}: {
  onOpen: () => void;
  lineCount: number;
}) {
  const location = useLocation();
  const showFab = lineCount > 0 && location.pathname.startsWith('/client/artists/');
  if (!showFab) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed bottom-[5.75rem] right-6 z-[35] flex h-14 w-14 items-center justify-center rounded-full border border-[#00CCCB]/50 bg-[#111214] text-[#00CCCB] shadow-[0_0_20px_rgba(0,204,203,0.35)] transition hover:bg-[#00CCCB]/10"
      aria-label={`Carrito de reservas, ${lineCount} ítems`}
    >
      <FiShoppingCart size={24} strokeWidth={2} aria-hidden />
      <span className="pointer-events-none absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00CCCB] px-1 text-[10px] font-bold text-[#0a0c10] tabular-nums">
        {lineCount > 9 ? '9+' : lineCount}
      </span>
    </button>
  );
}

export function ClientServiceCartProvider({ children }: { children: ReactNode }) {
  const { pushSignedContractNotifications } = useClientNotifications();
  const [lines, setLines] = useState<ServiceCartLine[]>(() => getServiceCartLines());
  const [signingOpen, setSigningOpen] = useState(false);

  const sync = useCallback(() => {
    setLines(getServiceCartLines());
  }, []);

  useEffect(() => {
    const cartKey = getServiceCartStorageKey();
    const onStorage = (e: StorageEvent) => {
      if (e.key === cartKey || e.key === null) sync();
    };
    const onCustom = () => sync();
    window.addEventListener('storage', onStorage);
    window.addEventListener('stagego-service-cart-updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('stagego-service-cart-updated', onCustom);
    };
  }, [sync]);

  const openSigningModal = useCallback(() => {
    setSigningOpen(true);
  }, []);

  const closeSigningModal = useCallback(() => setSigningOpen(false), []);

  const onComplete = useCallback(
    async (payload: { dataUrl: string; signedLines: ServiceCartLine[] }) => {
      const { signedLines } = payload;
      if (signedLines.length === 0) return;
      appendSignedCartMockRecord({
        signedAt: new Date().toISOString(),
        signatureDataUrl: payload.dataUrl,
        applyToAll: signedLines.length > 1,
        artistSignatureComplete: false,
        lines: signedLines,
      });
      pushSignedContractNotifications(signedLines);
      for (const line of signedLines) {
        removeServiceCartLine(line.id);
      }
      sync();
      if (getServiceCartLines().length === 0) {
        setSigningOpen(false);
      }
    },
    [pushSignedContractNotifications, sync],
  );

  const value = useMemo(
    (): ClientServiceCartContextValue => ({
      lines,
      lineCount: lines.length,
      openSigningModal,
    }),
    [lines, openSigningModal],
  );

  return (
    <ClientServiceCartContext.Provider value={value}>
      {children}
      <ClientServiceCartFloatingButton onOpen={openSigningModal} lineCount={lines.length} />
      <ClientBatchContractSigningModal
        isOpen={signingOpen}
        onClose={closeSigningModal}
        lines={lines}
        onComplete={onComplete}
      />
    </ClientServiceCartContext.Provider>
  );
}
