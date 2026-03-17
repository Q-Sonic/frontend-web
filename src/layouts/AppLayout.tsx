import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Default layout for all authenticated screens: only main content area with bg-surface.
 * No sidebar; use SidebarLayout for routes that need the sidebar.
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      <main className="min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}
