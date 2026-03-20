import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackButton, Button, Card, Skeleton, SkeletonText } from '../../components';
import { PageLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { getClientProfile } from '../../api/clientProfileService';
import { ApiError } from '../../api';
import { isBackendRoleCliente } from '../../helpers/role';
import { withMinimumDelay } from '../../helpers/withMinimumDelay';

export function ProfileClientePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<{ name?: string; phone?: string; location?: string; photo?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const isCliente = isBackendRoleCliente(user?.role);

  useEffect(() => {
    if (!user) return;

    if (!isCliente) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const data = await withMinimumDelay(1000, () => getClientProfile());
        if (cancelled) return;
        setProfile(data);
        setNotFound(false);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.uid, isCliente]);

  if (!user) return null;

  if (!isCliente) {
    return (
      <PageLayout title="Perfil" maxWidth="md" variant="dark" topContent={<BackButton className="text-neutral-400 hover:text-white" />}>
        <Card variant="dark" title="Perfil de cliente">
          <p className="text-neutral-600 mb-4">
            Tu cuenta no tiene perfil de cliente. Puedes ver tu perfil.
          </p>
          <Link to="/profile">
            <Button variant="primary">Ver perfil</Button>
          </Link>
        </Card>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout title="Perfil" maxWidth="md" variant="dark" topContent={<BackButton className="text-neutral-400 hover:text-white" />}>
        <Card variant="dark" title="Tu perfil (cliente)">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Skeleton className="h-24 w-24 rounded-full opacity-70" />
            </div>
            <SkeletonText lines={7} />
          </div>
        </Card>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Perfil" maxWidth="md" variant="dark" topContent={<BackButton className="text-neutral-400 hover:text-white" />}>
        <Card variant="dark" title="Perfil">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/client/profile/edit">
            <Button variant="secondary">Editar perfil</Button>
          </Link>
        </Card>
      </PageLayout>
    );
  }

  const displayName = profile?.name ?? user.displayName ?? '—';
  const phone = profile?.phone ?? '—';
  const location = profile?.location ?? '—';
  const photo = profile?.photo ?? user.photoURL;

  return (
    <PageLayout title="Perfil" maxWidth="md" variant="dark" topContent={<BackButton className="text-neutral-400 hover:text-white" />}>
      <Card variant="dark" title="Tu perfil (cliente)">
        <div className="space-y-4">
          {notFound && (
            <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
              Aún no has completado tu perfil. Puedes hacerlo ahora.
            </p>
          )}
          {photo && (
            <div className="flex justify-center">
              <img
                src={photo}
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
            <div>
              <dt className="text-sm font-medium text-neutral-500">Nombre</dt>
              <dd className="text-neutral-900">{displayName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-500">Teléfono</dt>
              <dd className="text-neutral-900">{phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-500">Ubicación</dt>
              <dd className="text-neutral-900">{location}</dd>
            </div>
          </dl>
          <div className="flex gap-2 pt-2">
            <Link to="/client/profile/edit" className="flex-1">
              <Button variant="primary" fullWidth>Editar perfil</Button>
            </Link>
            <Button variant="ghost" onClick={logout}>Cerrar sesión</Button>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}
