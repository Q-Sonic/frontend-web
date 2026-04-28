import type { CSSProperties, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiLogOut } from 'react-icons/fi';
import StageGoLogo from '../../public/icons/StageGoLogo';
import { useAuth } from '../contexts/AuthContext';

export interface SidebarMenuItem {
  to: string;
  label: string;
  icon?: ReactNode;
  /** If true, only an exact pathname match counts (no `/artist/foo` matching `/artist`). */
  exactPath?: boolean;
  /** Paths where this item should also show as active (e.g. `/artist/:id/gallery/edit` for Galería). */
  additionalActivePaths?: string[];
}

function splitPathAndHash(to: string): { path: string; hash: string } {
  const i = to.indexOf('#');
  if (i === -1) return { path: to, hash: '' };
  return { path: to.slice(0, i), hash: to.slice(i) };
}

/** Active when pathname matches; if `to` includes a hash, `location.hash` must match (empty hash counts as #description for profile top). */
export function isSidebarItemActive(
  pathname: string,
  hash: string,
  to: string,
  exactPath?: boolean,
): boolean {
  const { path, hash: itemHash } = splitPathAndHash(to);
  const locHash = hash || '';
  const pathMatches = exactPath
    ? pathname === path
    : pathname === path || (path.length > 0 && pathname.startsWith(`${path}/`));

  if (!pathMatches) return false;

  if (!itemHash) {
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  if (itemHash === '#description') {
    return locHash === '#description' || locHash === '' || locHash === '#';
  }

  return locHash === itemHash;
}

interface AppSidebarProps {
  /** Menu items; active state is derived from current pathname (and hash when `to` includes #fragment). */
  menuItems: SidebarMenuItem[];
  /** Optional section title above the menu (e.g. "Información"). */
  sectionTitle?: string;
  /** Optional content below the menu (e.g. cards, buttons). */
  footer?: ReactNode;
  /** Overrides default accent for the active item (e.g. artist profile nav). */
  activeNavColor?: string;
  /** When set, shows a back control and links logo + back to this path (e.g. `/artist`). */
  backHref?: string;
  profileIntro?: string;
  profileIntroRich?: ReactNode;
  profileIntroLoading?: boolean;
  onProfileIntroEdit?: () => void;
  mobileOpen?: boolean;
  onRequestCloseMobile?: () => void;
}

function Logo({ backHref }: { backHref?: string }) {
  if (backHref) {
    return (
      <div className="flex items-center gap-1 px-4 py-4">
        <Link
          to={backHref}
          className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/5 shrink-0 transition-colors"
          aria-label="Volver al dashboard"
        >
          <FiArrowLeft size={22} strokeWidth={2} />
        </Link>
        <Link
          to={backHref}
          className="flex items-baseline gap-1.5 min-w-0 opacity-90 hover:opacity-100 transition-opacity"
          aria-label="Ir al dashboard"
        >
          <StageGoLogo />
        </Link>
      </div>
    );
  }
  return (
    <Link to="/" className="flex items-baseline gap-1.5 px-4 py-4">
      <StageGoLogo />
    </Link>
  );
}

function activeNavStyle(color: string): CSSProperties {
  return {
    color,
    backgroundColor: `${color}26`,
  };
}

export function AppSidebar({
  menuItems,
  sectionTitle,
  footer,
  activeNavColor,
  backHref,
  profileIntro,
  profileIntroRich,
  profileIntroLoading,
  onProfileIntroEdit,
  mobileOpen = false,
  onRequestCloseMobile,
}: AppSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 w-64 flex flex-col h-full lg:h-screen p-4 transform transition-transform duration-200 ease-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:z-30`}
      style={{
        backgroundColor: 'var(--color-sidebar)',
        height: '100dvh', // Modern mobile height
      }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-color:rgba(255,255,255,0.12)_transparent]">
        <div className="shrink-0 mt-10 lg:mt-0">
          <Logo backHref={backHref} />
        </div>
        <nav className="flex flex-col mt-6">
          <div className="px-3 pb-4">
            <div className="mb-7">
              {onProfileIntroEdit && (
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={onProfileIntroEdit}
                    className="text-xs font-medium text-accent hover:text-accent/80 hover:underline shrink-0 cursor-pointer"
                  >
                    Editar
                  </button>
                </div>
              )}
              {profileIntroRich ? (
                <div className="pb-3 text-xs text-neutral-400 leading-relaxed">{profileIntroRich}</div>
              ) : profileIntroLoading ? (
                <div className="pb-3 space-y-2" aria-hidden>
                  <div className="h-2.5 rounded bg-white/10 w-full" />
                  <div className="h-2.5 rounded bg-white/10 w-[92%]" />
                  <div className="h-2.5 rounded bg-white/10 w-4/5" />
                </div>
              ) : profileIntro ? (
                <p className="text-xs text-neutral-400 leading-relaxed pb-3">{profileIntro}</p>
              ) : null}
            </div>

            {sectionTitle && (
              <p className="text-muted font-bold tracking-wider pt-1 pb-2">{sectionTitle}</p>
            )}
            <ul className="space-y-0.5">
              {menuItems.map((item) => {
                const extraActive = item.additionalActivePaths?.includes(location.pathname) ?? false;
                const isActive =
                  extraActive ||
                  isSidebarItemActive(location.pathname, location.hash, item.to, item.exactPath);
                const useCustomActive = isActive && activeNavColor;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onRequestCloseMobile}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        useCustomActive
                          ? ''
                          : isActive
                            ? 'bg-accent/20 text-accent'
                            : 'text-muted hover:bg-white/5 hover:text-white'
                      }`}
                      style={useCustomActive ? activeNavStyle(activeNavColor) : undefined}
                    >
                      {item.icon && <span className="shrink-0 w-5 flex items-center justify-center [&>svg]:size-[18px]">{item.icon}</span>}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          {footer && <div className="pt-2 border-t border-white/10 px-3 pb-1">{footer}</div>}
        </nav>
      </div>
      {user && (
        <div className="mt-auto shrink-0 border-t border-white/10 px-3 pt-3 pb-2">
          <button
            type="button"
            onClick={() => {
              onRequestCloseMobile?.();
              logout();
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-white/5 hover:text-white transition-colors"
          >
            <span className="shrink-0 w-5 flex items-center justify-center [&>svg]:size-[18px]">
              <FiLogOut aria-hidden />
            </span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </aside>
  );
}
