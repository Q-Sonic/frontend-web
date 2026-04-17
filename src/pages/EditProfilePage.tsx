import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfileEditPath } from '../config';
import { AccountProfileEditPage } from './account';

/**
 * Redirects the user to their role-specific profile edit page.
 * Falls back to the standard account profile edit page if no specific route exists.
 */
export function EditProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const path = getProfileEditPath(user.role);
  
  // If the path is the generic edit route, render the account fallback
  if (path === '/profile/edit') {
    return <AccountProfileEditPage />;
  }
  
  return <Navigate to={path} replace />;
}
