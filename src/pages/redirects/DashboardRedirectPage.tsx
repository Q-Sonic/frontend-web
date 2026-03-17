import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardPath } from '../../config';
import { AccountDashboardPage } from '../account';

export function HomeRedirectPage() {
  const { user } = useAuth();

  if (!user) return null;

  const path = getDashboardPath(user.role);
  if (path === '/dashboard') return <AccountDashboardPage />;
  return <Navigate to={path} replace />;
}
