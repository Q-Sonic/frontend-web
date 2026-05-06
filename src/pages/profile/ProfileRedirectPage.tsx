import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProfilePath } from '../../config';
import { AccountProfilePage } from '../account/ProfilePage';

/**
 * Redirects the user to their role-specific profile page.
 * Falls back to the generic account profile page if no specific route exists.
 */
export function ProfileRedirectPage() {
  const { user } = useAuth();

  if (!user) return null;

  const path = getProfilePath(user.role);
  
  // If the profile path points to the generic /profile, render the fallback page
  if (path === '/profile') {
    return <AccountProfilePage />;
  }
  
  return <Navigate to={path} replace />;
}
