import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card, PageLayout } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { getArtistProfile, updateArtistProfile } from '../../services/artistProfileService';
import { uploadFile } from '../../services/storageService';
import type { ArtistSocialNetworks } from '../../types';
import { ApiError } from '../../utils';
import { isBackendRoleArtista } from '../../utils/role';
import { getUrlError, sanitizeOptionalString } from '../../utils/validation';

const SOCIAL_KEYS: (keyof ArtistSocialNetworks)[] = [
  'instagram',
  'facebook',
  'twitter',
  'youtube',
  'tiktok',
];

const SOCIAL_LABELS: Record<keyof ArtistSocialNetworks, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

export function ArtistEditScreen() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [biography, setBiography] = useState('');
  const [city, setCity] = useState('');
  const [socialNetworks, setSocialNetworks] = useState<ArtistSocialNetworks>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roleBlocked, setRoleBlocked] = useState(false);

  const isArtista = isBackendRoleArtista(user?.role);

  useEffect(() => {
    if (!user) return;

    if (!isArtista) {
      setRoleBlocked(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setInfoMessage('');
    setError('');

    getArtistProfile()
      .then((data) => {
        if (cancelled) return;
        setBiography(sanitizeOptionalString(data.biography));
        setCity(sanitizeOptionalString(data.city));
        const raw = data.socialNetworks ?? {};
        const sanitized: ArtistSocialNetworks = {};
        for (const key of SOCIAL_KEYS) {
          const v = sanitizeOptionalString(raw[key]);
          if (v) sanitized[key] = v;
        }
        setSocialNetworks(sanitized);
        const photoVal = sanitizeOptionalString(data.photo);
        setPhoto(photoVal ? data.photo ?? null : null);
        setPhotoPreview(photoVal ? data.photo ?? null : null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          if (err.status === 404) {
            setInfoMessage('Aún no has completado tu perfil. Puedes hacerlo ahora.');
          } else if (err.status === 403) {
            setError('No tienes permiso para editar el perfil de artista.');
          } else {
            setError(err.message || 'No se pudo cargar el perfil.');
          }
        } else {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.uid, isArtista]);

  const socialErrors: Partial<Record<keyof ArtistSocialNetworks, string>> = {};
  for (const key of SOCIAL_KEYS) {
    const err = getUrlError(socialNetworks[key]);
    if (err) socialErrors[key] = err;
  }
  const hasSocialErrors = Object.keys(socialErrors).length > 0;

  function setSocial(key: keyof ArtistSocialNetworks, value: string) {
    setSocialNetworks((prev) => ({ ...prev, [key]: value.trim() || undefined }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoFile(null);
      setPhotoPreview(photo);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitted(true);
    if (hasSocialErrors) return;

    setIsSubmitting(true);
    try {
      let photoUrl = photo;
      if (photoFile) {
        const { url } = await uploadFile(photoFile);
        photoUrl = url;
      }
      const cleanPhoto = sanitizeOptionalString(photoUrl ?? '');
      const cleanBio = sanitizeOptionalString(biography);
      const cleanCity = sanitizeOptionalString(city);
      const cleanSocial: ArtistSocialNetworks = {};
      for (const key of SOCIAL_KEYS) {
        const v = sanitizeOptionalString(socialNetworks[key]);
        if (v) cleanSocial[key] = v;
      }
      await updateArtistProfile({
        biography: cleanBio || undefined,
        city: cleanCity || undefined,
        socialNetworks: Object.keys(cleanSocial).length > 0 ? cleanSocial : undefined,
        photo: cleanPhoto || undefined,
      });
      await refreshUser();
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <PageLayout title="Editar perfil" maxWidth="md">
        <p className="text-neutral-500">Cargando...</p>
      </PageLayout>
    );
  }

  if (roleBlocked) {
    return (
      <PageLayout title="Editar perfil" maxWidth="md">
        <Card title="Perfil de artista">
          <p className="text-neutral-600 mb-4">
            Tu cuenta no tiene perfil de artista. Usa la edición básica para actualizar tu nombre y foto.
          </p>
          <Link to="/profile/edit/basico">
            <Button variant="primary">Ir a edición básica</Button>
          </Link>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Editar perfil" maxWidth="md">
      <Card title="Edita tu perfil (artista)">
        <form onSubmit={handleSubmit} className="space-y-4">
          {infoMessage && (
            <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded" role="status">
              {infoMessage}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
              {error}
            </p>
          )}
          {(photoPreview || photoFile) && (
            <div className="flex justify-center">
              <img
                src={photoPreview ?? undefined}
                alt=""
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Foto</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-neutral-100 file:font-medium file:text-neutral-900 hover:file:bg-neutral-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Biografía</label>
            <textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="Cuéntanos sobre ti"
            />
          </div>
          <Input
            label="Ciudad"
            type="text"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-2">Redes sociales</span>
            <div className="space-y-2">
              {SOCIAL_KEYS.map((key) => (
                <Input
                  key={key}
                  label={SOCIAL_LABELS[key]}
                  type="url"
                  placeholder="https://..."
                  value={socialNetworks[key] ?? ''}
                  onChange={(e) => setSocial(key, e.target.value)}
                  error={isSubmitted ? socialErrors[key] : undefined}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/profile')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
}
