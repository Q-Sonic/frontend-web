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
  const [editingCoverFile, setEditingCoverFile] = useState<File | null>(null);
  const [editingCoverPreview, setEditingCoverPreview] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [newAudioPreview, setNewAudioPreview] = useState('');
  const [newCoverPreview, setNewCoverPreview] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [editSavingSongId, setEditSavingSongId] = useState<string | null>(null);

  const subtleScrollbarClass =
    'scrollbar-thin [scrollbar-color:rgba(255,255,255,0.20)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30';

  const songs = useMemo<ArtistSongRecord[]>(() => songsState, [songsState]);

  useEffect(() => {
    if (!isOpen) {
      setEditingSongId('');
      setTitleDraft('');
      setEditingCoverFile(null);
      setEditingCoverPreview('');
      setNewTitle('');
      setNewAudioFile(null);
      setNewCoverFile(null);
      setNewAudioPreview('');
      setNewCoverPreview('');
      setUploadStatus('idle');
      setIsSaving(false);
      setEditSavingSongId(null);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (editingCoverPreview.startsWith('blob:')) URL.revokeObjectURL(editingCoverPreview);
      if (newAudioPreview.startsWith('blob:')) URL.revokeObjectURL(newAudioPreview);
      if (newCoverPreview.startsWith('blob:')) URL.revokeObjectURL(newCoverPreview);
    };
  }, [editingCoverPreview, newAudioPreview, newCoverPreview]);

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
    setEditingCoverFile(null);
    setEditingCoverPreview('');
    setError('');
  };

  const saveEdit = async () => {
    if (!editingSongId || !titleDraft.trim()) {
      setError('El nombre de la canción es obligatorio.');
      return;
    }
    setIsSaving(true);
    setEditSavingSongId(editingSongId);
    setError('');
    try {
      await updateArtistSongWithFormData(editingSongId, {
        title: titleDraft.trim(),
        cover: editingCoverFile,
      });
      await loadSongs();
      setEditingSongId('');
      setTitleDraft('');
      setEditingCoverFile(null);
      setEditingCoverPreview('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la canción.');
    } finally {
      setIsSaving(false);
      setEditSavingSongId(null);
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
    if (!newTitle.trim()) {
      setError('Escribe un nombre para la canción.');
      return;
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className={`max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-[#00d4c8]/25 bg-[#0f1115] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:p-6 ${subtleScrollbarClass}`}>
        <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Gestionar música</h3>
            <p className="mt-1 text-sm text-neutral-400">Sube canciones, edita títulos y define la destacada.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white/35 hover:bg-white/5 hover:text-white">
            <FiX />
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-3 text-sm font-semibold text-white">Agregar nueva canción</p>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                setUploadStatus('idle');
              }}
              placeholder="Nombre de la canción"
              className="h-11 rounded-xl border border-white/20 bg-black/30 px-3.5 text-sm text-white outline-none transition focus:border-[#00d4c8]/60 focus:ring-2 focus:ring-[#00d4c8]/25"
            />
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-white/25 bg-black/20 px-4 py-2 text-sm font-medium text-white transition hover:border-[#00d4c8]/40">
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
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-white/25 bg-black/20 px-4 py-2 text-sm font-medium text-white transition hover:border-[#00d4c8]/40">
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
            <Button
              onClick={addSong}
              loading={isSaving}
              disabled={!newTitle.trim() || !newAudioFile}
              className="min-h-[44px] rounded-xl"
            >
              {uploadStatus === 'uploading' ? 'Subiendo...' : uploadStatus === 'success' ? 'Subida completa' : '+ Agregar canción'}
            </Button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-xs text-white/60">Preview audio</p>
              {newAudioPreview ? (
                <audio controls className="w-full" src={newAudioPreview} />
              ) : (
                <p className="text-xs text-white/40">Selecciona un audio para escuchar preview.</p>
              )}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
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

        <div className={`max-h-[420px] overflow-auto rounded-2xl border border-white/10 bg-white/4 ${subtleScrollbarClass}`}>
          <div className="p-4">
            <p className="mb-3 text-lg font-semibold text-white">Tus canciones</p>
            <div className="space-y-2.5">
              {songs.map((song) => (
                <div key={song.id} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                  <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md bg-black/30">
                    {song.coverUrl && <img src={song.coverUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-white sm:text-lg">{song.title}</p>
                    <p className="truncate text-sm text-white/60">{artistDisplayName}</p>
                  </div>
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
                    <Button
                      variant={song.isFeatured ? 'secondary' : 'outline'}
                      onClick={() => markAsFeatured(song.id)}
                      disabled={isSaving || song.isFeatured || editingSongId === song.id}
                      className="min-h-[38px] rounded-full px-3 text-xs sm:text-sm"
                    >
                      {song.isFeatured ? 'Destacada' : 'Marcar destacada'}
                    </Button>
                    {editingSongId !== song.id ? (
                      <Button variant="outline" onClick={() => startEdit(song)} disabled={isSaving} className="min-h-[38px] rounded-full px-3 text-xs sm:text-sm">
                        <FiEdit2 /> Editar
                      </Button>
                    ) : null}
                    <Button variant="danger" onClick={() => deleteSong(song.id)} disabled={isSaving} className="min-h-[38px] rounded-full px-3 text-xs sm:text-sm">
                      <FiTrash2 /> Eliminar
                    </Button>
                  </div>
                  </div>

                  {editingSongId === song.id ? (
                    <div className="mt-3 grid gap-3 rounded-xl border border-[#00d4c8]/25 bg-[#00d4c8]/6 p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                      <input
                        value={titleDraft}
                        onChange={(e) => {
                          setTitleDraft(e.target.value);
                          setError('');
                        }}
                        placeholder="Nombre de la canción"
                        className="h-10 w-full rounded-lg border border-[#00d4c8]/35 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#00d4c8]/70"
                      />
                      <label className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 bg-black/20 px-3 text-xs text-white transition hover:border-[#00d4c8]/40 sm:text-sm">
                        <FiUpload /> Portada
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            setEditingCoverFile(file);
                            setError('');
                            if (editingCoverPreview.startsWith('blob:')) URL.revokeObjectURL(editingCoverPreview);
                            setEditingCoverPreview(file ? URL.createObjectURL(file) : '');
                          }}
                        />
                      </label>
                      {(editingCoverPreview || song.coverUrl) ? (
                        <div className="h-10 w-14 overflow-hidden rounded-md border border-white/10 bg-black/30">
                          <img
                            src={editingCoverPreview || song.coverUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-14 rounded-md border border-white/10 bg-black/20" />
                      )}
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingSongId('');
                            setTitleDraft('');
                            setEditingCoverFile(null);
                            setEditingCoverPreview('');
                            setError('');
                          }}
                          disabled={isSaving}
                          className="min-h-[38px] rounded-full px-3 text-xs sm:text-sm"
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={saveEdit}
                          loading={editSavingSongId === song.id}
                          disabled={isSaving || !titleDraft.trim()}
                          className="min-h-[38px] rounded-full px-4 text-xs sm:text-sm"
                        >
                          {editSavingSongId === song.id ? 'Guardando...' : 'Guardar'}
                        </Button>
                      </div>
                    </div>
                  ) : null}
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
