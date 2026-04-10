import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { UserMenu } from '../components/UserMenu';

interface AuthenticatedLayoutProps {
  children?: ReactNode;
}

/**
 * Shared layout for all authenticated pages.
 * Includes the Topbar with UserMenu automatically.
 * Use as a wrapper for protected routes in App.tsx.
 */
export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Topbar right={<UserMenu />} />
      <main className="flex-1 flex flex-col">
        {children || <Outlet />}
      </main>
    </div>
  );
}
