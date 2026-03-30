import { Navigate } from 'react-router-dom';
import { getDashboardPath } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { isBackendRoleCliente } from '../helpers/role';

interface ClienteOnlyRouteProps {
  children: React.ReactNode;
}

/** Restricts `/client/*` shell routes to role cliente. */
export function ClienteOnlyRoute({ children }: ClienteOnlyRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-neutral-500">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isBackendRoleCliente(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
}
