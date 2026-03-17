import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProfilePath } from '../../config';
import { AccountProfilePage } from '../account';

export function ProfileRedirectPage() {
  const { user } = useAuth();

  if (!user) return null;

  const path = getProfilePath(user.role);
  if (path === '/profile') return <AccountProfilePage />;
  return <Navigate to={path} replace />;
}
