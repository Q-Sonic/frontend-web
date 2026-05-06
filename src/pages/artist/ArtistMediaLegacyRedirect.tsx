import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/** Old URL `/artist/media` → canonical profile route with the same sidebar as the rest of the perfil. */
export function ArtistMediaLegacyRedirect() {
  const { user } = useAuth();
  const uid = user?.uid;
  if (!uid) return <Navigate to="/login" replace />;
  return <Navigate to={`/artist/${uid}/gallery/edit`} replace />;
}
