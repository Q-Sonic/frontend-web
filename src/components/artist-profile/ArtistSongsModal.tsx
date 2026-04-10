import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import { Button } from '../Button';
import {
  createArtistSongWithFormData,
  deleteArtistSong,
  getMyArtistSongs,
  updateArtistSongWithFormData,
} from '../../api';
import type { ArtistProfile, ArtistSongRecord } from '../../types';

type ArtistSongsModalProps = {
  isOpen: boolean;
  profile: (ArtistProfile & { uid: string }) | null;
  artistDisplayName: string;
  onClose: () => void;
  onSongsChange: (songs: ArtistSongRecord[]) => void;
};

export function ArtistSongsModal({ isOpen, profile, artistDisplayName, onClose, onSongsChange }: ArtistSongsModalProps) {
  const [songsState, setSongsState] = useState<ArtistSongRecord[]>([]);
  const [editingSongId, setEditingSongId] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [newAudioPreview, setNewAudioPreview] = useState('');
  const [newCoverPreview, setNewCoverPreview] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const subtleScrollbarClass =
    'scrollbar-thin [scrollbar-color:rgba(255,255,255,0.20)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30';

  const songs = useMemo<ArtistSongRecord[]>(() => songsState, [songsState]);

  useEffect(() => {
    if (!isOpen) {
      setEditingSongId('');
      setTitleDraft('');
      setNewTitle('');
      setNewAudioFile(null);
      setNewCoverFile(null);
      setNewAudioPreview('');
      setNewCoverPreview('');
      setUploadStatus('idle');
      setIsSaving(false);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (newAudioPreview.startsWith('blob:')) URL.revokeObjectURL(newAudioPreview);
      if (newCoverPreview.startsWith('blob:')) URL.revokeObjectURL(newCoverPreview);
    };
  }, [newAudioPreview, newCoverPreview]);

  const loadSongs = async () => {
    const list = await getMyArtistSongs();
    setSongsState(list);
    onSongsChange(list);
  };

  useEffect(() => {
    if (!isOpen || !profile) return;
    void loadSongs().catch((err) => {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las canciones.');
    });
  }, [isOpen, profile?.uid]);

  if (!isOpen || !profile) return null;

  const startEdit = (song: ArtistSongRecord) => {
    setEditingSongId(song.id);
    setTitleDraft(song.title);
    setError('');
  };

  const saveEdit = async () => {
    if (!editingSongId || !titleDraft.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      await updateArtistSongWithFormData(editingSongId, { title: titleDraft.trim() });
      await loadSongs();
      setEditingSongId('');
      setTitleDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la canción.');
    } finally {
      setIsSaving(false);
    }
  };

  const markAsFeatured = async (id: string) => {
    setIsSaving(true);
    setError('');
    try {
      await updateArtistSongWithFormData(id, { isFeatured: true });
      await loadSongs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo marcar como destacada.');
    } finally {
      setIsSaving(false);
    }
  };

  const addSong = async () => {
    if (!newAudioFile) {
      setError('Selecciona un archivo de audio.');
      return;
    }
    setIsSaving(true);
    setUploadStatus('uploading');
    setError('');
    try {
      await createArtistSongWithFormData({
        title: newTitle.trim(),
        audio: newAudioFile,
        cover: newCoverFile,
      });
      await loadSongs();
      setNewAudioFile(null);
      setNewCoverFile(null);
      setNewAudioPreview('');
      setNewCoverPreview('');
      setNewTitle('');
      setUploadStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la canción.');
      setUploadStatus('idle');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSong = async (id: string) => {
    setIsSaving(true);
    setError('');
    try {
      await deleteArtistSong(id);
      const list = await getMyArtistSongs();
      setSongsState(list);
      onSongsChange(list);
      if (editingSongId === id) {
        setEditingSongId('');
        setTitleDraft('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la canción.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`w-full max-w-5xl rounded-3xl border border-[#00d4c8]/35 bg-[#111214] p-6 ${subtleScrollbarClass}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-4xl font-semibold text-white">Musica</h3>
          <button type="button" onClick={onClose} className="rounded-full border border-white/20 p-2 text-white/70 hover:text-white">
            <FiX />
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="mb-4 rounded-2xl border border-[#00d4c8]/30 p-3">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                setUploadStatus('idle');
              }}
              placeholder="Nombre de la canción"
              className="rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white"
            />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/25 px-4 py-2 text-white">
              <FiUpload /> Audio
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setNewAudioFile(file);
                  setUploadStatus('idle');
                  if (newAudioPreview.startsWith('blob:')) URL.revokeObjectURL(newAudioPreview);
                  setNewAudioPreview(file ? URL.createObjectURL(file) : '');
                }}
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/25 px-4 py-2 text-white">
              <FiUpload /> Portada
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setNewCoverFile(file);
                  setUploadStatus('idle');
                  if (newCoverPreview.startsWith('blob:')) URL.revokeObjectURL(newCoverPreview);
                  setNewCoverPreview(file ? URL.createObjectURL(file) : '');
                }}
              />
            </label>
            <Button onClick={addSong} loading={isSaving}>
              {uploadStatus === 'uploading' ? 'Subiendo...' : uploadStatus === 'success' ? 'Subida completa' : '+ Agregar canción'}
            </Button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-3">
              <p className="mb-2 text-xs text-white/60">Preview audio</p>
              {newAudioPreview ? (
                <audio controls className="w-full" src={newAudioPreview} />
              ) : (
                <p className="text-xs text-white/40">Selecciona un audio para escuchar preview.</p>
              )}
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <p className="mb-2 text-xs text-white/60">Preview portada</p>
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/30">
                {newCoverPreview ? (
                  <img src={newCoverPreview} alt="Portada preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/40">Sin portada seleccionada</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`max-h-[420px] overflow-auto rounded-2xl border border-white/10 bg-white/5 ${subtleScrollbarClass}`}>
          <div className="p-4">
            <p className="mb-3 text-3xl text-white">Musica</p>
            <div className="space-y-2">
              {songs.map((song) => (
                <div key={song.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2">
                  <div className="h-14 w-24 overflow-hidden rounded-md bg-black/30">
                    {song.coverUrl && <img src={song.coverUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-2xl font-semibold text-white">{song.title}</p>
                    <p className="truncate text-sm text-white/60">{artistDisplayName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={song.isFeatured ? 'secondary' : 'outline'}
                      onClick={() => markAsFeatured(song.id)}
                      disabled={isSaving || song.isFeatured}
                    >
                      {song.isFeatured ? 'Destacada' : 'Marcar destacada'}
                    </Button>
                    {editingSongId === song.id ? (
                      <>
                        <input
                          value={titleDraft}
                          onChange={(e) => setTitleDraft(e.target.value)}
                          className="w-56 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white"
                        />
                        <Button variant="secondary" onClick={saveEdit} disabled={isSaving}>Guardar</Button>
                      </>
                    ) : (
                      <Button variant="outline" onClick={() => startEdit(song)} disabled={isSaving}>
                        <FiEdit2 /> Editar
                      </Button>
                    )}
                    <Button variant="danger" onClick={() => deleteSong(song.id)} disabled={isSaving}>
                      <FiTrash2 /> Eliminar
                    </Button>
                  </div>
                </div>
              ))}
              {songs.length === 0 && <p className="text-sm text-white/60">No tienes canciones cargadas.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
