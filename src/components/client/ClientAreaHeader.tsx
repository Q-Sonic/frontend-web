import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiBell, FiSearch, FiShoppingCart } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useClientNotificationsOptional } from '../../contexts/ClientNotificationsContext';
import { useClientServiceCartOptional } from '../../contexts/ClientServiceCartContext';
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
  const notifications = useClientNotificationsOptional();
  const initials = getInitials(user?.displayName ?? null, user?.email ?? null);

  const [panelOpen, setPanelOpen] = useState(false);
  const bellWrapRef = useRef<HTMLDivElement>(null);

  const controlledSearch = typeof onSearchChange === 'function';

  const unread = notifications?.unreadCount ?? 0;
  const list = notifications?.notifications ?? [];

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
              className="w-full rounded-xl bg-black/40 border border-white/10 pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent/40"
              {...(controlledSearch
                ? {
                    value: searchValue,
                    onChange: (e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value),
                  }
                : {})}
            />
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
        <div className="relative" ref={bellWrapRef}>
          <button
            type="button"
            className="relative p-2 rounded-lg text-neutral-300 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Notificaciones"
            aria-expanded={panelOpen}
            aria-haspopup="true"
            onClick={togglePanel}
          >
            <FiBell size={20} />
            {unread > 0 ? (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-[10px] font-semibold text-white flex items-center justify-center tabular-nums">
                {unread > 9 ? '9+' : unread}
              </span>
            ) : null}
          </button>
          {panelOpen ? (
            <div
              className="absolute right-0 top-[calc(100%+0.5rem)] z-60 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#111214] shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
              role="dialog"
              aria-label="Notificaciones"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <p className="text-sm font-semibold text-white">Notificaciones</p>
                {unread > 0 && notifications ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-[#00d4c8] hover:underline"
                    onClick={() => notifications.markAllRead()}
                  >
                    Marcar todo leído
                  </button>
                ) : null}
              </div>
              <div className="max-h-[min(70vh,20rem)] overflow-y-auto scrollbar-thin [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
                {list.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-white/45">Sin notificaciones por ahora</p>
                ) : (
                  <ul className="divide-y divide-white/6">
                    {list.map((n) => {
                      const body = notificationBody(n);
                      const timeLabel = formatClientNotificationTimeEs(n.createdAt);
                      const unreadRow = !n.read;
                      const rowClass = unreadRow
                        ? 'bg-[#00d4c8]/[0.07] hover:bg-[#00d4c8]/[0.11]'
                        : 'hover:bg-white/[0.04]';

                      const inner = (
                        <>
                          <p
                            className={`text-sm leading-snug ${unreadRow ? 'text-white' : 'text-white/85'}`}
                          >
                            {body}
                          </p>
                          {n.serviceName ? (
                            <p className="mt-1 text-xs text-white/40 truncate">{n.serviceName}</p>
                          ) : null}
                          <p className="mt-1.5 text-[11px] text-white/35">{timeLabel}</p>
                        </>
                      );

                      if (n.artistId) {
                        return (
                          <li key={n.id}>
                            <Link
                              to={`/client/artists/${n.artistId}`}
                              className={`block px-4 py-3 transition-colors ${rowClass}`}
                              onClick={() => {
                                notifications?.markRead(n.id);
                                closePanel();
                              }}
                            >
                              {inner}
                            </Link>
                          </li>
                        );
                      }

                      return (
                        <li key={n.id}>
                          <button
                            type="button"
                            className={`w-full text-left px-4 py-3 transition-colors ${rowClass}`}
                            onClick={() => {
                              notifications?.markRead(n.id);
                              closePanel();
                            }}
                          >
                            {inner}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => serviceCart?.openSigningModal()}
          className="relative p-2 rounded-lg text-neutral-300 hover:bg-white/5 hover:text-white transition-colors"
          aria-label={
            serviceCart && serviceCart.lineCount > 0
              ? `Carrito de reservas, ${serviceCart.lineCount} ítems`
              : 'Carrito de reservas'
          }
        >
          <FiShoppingCart size={20} />
          {serviceCart && serviceCart.lineCount > 0 ? (
            <span className="absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#00d4c8] px-1 text-[10px] font-bold text-[#0a0c10] tabular-nums">
              {serviceCart.lineCount > 9 ? '9+' : serviceCart.lineCount}
            </span>
          ) : null}
        </button>
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
