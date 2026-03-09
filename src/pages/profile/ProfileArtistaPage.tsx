import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackButton, Button, Card, PageLayout } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { getArtistProfile } from '../../services/artistProfileService';
import type { ArtistSocialNetworks } from '../../types';
import { ApiError } from '../../utils';
import { isBackendRoleArtista } from '../../utils/role';
import { sanitizeOptionalString } from '../../utils/validation';

const EMPTY_PLACEHOLDER = 'No information yet';

function displayValue(value: string | null | undefined): string {
  return sanitizeOptionalString(value) || EMPTY_PLACEHOLDER;
}

const SOCIAL_LABELS: Record<keyof ArtistSocialNetworks, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

export function ProfileArtistaPage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<{
    name?: string;
    biography?: string;
    city?: string;
    socialNetworks?: ArtistSocialNetworks;
    photo?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const isArtista = isBackendRoleArtista(user?.role);

  useEffect(() => {
    if (!user) return;

    if (!isArtista) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    getArtistProfile()
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          setNotFound(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.uid, isArtista]);

  if (!user) return null;

  if (!isArtista) {
    return (
      <PageLayout title="Perfil" maxWidth="md" topContent={<BackButton />}>
        <Card title="Perfil de artista">
          <p className="text-neutral-600 mb-4">
            Tu cuenta no tiene perfil de artista. Puedes ver tu perfil básico.
          </p>
          <Link to="/profile/basico">
            <Button variant="primary">Ver perfil básico</Button>
          </Link>
        </Card>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout title="Perfil" maxWidth="md">
        <p className="text-neutral-500">Cargando...</p>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Perfil" maxWidth="md" topContent={<BackButton />}>
        <Card title="Perfil">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/profile/edit">
            <Button variant="secondary">Editar perfil</Button>
          </Link>
        </Card>
      </PageLayout>
    );
  }

  const photoDisplay = profile?.photo ?? user.photoURL;
  const showPhoto = !!sanitizeOptionalString(photoDisplay);
  const rawSocial = profile?.socialNetworks ?? {};
  const socialNetworks: ArtistSocialNetworks = {};
  for (const key of Object.keys(rawSocial) as (keyof ArtistSocialNetworks)[]) {
    const v = sanitizeOptionalString(rawSocial[key]);
    if (v) socialNetworks[key] = v;
  }
  const artistName = displayValue((profile as { name?: string })?.name ?? user?.displayName);

  return (
    <PageLayout title="Perfil" maxWidth="md" topContent={<BackButton />}>
      <Card title="Tu perfil (artista)">
        <div className="space-y-4">
          {notFound && (
            <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
              Aún no has completado tu perfil. Puedes hacerlo ahora.
            </p>
          )}
          {showPhoto && photoDisplay && (
            <div className="flex justify-center">
              <img
                src={photoDisplay}
                alt=""
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
          )}
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-neutral-500">Nombre</dt>
              <dd className="text-neutral-900">{artistName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-500">Correo electrónico</dt>
              <dd className="text-neutral-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-500">Biografía</dt>
              <dd className="text-neutral-900">{displayValue(profile?.biography)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-500">Ciudad</dt>
              <dd className="text-neutral-900">{displayValue(profile?.city)}</dd>
            </div>
            {Object.keys(socialNetworks).length > 0 && (
              <div>
                <dt className="text-sm font-medium text-neutral-500 mb-1">Redes sociales</dt>
                <dd className="space-y-1">
                  {(Object.entries(socialNetworks) as [keyof ArtistSocialNetworks, string][]).map(
                    ([key, value]) =>
                      value ? (
                        <div key={key}>
                          <span className="text-neutral-500">{SOCIAL_LABELS[key]}: </span>
                          <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-900 underline"
                          >
                            {value}
                          </a>
                        </div>
                      ) : null
                  )}
                </dd>
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
