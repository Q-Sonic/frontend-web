import { Link } from 'react-router-dom';
import { Button, Card, PageLayout } from '../../components';
import { useAuth } from '../../contexts/AuthContext';

export function ProfileBasicoPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <PageLayout title="Perfil" maxWidth="md" variant="dark">
      <Card variant="dark" title="Tu perfil">
        <div className="space-y-4">
          {user.photoURL && (
            <div className="flex justify-center">
              <img
                src={user.photoURL}
                alt=""
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
          )}
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-neutral-500">Correo electrónico</dt>
              <dd className="text-neutral-900">{user.email}</dd>
            </div>
            {user.displayName && (
              <div>
                <dt className="text-sm font-medium text-neutral-500">Nombre</dt>
                <dd className="text-neutral-900">{user.displayName}</dd>
              </div>
            )}
            {user.role && (
              <div>
                <dt className="text-sm font-medium text-neutral-500">Rol</dt>
                <dd className="text-neutral-900">{user.role}</dd>
              </div>
            )}
          </dl>
          <div className="flex gap-2 pt-2">
            <Link to="/profile/edit" className="flex-1">
              <Button variant="primary" fullWidth>Editar perfil</Button>
            </Link>
            <Button variant="ghost" onClick={logout}>Cerrar sesión</Button>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}
