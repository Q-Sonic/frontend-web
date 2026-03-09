import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProfileEditRoute } from '../../utils/role';

export function ProfileRedirectPage() {
  const { user } = useAuth();

  if (!user) return null;

  const route = getProfileEditRoute(user.role);

  return <Navigate to={`/profile/${route}`} replace />;
}
