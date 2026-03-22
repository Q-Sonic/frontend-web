import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isBackendRoleArtista } from '../../helpers/role';

/** Resolves `/artist/profile` to `/artist/:uid` for the signed-in artist. */
export function ArtistProfileIdRedirect() {
  const { user } = useAuth();

  if (!user?.uid) return <Navigate to="/login" replace />;
  if (!isBackendRoleArtista(user.role)) return <Navigate to="/profile" replace />;

  return <Navigate to={`/artist/${user.uid}`} replace />;
}
