import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

interface AuthenticatedLayoutProps {
  children?: ReactNode;
}

/**
 * Shared layout for all authenticated pages.
 * Role shells (sidebar, headers) own their chrome; no global branded top bar.
 */
export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <main className="flex-1 flex flex-col min-h-0">
        {children || <Outlet />}
      </main>
    </div>
  );
}
