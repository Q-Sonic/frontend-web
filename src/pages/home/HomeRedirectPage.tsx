import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardPath } from '../../config';
import { DashboardPage as AccountDashboardPage } from '../account/DashboardPage';

/**
 * Redirects the user to their role-specific home page.
 * If no specific dashboard path is found, falls back to the account dashboard.
 */
export function HomeRedirectPage() {
  const { user } = useAuth();

  if (!user) return null;

  const path = getDashboardPath(user.role);
  
  // If the dashboard path points to itself, render the fallback account dashboard
  if (path === '/dashboard') {
    return <AccountDashboardPage />;
  }
  
  return <Navigate to={path} replace />;
}
