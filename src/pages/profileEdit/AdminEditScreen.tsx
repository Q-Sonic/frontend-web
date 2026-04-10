import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { updateUser } from '../../api/userService';
import { uploadFile } from '../../api/storageService';
import { getRequiredError } from '../../helpers/validation';

export function AdminEditScreen() {
  const navigate = useNavigate();
  const { user, setUser, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.photoURL ?? null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const nameError = getRequiredError(displayName);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitted(true);
    if (nameError) return;

    setIsSubmitting(true);
    try {
      let photoURL = user.photoURL;
      if (avatarFile) {
        const { url } = await uploadFile(avatarFile);
        photoURL = url;
      }
      const updated = await updateUser(user.uid, {
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
    <div className="max-w-md mx-auto w-full px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Editar Perfil (Admin)</h1>
      <Card variant="dark" title="Configuración de cuenta">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-violet-500" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center text-3xl font-bold text-neutral-500 border-2 border-neutral-700">
                  {displayName[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-neutral-700">
              Cambiar foto
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <Input
            label="Nombre público"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={isSubmitted ? nameError : undefined}
            variant="dark"
            required
          />

          <div className="flex gap-3 pt-4 border-t border-neutral-800">
            <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            <Button type="button" variant="ghost" fullWidth onClick={() => navigate('/profile')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
