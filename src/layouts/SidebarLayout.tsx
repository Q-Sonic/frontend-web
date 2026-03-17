import type { ReactNode } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { UserMenu } from '../components/UserMenu';
import type { SidebarMenuItem } from '../components/AppSidebar';

export interface SidebarLayoutSidebar {
  menuItems: SidebarMenuItem[];
  sectionTitle?: string;
  footer?: ReactNode;
}

interface SidebarLayoutProps {
  sidebar: SidebarLayoutSidebar;
  children: ReactNode;
}

/**
 * Layout with sidebar + header (UserMenu) for routes that need the main navigation menu.
 */
export function SidebarLayout({ sidebar, children }: SidebarLayoutProps) {
  return (
    <div className="min-h-screen flex bg-surface">
      <AppSidebar
        menuItems={sidebar.menuItems}
        sectionTitle={sidebar.sectionTitle}
        footer={sidebar.footer}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 flex items-center justify-end px-4 border-b border-white/10">
          <UserMenu />
        </header>
        <main className="p-6 overflow-auto mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
