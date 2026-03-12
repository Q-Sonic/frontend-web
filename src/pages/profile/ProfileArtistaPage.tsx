import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackButton, Button, Card, PageLayout } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { getArtistProfile } from '../../services/artistProfileService';
import type { ArtistSocialNetworks, ArtistMediaItem } from '../../types';
import { ApiError } from '../../utils';
import { isBackendRoleArtista } from '../../utils/role';
import { sanitizeOptionalString } from '../../utils/validation';

const EMPTY_PLACEHOLDER = 'Sin información';

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
    biography?: string;
    city?: string;
    socialNetworks?: ArtistSocialNetworks;
    photo?: string;
    media?: ArtistMediaItem[];
  } | null>(null);
  const [mediaList, setMediaList] = useState<ArtistMediaItem[]>([]);
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
          setMediaList(Array.isArray(data.media) ? data.media : []);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          setProfile(null);
          setMediaList([]);
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

  const backBtnClass = 'text-neutral-400 hover:text-white';
  const gradientBtn = 'bg-gradient-to-r from-violet-500 to-blue-600 text-white hover:opacity-90';

  if (!isArtista) {
    return (
      <PageLayout title="Perfil" maxWidth="md" variant="dark" topContent={<BackButton className={backBtnClass} />}>
        <Card variant="dark" title="Perfil de artista">
          <p className="text-neutral-400 mb-4">Tu cuenta no tiene perfil de artista.</p>
          <Link to="/profile/basico">
            <Button variant="primary" className={gradientBtn}>Ver perfil básico</Button>
          </Link>
        </Card>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout title="Perfil" maxWidth="md" variant="dark">
        <p className="text-neutral-500">Cargando...</p>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Perfil" maxWidth="md" variant="dark" topContent={<BackButton className={backBtnClass} />}>
        <Card variant="dark" title="Perfil">
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/profile/edit">
            <Button variant="secondary" className="border-neutral-600 text-neutral-300">Editar perfil</Button>
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
  const artistName = displayValue(user?.displayName ?? undefined);

  return (
    <PageLayout title="Perfil" maxWidth="md" variant="dark" topContent={<BackButton className={backBtnClass} />}>
      <div className="space-y-6">
        <Card variant="dark" title="Datos">
          <div className="space-y-3">
            {showPhoto && photoDisplay && (
              <div className="flex justify-center">
                <img src={photoDisplay} alt="" className="w-24 h-24 rounded-full object-cover" />
              </div>
            )}
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-neutral-500">Nombre</dt>
                <dd className="text-white">{artistName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Correo</dt>
                <dd className="text-white">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Ciudad</dt>
                <dd className="text-white">{displayValue(profile?.city)}</dd>
              </div>
              {Object.keys(socialNetworks).length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-neutral-500 mb-1">Redes sociales</dt>
                  <dd className="space-y-1">
                    {(Object.entries(socialNetworks) as [keyof ArtistSocialNetworks, string][]).map(
                      ([key, value]) =>
                        value ? (
                          <a key={key} href={value} target="_blank" rel="noopener noreferrer" className="block text-violet-400 hover:underline">
                            {SOCIAL_LABELS[key]}: {value}
                          </a>
                        ) : null
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </Card>

        <Card variant="dark" title="Biografía">
          <p className="text-neutral-300 whitespace-pre-wrap">{displayValue(profile?.biography)}</p>
        </Card>

        <Card variant="dark" title="Multimedia">
          {mediaList.length === 0 ? (
            <p className="text-neutral-500 text-sm">Aún no hay contenido multimedia.</p>
          ) : (
            <div className="space-y-3">
              {mediaList.map((item) => (
                <div key={item.url} className="rounded-lg border border-neutral-700 overflow-hidden bg-neutral-900/50">
                  {item.type === 'image' && (
                    <img src={item.url} alt={item.name ?? 'Media'} className="w-full max-h-48 object-contain" />
                  )}
                  {item.type === 'audio' && (
                    <audio controls src={item.url} className="w-full">Audio</audio>
                  )}
                  {item.type === 'video' && (
                    <video controls src={item.url} className="w-full max-h-48">Video</video>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/artist/media">
              <Button variant="primary" className={gradientBtn}>Subir contenido</Button>
            </Link>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link to="/profile/edit/artista">
            <Button variant="primary" className={gradientBtn}>Editar perfil</Button>
          </Link>
          <Button variant="ghost" onClick={logout} className="text-neutral-400 hover:text-white hover:bg-neutral-800">
            Cerrar sesión
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
