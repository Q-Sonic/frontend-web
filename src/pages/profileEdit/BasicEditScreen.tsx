import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, PageLayout } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { updateUser } from '../../services/userService';
import { uploadFile } from '../../services/storageService';
import { getRequiredError } from '../../utils/validation';

export function BasicEditScreen() {
  const navigate = useNavigate();
  const { user, setUser, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.photoURL ?? null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;
  const currentUser = user;

  const nameError = getRequiredError(displayName);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarFile(null);
      setAvatarPreview(currentUser.photoURL ?? null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitted(true);
    if (nameError) return;

    setIsSubmitting(true);
    try {
      let photoURL = currentUser.photoURL;
      if (avatarFile) {
        const { url } = await uploadFile(avatarFile);
        photoURL = url;
      }
      const updated = await updateUser(currentUser.uid, {
        displayName: displayName.trim() || undefined,
        photoURL,
      });
      setUser(updated);
      await refreshUser();
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout title="Editar perfil" maxWidth="md">
      <Card title="Edita tu perfil">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
              {error}
            </p>
          )}
          {(avatarPreview || avatarFile) && (
            <div className="flex justify-center">
              <img
                src={avatarPreview ?? undefined}
                alt=""
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Foto (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-neutral-100 file:font-medium file:text-neutral-900 hover:file:bg-neutral-200"
            />
          </div>
          <Input
            label="Nombre"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={isSubmitted ? nameError : undefined}
            required
          />
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
