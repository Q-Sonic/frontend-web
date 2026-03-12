import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isBackendRoleAdmin } from '../utils/role';

interface AdminOnlyRouteProps {
  children: React.ReactNode;
}

export function AdminOnlyRoute({ children }: AdminOnlyRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-500">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isBackendRoleAdmin(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
