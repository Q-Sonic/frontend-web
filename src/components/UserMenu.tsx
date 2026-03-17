import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfilePath } from '../config';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [open]);

  if (!user) return null;

  const avatarUrl = user.photoURL;
  const initial = (user.displayName ?? user.email).charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-400"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Menú de usuario"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-neutral-200"
          />
        ) : (
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-200 text-neutral-700 font-medium text-sm">
            {initial}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-lg shadow-lg border border-neutral-200">
          <Link
            to={getProfilePath(user.role)}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Perfil
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
