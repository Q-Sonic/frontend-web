import { Link } from 'react-router-dom';
import { Button, Card } from '../../components';
import { useAuth } from '../../contexts/AuthContext';

export function ProfileAdminPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto w-full px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Mi Perfil (Admin)</h1>
      <Card variant="dark" title="Datos de la cuenta">
        <div className="space-y-6">
          <div className="flex justify-center">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="" 
                className="w-28 h-28 rounded-full object-cover border-4 border-violet-500/20 shadow-xl" 
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-neutral-800 flex items-center justify-center text-4xl font-bold text-neutral-500 border-4 border-neutral-700">
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Correo electrónico</dt>
              <dd className="mt-1 text-lg text-white">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Nombre</dt>
              <dd className="mt-1 text-white">{user.displayName || 'No especificado'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Rol</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-400/10 text-red-400 capitalize">
                  {user.role}
                </span>
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 pt-4">
            <Link to="/profile/edit">
              <Button variant="primary" fullWidth>Editar perfil</Button>
            </Link>
            <Button variant="ghost" onClick={logout} fullWidth>Cerrar sesión</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
