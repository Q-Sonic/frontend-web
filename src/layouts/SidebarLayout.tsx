import { useState, type ReactNode } from 'react';
import { FiMenu } from 'react-icons/fi';
import { AppSidebar } from '../components/AppSidebar';
import type { SidebarMenuItem } from '../components/AppSidebar';

export interface SidebarLayoutSidebar {
  menuItems: SidebarMenuItem[];
  sectionTitle?: string;
  footer?: ReactNode;
  /** When set, active menu items use this color (text + tinted background). */
  activeNavColor?: string;
  /** Sidebar header: link target for back control (e.g. artist dashboard). */
  backHref?: string;
  /** Short text shown above the section title (e.g. profile biography). */
  profileIntro?: string;
  /** Rich intro (e.g. name in accent + bio). Takes precedence over `profileIntro` when set. */
  profileIntroRich?: ReactNode;
  profileIntroLoading?: boolean;
  /** When set, shows an "Editar" control beside the Descripción label (e.g. `/artist/profile/edit`). */
  onProfileIntroEdit?: () => void;
}

interface SidebarLayoutProps {
  sidebar: SidebarLayoutSidebar;
  children: ReactNode;
}

/**
 * Layout with sidebar + header (UserMenu) for routes that need the main navigation menu.
 */
export function SidebarLayout({ sidebar, children }: SidebarLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex overflow-x-hidden bg-surface">
      <button
        type="button"
        onClick={() => setIsMobileSidebarOpen(true)}
        className="lg:hidden fixed left-4 top-4 z-50 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-card text-accent border border-accent/30 hover:bg-[#272727] transition-colors"
        aria-label="Abrir menú lateral"
      >
        <FiMenu size={20} />
      </button>
      {isMobileSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity"
          aria-label="Cerrar menú lateral"
        />
      )}
      <div className="hidden lg:block w-64 shrink-0" aria-hidden />
      <AppSidebar
        menuItems={sidebar.menuItems}
        sectionTitle={sidebar.sectionTitle}
        footer={sidebar.footer}
        activeNavColor={sidebar.activeNavColor}
        backHref={sidebar.backHref}
        profileIntro={sidebar.profileIntro}
        profileIntroRich={sidebar.profileIntroRich}
        profileIntroLoading={sidebar.profileIntroLoading}
        onProfileIntroEdit={sidebar.onProfileIntroEdit}
        mobileOpen={isMobileSidebarOpen}
        onRequestCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-14 lg:pt-0">{children}</main>
      </div>
    </div>
  );
}
