import type { ChangeEvent } from 'react';
import { FiBell, FiMail, FiSearch, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

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

type ClientAreaHeaderProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

export function ClientAreaHeader({ searchValue = '', onSearchChange }: ClientAreaHeaderProps) {
  const { user } = useAuth();
  const initials = getInitials(user?.displayName ?? null, user?.email ?? null);

  const controlledSearch = typeof onSearchChange === 'function';

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 pb-6 border-b border-white/10">
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
      <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0 order-1 sm:order-2">
        <button
          type="button"
          className="relative p-2 rounded-lg text-neutral-300 hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Notificaciones"
        >
          <FiBell size={20} />
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-[10px] font-semibold text-white flex items-center justify-center">
            3+
          </span>
        </button>
        <button
          type="button"
          className="p-2 rounded-lg text-neutral-300 hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Mensajes"
        >
          <FiMail size={20} />
        </button>
        <button
          type="button"
          className="p-2 rounded-lg text-neutral-300 hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Configuración"
        >
          <FiSettings size={20} />
        </button>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white text-sm font-semibold shrink-0"
          aria-hidden
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
      </div>
    </header>
  );
}
