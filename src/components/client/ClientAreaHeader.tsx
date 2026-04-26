import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiBell, FiSearch, FiShoppingCart, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useClientNotifications } from '../../contexts/ClientNotificationsContext';
import { useClientServiceCartOptional } from '../../contexts/ClientServiceCartContext';
import { Skeleton } from '../Skeleton';
import {
  formatClientNotificationTimeEs,
  type ClientNotificationRecord,
} from '../../helpers/clientNotifications';

function getInitials(displayName: string | null | undefined, email: string | null | undefined): string {
  const n = displayName?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const e = email?.trim();
  if (e) return e.slice(0, 2).toUpperCase();
  return 'ST';
}

function notificationBody(n: ClientNotificationRecord): string {
  if (n.kind === 'contract_signed_pending_artist') {
    return `Firmaste el contrato con ${n.artistDisplayName}. Pendiente la firma del artista.`;
  }
  return '';
}

type ClientAreaHeaderProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** When false, hides the search field and only shows the toolbar (e.g. calendar page). Default true. */
  showSearch?: boolean;
  className?: string;
};

export function ClientAreaHeader({
  searchValue = '',
  onSearchChange,
  showSearch = true,
  className = '',
}: ClientAreaHeaderProps) {
  const { user } = useAuth();
  const serviceCart = useClientServiceCartOptional();
  const { notifications: list, unreadCount: unread, loading: notificationsLoading, markAllRead } = useClientNotifications();
  const initials = getInitials(user?.displayName ?? null, user?.email ?? null);

  const [panelOpen, setPanelOpen] = useState(false);
  const bellWrapRef = useRef<HTMLDivElement>(null);

  const controlledSearch = typeof onSearchChange === 'function';

  const closePanel = useCallback(() => setPanelOpen(false), []);

  useEffect(() => {
    if (!panelOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (bellWrapRef.current && !bellWrapRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen]);

  const togglePanel = () => {
    setPanelOpen((o) => !o);
  };

  return (
    <header
      className={
        showSearch
          ? `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 pb-6 border-b border-white/10 ${className}`.trim()
          : `flex justify-end items-center gap-2 sm:gap-3 pb-2 ${className}`.trim()
      }
    >
      {showSearch ? (
        <div className="flex-1 flex justify-center sm:justify-start min-w-0 order-2 sm:order-1 w-full max-w-full sm:max-w-none">
          <label className="relative w-full max-w-xl">
            <span className="sr-only">Buscar</span>
            <FiSearch
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
              size={18}
              aria-hidden
            />
            <input
              type="search"
              placeholder="buscar artista, genero o ciudad"
              className="w-full rounded-xl bg-black/40 border border-white/10 pl-11 pr-10 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent/40"
              {...(controlledSearch
                ? {
                    value: searchValue,
                    onChange: (e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value),
                  }
                : {})}
            />
            {searchValue.length > 0 && onSearchChange && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </label>
        </div>
      ) : null}
      <div
        className={
          showSearch
            ? 'flex items-center justify-end gap-2 sm:gap-3 shrink-0 order-1 sm:order-2'
            : 'flex items-center justify-end gap-2 sm:gap-3 shrink-0'
        }
      >
        {/* Notifications Bell */}
        <div className="relative" ref={bellWrapRef}>
          <button
            type="button"
            onClick={togglePanel}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-black/40 text-neutral-400 transition hover:bg-white/10 hover:text-white"
            aria-label={`Ver ${unread} notificaciones`}
            aria-expanded={panelOpen}
          >
            <FiBell size={20} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-black ring-2 ring-black">
                {unread > 9 ? '+9' : unread}
              </span>
            )}
          </button>

          {panelOpen && (
            <div className="absolute right-0 top-full z-40 mt-3 w-80 rounded-2xl border border-white/10 bg-[#0c0e12] p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Notificaciones
                </span>
                {unread > 0 && markAllRead && (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="text-[11px] font-medium text-accent hover:underline"
                  >
                    Marcar todo como leído
                  </button>
                )}
              </div>
              <div className="h-px bg-white/5 mx-1" />
              <div className="max-h-80 overflow-y-auto pt-1">
                {notificationsLoading ? (
                  <div className="space-y-1 px-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="px-3 py-3 space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                      </div>
                    ))}
                  </div>
                ) : list.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-neutral-500">Sin notificaciones nuevas</p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {list.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          className="w-full rounded-xl px-3 py-3 text-left transition hover:bg-white/5 group"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-medium text-neutral-100 group-hover:text-white leading-snug">
                              {notificationBody(n)}
                            </p>
                            {!n.read && (
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-neutral-500">
                            {formatClientNotificationTimeEs(n.createdAt)}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Link */}
        <Link
          to="/client/profile"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white text-sm font-semibold shrink-0"
          aria-label="Ir a mi perfil"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </Link>
      </div>
    </header>
  );
}
