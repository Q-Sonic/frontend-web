import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackButton, Button, Card, PageLayout } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { uploadFile, getArtistProfile, updateArtistProfile } from '../../services';
import type { ArtistMediaItem } from '../../types';
import { isBackendRoleArtista } from '../../utils/role';
import { MEDIA_TYPE_OPTIONS, type MediaTypeOption } from '../../utils/mediaLimits';

function getMediaType(mime: string): ArtistMediaItem['type'] {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'image';
}

export function ArtistMediaPage() {
  const { user } = useAuth();
  const [mediaList, setMediaList] = useState<ArtistMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [roleBlocked, setRoleBlocked] = useState(false);
  const [selectedType, setSelectedType] = useState<MediaTypeOption>('image');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  const isArtista = isBackendRoleArtista(user?.role);
  const uid = user?.uid ?? '';
  const currentOption = MEDIA_TYPE_OPTIONS.find((o) => o.value === selectedType)!;

  useEffect(() => {
    if (!user || !isArtista) {
      if (!user) return;
      if (!isArtista) setRoleBlocked(true);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    getArtistProfile()
      .then((profile) => {
        if (cancelled) return;
        setMediaList(Array.isArray(profile.media) ? profile.media : []);
      })
      .catch(() => {
        if (!cancelled) setMediaList([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.uid, isArtista]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uid) return;
    if (file.size > currentOption.maxBytes) {
      setUploadError(`El archivo supera el límite de ${currentOption.maxLabel}.`);
      return;
    }
    setUploadError('');
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
  }

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  function clearPending() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  }

  async function handleUploadClick() {
    if (!pendingFile || !uid) return;
    setUploadError('');
    setIsUploading(true);
    try {
      const folder = `artist_media/${uid}`;
      const { url } = await uploadFile(pendingFile, { folder });
      const type = getMediaType(pendingFile.type);
      const item: ArtistMediaItem = { url, type, name: pendingFile.name };
      const newList = [...mediaList, item];
      await updateArtistProfile({ media: newList });
      setMediaList(newList);
      clearPending();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir el archivo.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove(url: string) {
    if (!uid) return;
    const newList = mediaList.filter((x) => x.url !== url);
    try {
      await updateArtistProfile({ media: newList });
      setMediaList(newList);
    } catch {
      setUploadError('No se pudo actualizar la galería en el perfil.');
    }
  }

  if (!user) return null;

  const backBtnClass = 'text-neutral-400 hover:text-white';
  const gradientBtn = 'bg-gradient-to-r from-violet-500 to-blue-600 text-white hover:opacity-90';

  if (isLoading) {
    return (
      <PageLayout title="Subir contenido multimedia" maxWidth="md" variant="dark" topContent={<BackButton className={backBtnClass} />}>
        <Card variant="dark" title="Mi contenido">
          <p className="text-neutral-500 text-sm">Cargando...</p>
        </Card>
      </PageLayout>
    );
  }

  if (roleBlocked) {
    return (
      <PageLayout title="Contenido multimedia" maxWidth="md" variant="dark" topContent={<BackButton className={backBtnClass} />}>
        <Card variant="dark" title="Multimedia">
          <p className="text-neutral-400 mb-4">Solo los artistas pueden subir contenido.</p>
          <Link to="/home">
            <Button variant="primary" className={gradientBtn}>Volver al inicio</Button>
          </Link>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Subir contenido multimedia" maxWidth="md" variant="dark" topContent={<BackButton className={backBtnClass} />}>
      <Card variant="dark" title="Mi contenido">
        <p className="text-neutral-400 text-sm mb-4">
          Elige el tipo de archivo, selecciona uno y revisa la vista previa. Luego pulsa &quot;Subir&quot; para guardarlo en tu perfil (visible para todos).
        </p>
        {uploadError && (
          <p className="text-sm text-red-400 bg-red-900/30 border border-red-800 p-2 rounded mb-4" role="alert">
            {uploadError}
          </p>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Tipo de archivo</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as MediaTypeOption);
                clearPending();
              }}
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {MEDIA_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — máximo {opt.maxLabel}
                </option>
              ))}
            </select>
            <p className="text-neutral-500 text-xs mt-1">
              Límite: {currentOption.maxLabel}. Formatos: {currentOption.value === 'image' ? 'JPEG, PNG, WebP, GIF' : currentOption.value === 'audio' ? 'MP3, WAV, WebM, OGG' : 'MP4, WebM.'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Seleccionar archivo</label>
            <input
              type="file"
              accept={currentOption.accept}
              onChange={handleFileSelect}
              disabled={!!pendingFile || isUploading}
              className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-neutral-700 file:font-medium file:text-white hover:file:bg-neutral-600 disabled:opacity-50"
            />
          </div>

          {pendingFile && pendingPreview && (
            <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-4 space-y-3">
              <p className="text-sm font-medium text-neutral-300">Vista previa</p>
              {selectedType === 'image' && (
                <img src={pendingPreview} alt="" className="max-h-48 w-full object-contain rounded" />
              )}
              {selectedType === 'audio' && (
                <audio controls src={pendingPreview} className="w-full">
                  Vista previa de audio
                </audio>
              )}
              {selectedType === 'video' && (
                <video controls src={pendingPreview} className="w-full max-h-48 rounded">
                  Vista previa de video
                </video>
              )}
              <p className="text-neutral-400 text-sm truncate">{pendingFile.name}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className={gradientBtn}
                >
                  {isUploading ? 'Subiendo...' : 'Subir'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearPending}
                  disabled={isUploading}
                  className="text-neutral-400 hover:text-white"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        {mediaList.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-neutral-300 mb-2">Contenido en tu perfil</h3>
            <div className="space-y-4">
              {mediaList.map((item) => (
                <div
                  key={item.url}
                  className="border border-neutral-700 rounded-lg p-3 bg-neutral-900/50 flex flex-col gap-2"
                >
                  {item.type === 'image' && (
                    <img
                      src={item.url}
                      alt={item.name ?? 'Media'}
                      className="max-h-40 w-full object-contain rounded"
                    />
                  )}
                  {item.type === 'audio' && (
                    <audio controls src={item.url} className="w-full">
                      Tu navegador no soporta audio.
                    </audio>
                  )}
                  {item.type === 'video' && (
                    <video controls src={item.url} className="w-full max-h-48 rounded">
                      Tu navegador no soporta video.
                    </video>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-neutral-400 truncate">
                      {item.name ?? item.type}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-400 hover:bg-red-900/30"
                      onClick={() => handleRemove(item.url)}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {mediaList.length === 0 && !pendingFile && !isUploading && (
          <p className="text-neutral-500 text-sm">Aún no has subido contenido. Se guarda en tu perfil y lo verán los clientes.</p>
        )}
      </Card>
    </PageLayout>
  );
}
