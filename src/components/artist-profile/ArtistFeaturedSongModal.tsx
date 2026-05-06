import { useEffect, useMemo, useState } from 'react';
import { FiCheck, FiSearch, FiUpload, FiX } from 'react-icons/fi';
import { Button } from '../Button';
import { createArtistSongWithFormData, updateArtistSongWithFormData } from '../../api';
import type { ArtistProfile, ArtistSongRecord } from '../../types';

type ArtistFeaturedSongModalProps = {
  isOpen: boolean;
  profile: (ArtistProfile & { uid: string }) | null;
  artistDisplayName: string;
  songs: ArtistSongRecord[];
  onClose: () => void;
  onSongsChange: (songs: ArtistSongRecord[]) => void;
};

type SongOption = {
  id: string;
  title: string;
  audioUrl: string;
  coverUrl?: string;
  isFeatured?: boolean;
};

export function ArtistFeaturedSongModal({
  isOpen,
  profile,
  artistDisplayName,
  songs: songsProp,
  onClose,
  onSongsChange,
}: ArtistFeaturedSongModalProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const subtleScrollbarClass =
    'scrollbar-thin [scrollbar-color:rgba(255,255,255,0.20)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30';

  const songs = useMemo<SongOption[]>(() => {
    return songsProp.map((s, idx) => ({
      id: s.id,
      title: s.title?.trim() || `Canción ${idx + 1}`,
      audioUrl: s.audioUrl,
      coverUrl: s.coverUrl,
      isFeatured: s.isFeatured,
    }));
  }, [songsProp]);

  const filteredSongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter((song) => song.title.toLowerCase().includes(q));
  }, [songs, search]);

  const selectedSong = useMemo(
    () => songs.find((song) => song.id === selectedId),
    [songs, selectedId]
  );

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedId('');
      setUploadingAudio(null);
      setUploadingCover(null);
      setAudioPreview('');
      setCoverPreview('');
      setUploadStatus('idle');
      setIsSaving(false);
      setError('');
      return;
    }
    const featuredId = songs.find((song) => song.isFeatured)?.id;
    setSelectedId(featuredId ?? songs[0]?.id ?? '');
  }, [isOpen, songs]);

  useEffect(() => {
    return () => {
      if (audioPreview.startsWith('blob:')) URL.revokeObjectURL(audioPreview);
      if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    };
  }, [audioPreview, coverPreview]);

  if (!isOpen || !profile) return null;

  const uploadSong = async () => {
    if (!uploadingAudio) {
      setError('Selecciona un archivo de audio.');
      return;
    }
    setIsSaving(true);
    setUploadStatus('uploading');
    setError('');
    try {
      const created = await createArtistSongWithFormData({
        title: uploadingAudio.name.replace(/\.[^/.]+$/, ''),
        audio: uploadingAudio,
        cover: uploadingCover,
      });
      onSongsChange([created, ...songsProp]);
      setSelectedId(created.id);
      setUploadingAudio(null);
      setUploadingCover(null);
      setAudioPreview('');
      setCoverPreview('');
      setUploadStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la canción.');
      setUploadStatus('idle');
    } finally {
      setIsSaving(false);
    }
  };

  const saveFeaturedSong = async () => {
    const selected = songs.find((song) => song.id === selectedId);
    if (!selected) {
      setError('Selecciona una canción destacada.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await updateArtistSongWithFormData(selected.id, { isFeatured: true });
      onSongsChange(
        songsProp.map((song) => ({
          ...song,
          isFeatured: song.id === selected.id,
        }))
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la canción destacada.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-[#00d4c8]/25 bg-[#0f1115] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:p-6">
        <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Canción destacada</h3>
            <p className="mt-1 text-sm text-neutral-400">Elige la canción principal que verán tus clientes.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white/35 hover:bg-white/5 hover:text-white">
            <FiX />
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/20 bg-black/25 px-3 py-2.5 text-white/80">
              <FiSearch />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Seleccionar canción destacada"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
              />
            </div>
            <div className={`max-h-[350px] overflow-auto rounded-xl border border-white/10 bg-white/3 ${subtleScrollbarClass}`}>
              {filteredSongs.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => setSelectedId(song.id)}
                  className={`flex w-full cursor-pointer items-center justify-between border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 ${
                    selectedId === song.id ? 'bg-[#00d4c8]/12' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                      {song.coverUrl || profile.photo ? (
                        <img
                          src={song.coverUrl || profile.photo}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-white/45">
                          ♪
                        </div>
                      )}
                    </div>
                    <p className="text-base font-semibold text-white sm:text-lg">{song.title}</p>
                    <p className="text-sm text-white/60 truncate">{artistDisplayName}</p>
                  </div>
                  {selectedId === song.id && <FiCheck className="text-[#00d4c8]" size={20} />}
                </button>
              ))}
              {filteredSongs.length === 0 && <p className="p-4 text-sm text-white/60">No hay canciones para mostrar.</p>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-white/25 bg-black/25 px-4 py-2 text-sm font-medium text-white transition hover:border-[#00d4c8]/40">
                <FiUpload /> Audio
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setUploadingAudio(file);
                    setUploadStatus('idle');
                    if (audioPreview.startsWith('blob:')) URL.revokeObjectURL(audioPreview);
                    setAudioPreview(file ? URL.createObjectURL(file) : '');
                  }}
                />
              </label>
              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-white/25 bg-black/25 px-4 py-2 text-sm font-medium text-white transition hover:border-[#00d4c8]/40">
                <FiUpload /> Portada
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setUploadingCover(file);
                    setUploadStatus('idle');
                    if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
                    setCoverPreview(file ? URL.createObjectURL(file) : '');
                  }}
                />
              </label>
              <Button variant="secondary" onClick={uploadSong} loading={isSaving} disabled={!uploadingAudio} className="min-h-[44px] rounded-xl">
                {uploadStatus === 'uploading' ? 'Subiendo...' : uploadStatus === 'success' ? 'Subida completa' : 'Subir'}
              </Button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-xs text-white/60">Preview audio</p>
                {audioPreview ? (
                  <audio controls className="w-full" src={audioPreview} />
                ) : (
                  <p className="text-xs text-white/40">Sin audio seleccionado.</p>
                )}
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-xs text-white/60">Preview portada</p>
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/30">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Portada preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-white/40">Sin portada seleccionada</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mx-auto aspect-3/4 w-full max-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
              {(selectedSong?.coverUrl || profile.photo) && (
                <img src={selectedSong?.coverUrl || profile.photo} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <p className="mt-4 text-center text-xl font-semibold text-white">{selectedSong?.title ?? 'Sin selección'}</p>
            <p className="text-center text-sm text-white/60">{artistDisplayName}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="min-h-[44px] rounded-full">
            Cancelar
          </Button>
          <Button onClick={saveFeaturedSong} loading={isSaving} disabled={!selectedSong} className="min-h-[44px] rounded-full px-6">
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
