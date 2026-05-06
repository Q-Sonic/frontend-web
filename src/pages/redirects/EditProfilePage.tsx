import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProfileEditPath } from '../../config';
import { AccountProfileEditPage } from '../account';

export function EditProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const path = getProfileEditPath(user.role);
  if (path === '/profile/edit') return <AccountProfileEditPage />;
  return <Navigate to={path} replace />;
}
