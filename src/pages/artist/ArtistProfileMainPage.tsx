import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';
import { isBackendRoleArtista } from '../../helpers/role';
import {
  ARTIST_PROFILE_ACCENT,
  ArtistProfileAvailabilityDay,
  ArtistProfileEditButton,
  ArtistProfileGalleryGrid,
  ArtistProfileSettingsModal,
  ArtistProfileSectionTitle,
  ArtistProfileSocialNetworkLink,
  ArtistServicesAdminModal,
  ArtistServiceCard,
  BackButton,
  Button,
  Skeleton,
  defaultAvailabilitySelection,
  localDateKey,
  weekdayShortEs,
} from '../../components';
import { updateArtistProfile } from '../../api';
import type { ArtistMediaItem, ArtistProfile, ArtistProfileUpdate, ArtistServiceRecord } from '../../types';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward } from 'react-icons/fi';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';

type ArtistModalType = 'profile' | 'songs' | 'featured-song' | 'services' | null;

export function ArtistProfileMainPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { basePath } = useArtistProfileNav();
  const effectiveId = id;
  const isSelfArtist =
    !!user?.uid && isBackendRoleArtista(user.role) && user?.uid === effectiveId;
  const calendarMoreHref = isSelfArtist ? '/artist/calendario' : `${basePath}/calendar`;

  const { profile, services, artistDisplayName: artistDisplayNameFromApi, loading, error } = useArtistProfileById(effectiveId);
  const [artistDisplayName, setArtistDisplayName] = useState('Artista');
  const [localProfile, setLocalProfile] = useState<(ArtistProfile & { uid: string }) | null>(null);
  const [localServices, setLocalServices] = useState<ArtistServiceRecord[]>([]);
  const [activeModal, setActiveModal] = useState<ArtistModalType>(null);
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [songForm, setSongForm] = useState({ title: '', url: '' });
  const [editingSongIndex, setEditingSongIndex] = useState<number | null>(null);

  const [featuredSongUrl, setFeaturedSongUrl] = useState('');


  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    setLocalServices(services);
  }, [services]);

  useEffect(() => {
    setArtistDisplayName(artistDisplayNameFromApi);
  }, [artistDisplayNameFromApi]);

  const availabilityDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() + idx);
      return d;
    });
  }, []);

  const blockedSet = useMemo(
    () => new Set(localProfile?.blockedDates ?? []),
    [localProfile?.blockedDates],
  );

  const [, setSelectedAvailabilityKey] = useState<string>(() =>
    defaultAvailabilitySelection(availabilityDays, blockedSet),
  );

  useEffect(() => {
    setSelectedAvailabilityKey(defaultAvailabilitySelection(availabilityDays, blockedSet));
  }, [effectiveId, blockedSet, availabilityDays]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    setPlaying(false);
    setProgress(0);
    setDuration(0);
  }, [effectiveId, localProfile?.featuredSong, localProfile?.media]);

  useEffect(() => {
    if (!activeModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) setActiveModal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, isSaving]);

  const onTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el || !duration) return;
    setProgress((el.currentTime / duration) * 100);
  }, [duration]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [playing]);

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = audioRef.current;
      if (!el || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      el.currentTime = ratio * duration;
      setProgress(ratio * 100);
    },
    [duration],
  );

  if (!effectiveId) {
    return (
      <div className="min-h-screen bg-neutral-950 p-4">
        <BackButton className="text-neutral-400 hover:text-white" />
        <p className="text-neutral-500 mt-4">Artista no especificado.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={
          isSelfArtist
            ? 'text-neutral-100 w-full max-w-6xl mx-auto p-4 space-y-8'
            : 'min-h-screen bg-neutral-950'
        }
      >
        {!isSelfArtist && (
          <div className="p-4 pb-0">
            <BackButton className="text-neutral-400 hover:text-white" />
          </div>
        )}
        <div className={isSelfArtist ? 'space-y-8' : 'p-4 space-y-8'}>
        <div className="rounded-3xl border border-white/10 bg-neutral-900/40 p-8 min-h-[280px]">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-12 w-3/4 max-w-md rounded-lg" />
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-12 w-40 rounded-full" />
            </div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
        </div>
      </div>
    );
  }

  if (error || !localProfile) {
    return (
      <div
        className={
          isSelfArtist
            ? 'text-neutral-100 max-w-2xl mx-auto p-4'
            : 'min-h-screen bg-neutral-950 p-4'
        }
      >
        {!isSelfArtist && <BackButton className="text-neutral-400 hover:text-white" />}
        <p className={isSelfArtist ? 'text-red-400 mt-2' : 'text-red-400 mt-4'}>
          {error || 'Perfil no encontrado.'}
        </p>
      </div>
    );
  }

  const media = localProfile.media ?? [];
  const imageMedia = media.filter((m) => m.type === 'image');
  const audioMedia = media.filter((m) => m.type === 'audio');

  const featuredSong =
    localProfile.featuredSong ??
    (audioMedia[0]
      ? {
          title: audioMedia[0].name ?? 'Canción',
          artistName: artistDisplayName,
          streamUrl: audioMedia[0].url,
          coverUrl: localProfile.photo,
        }
      : undefined);

  const coverPhoto = localProfile.photo?.trim() || '';
  const social = localProfile.socialNetworks ?? {};
  const heroSubtitle = localProfile.city?.trim() || 'Música en vivo';

  const editableSongs = audioMedia.map((item, index) => ({
    index,
    title: item.name?.trim() || `Canción ${index + 1}`,
    url: item.url,
  }));

  const openModal = (modalType: Exclude<ArtistModalType, null>) => {
    setModalError('');
    if (modalType === 'featured-song') {
      setFeaturedSongUrl(localProfile.featuredSong?.streamUrl ?? editableSongs[0]?.url ?? '');
    }
    if (modalType === 'songs') {
      setSongForm({ title: '', url: '' });
      setEditingSongIndex(null);
    }
    setActiveModal(modalType);
  };

  const closeModal = () => {
    if (isSaving) return;
    setActiveModal(null);
    setModalError('');
    setEditingSongIndex(null);
  };

  const persistProfile = async (nextProfile: ArtistProfile) => {
    const payload: ArtistProfileUpdate = {
      biography: nextProfile.biography ?? '',
      city: nextProfile.city ?? '',
      photo: nextProfile.photo ?? '',
      socialNetworks: {
        instagram: nextProfile.socialNetworks?.instagram ?? '',
        facebook: nextProfile.socialNetworks?.facebook ?? '',
        youtube: nextProfile.socialNetworks?.youtube ?? '',
        tiktok: nextProfile.socialNetworks?.tiktok ?? '',
        twitter: nextProfile.socialNetworks?.twitter ?? '',
      },
      media: nextProfile.media ?? [],
      blockedDates: nextProfile.blockedDates ?? [],
      featuredSong: nextProfile.featuredSong,
    };
    const saved = await updateArtistProfile(payload);
    setLocalProfile((prev) => (prev ? { ...prev, ...saved } : prev));
  };

  const handleSaveSong = async () => {
    if (!localProfile) return;
    const title = songForm.title.trim();
    const url = songForm.url.trim();
    if (!title || !url) {
      setModalError('Completa el nombre y la URL de la canción.');
      return;
    }
    setIsSaving(true);
    setModalError('');
    try {
      const nextMedia = [...(localProfile.media ?? [])];
      const audioIndexes = nextMedia
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.type === 'audio')
        .map(({ idx }) => idx);
      const payloadSong: ArtistMediaItem = { type: 'audio', name: title, url };

      if (editingSongIndex == null) {
        nextMedia.push(payloadSong);
      } else {
        const mediaIndex = audioIndexes[editingSongIndex];
        if (mediaIndex != null) nextMedia[mediaIndex] = payloadSong;
      }

      await persistProfile({ ...localProfile, media: nextMedia });
      setSongForm({ title: '', url: '' });
      setEditingSongIndex(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'No se pudo guardar la canción.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSong = async (songIndex: number) => {
    if (!localProfile) return;
    setIsSaving(true);
    setModalError('');
    try {
      const audioIndexes = (localProfile.media ?? [])
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.type === 'audio')
        .map(({ idx }) => idx);
      const mediaIndex = audioIndexes[songIndex];
      if (mediaIndex == null) return;
      const nextMedia = (localProfile.media ?? []).filter((_, idx) => idx !== mediaIndex);
      await persistProfile({ ...localProfile, media: nextMedia });
      if (editingSongIndex === songIndex) {
        setEditingSongIndex(null);
        setSongForm({ title: '', url: '' });
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'No se pudo eliminar la canción.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFeaturedSong = async () => {
    if (!localProfile) return;
    const selected = editableSongs.find((song) => song.url === featuredSongUrl);
    if (!selected) {
      setModalError('Selecciona una canción destacada.');
      return;
    }
    setIsSaving(true);
    setModalError('');
    try {
      await persistProfile({
        ...localProfile,
        featuredSong: {
          title: selected.title,
          artistName: artistDisplayName,
          streamUrl: selected.url,
          coverUrl: localProfile.photo || undefined,
        },
      });
      closeModal();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'No se pudo actualizar la canción destacada.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full mx-auto space-y-10 pb-12 p-6">
      <section
        id="description"
        className="relative scroll-mt-24 -m-6 overflow-hidden bg-neutral-950 min-h-[320px] pt-16 -mb-[250px] "
        style={{
          backgroundImage: `url(${coverPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-neutral-950/20" />

        <div className="relative p-8 lg:p-10 flex flex-col min-h-[720px]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-white/80 tracking-wide">{artistDisplayName}</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-[1.05] tracking-tight">
                {artistDisplayName}
              </h1>
              <p className="text-white/80 text-sm sm:text-base pt-1">{heroSubtitle}</p>
            </div>
            <ArtistProfileEditButton show={isSelfArtist} onClick={() => openModal('profile')} />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <ArtistProfileSocialNetworkLink network="tiktok" href={social.tiktok} />
            <ArtistProfileSocialNetworkLink network="youtube" href={social.youtube} />
            <ArtistProfileSocialNetworkLink network="instagram" href={social.instagram} />
            <ArtistProfileSocialNetworkLink network="facebook" href={social.facebook} />
          </div>

          <div className="mt-8">
            <Button
              variant="primary"
              className="rounded-3xl px-8 py-3.5 text-xl font-bold"
              disabled={isSelfArtist}
            >
              Reservar Fecha
            </Button>
          </div>
        </div>
      </section>

      <div className="relative grid lg:grid-cols-2 gap-4 lg:gap-5">
        <div className="flex flex-col gap-4">
          <div
            id="availability"
            className="rounded-4xl bg-card/86 p-6 flex flex-col gap-4 min-h-[200px]"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">Disponibilidad</h2>
              <Link
                className="text-sm font-normal text-white/90 hover:text-white transition"
                to={calendarMoreHref}
              >
                Ver todo
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-xs text-white">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-white" aria-hidden />
                Disponible
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: ARTIST_PROFILE_ACCENT }}
                  aria-hidden
                />
                Reservado
              </span>
            </div>
            <div className="flex gap-2 sm:gap-2.5 justify-between overflow-x-auto pb-2 pt-1 scrollbar-thin [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
              {availabilityDays.map((d) => {
                const key = localDateKey(d);
                const reserved = blockedSet.has(key);
                const dayShort = weekdayShortEs(d);
                const num = d.getDate();
                return (
                  <ArtistProfileAvailabilityDay
                    key={key}
                    dayShort={dayShort}
                    num={num}
                    reserved={reserved}
                    onClick={() => setSelectedAvailabilityKey(key)}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-4xl bg-card/86 p-8 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-bold text-white tracking-wide">Música</h2>
              <ArtistProfileEditButton show={isSelfArtist} onClick={() => openModal('songs')} />
            </div>
            {audioMedia.length === 0 ? (
              <p className="text-neutral-500 text-sm mt-auto">Sin canciones.</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 flex-1 items-end">
                {audioMedia.slice(0, 8).map((track: ArtistMediaItem) => (
                  <a
                    key={track.url}
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex flex-col items-center gap-2 group w-[72px]"
                  >
                    <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden border border-white/10 bg-neutral-800 shadow-lg">
                      {coverPhoto ? (
                        <img
                          src={coverPhoto}
                          alt=""
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xl">
                          ♪
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                        <FiPlay className="text-white" size={22} />
                      </div>
                    </div>
                    <div className="text-center w-full">
                      <p className="text-[11px] text-neutral-400 truncate w-full">{artistDisplayName}</p>
                      <p className="text-xs font-medium text-white truncate w-full">
                        {track.name || 'Canción'}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-4xl bg-card/86 p-8 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-bold text-white tracking-wide">Canción destacada</h2>
            <ArtistProfileEditButton show={isSelfArtist} onClick={() => openModal('featured-song')} />
          </div>
          {featuredSong?.streamUrl ? (
            <>
              <audio
                ref={audioRef}
                src={featuredSong.streamUrl}
                preload="metadata"
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration || 0);
                  setProgress(0);
                }}
                onTimeUpdate={onTimeUpdate}
                onEnded={() => {
                  setPlaying(false);
                  setProgress(0);
                }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
              <div className="flex flex-col items-center flex-1">
                <div className="w-full max-w-[200px] aspect-square rounded-2xl overflow-hidden border border-white/10 bg-neutral-800 shadow-xl">
                  {featuredSong.coverUrl ? (
                    <img src={featuredSong.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-neutral-600">
                      ♪
                    </div>
                  )}
                </div>
                <p className="text-white font-semibold text-sm mt-4 text-center truncate w-full px-2">
                  {featuredSong.title}
                </p>
                {featuredSong.artistName && (
                  <p className="text-neutral-500 text-xs truncate w-full text-center px-2">
                    {featuredSong.artistName}
                  </p>
                )}
                <div
                  role="slider"
                  tabIndex={0}
                  aria-valuenow={Math.round(progress)}
                  className="w-full mt-5 h-1.5 rounded-full bg-white/10 cursor-pointer group"
                  onClick={seek}
                  onKeyDown={(e) => {
                    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                    const el = audioRef.current;
                    if (!el) return;
                    const delta = e.key === 'ArrowLeft' ? -5 : 5;
                    el.currentTime = Math.max(0, Math.min(duration, el.currentTime + delta));
                  }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-150"
                    style={{ width: `${progress}%`, backgroundColor: ARTIST_PROFILE_ACCENT }}
                  />
                </div>
                <div className="flex items-center justify-center gap-6 mt-5">
                  <button
                    type="button"
                    className="text-neutral-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition"
                    aria-label="Anterior"
                    onClick={() => {
                      const el = audioRef.current;
                      if (el) el.currentTime = Math.max(0, el.currentTime - 10);
                    }}
                  >
                    <FiSkipBack size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-[#0d1117] shadow-lg shadow-[#00d4c8]/30 transition hover:scale-[1.03] active:scale-[0.98]"
                    style={{ backgroundColor: ARTIST_PROFILE_ACCENT }}
                    aria-label={playing ? 'Pausar' : 'Reproducir'}
                  >
                    {playing ? <FiPause size={26} /> : <FiPlay size={26} className="ml-0.5" />}
                  </button>
                  <button
                    type="button"
                    className="text-neutral-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition"
                    aria-label="Siguiente"
                    onClick={() => {
                      const el = audioRef.current;
                      if (el) el.currentTime = Math.min(duration, el.currentTime + 10);
                    }}
                  >
                    <FiSkipForward size={22} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-neutral-500 text-sm">Sin canción destacada.</p>
          )}
        </div>
      </div>

      <section id="documents" className="space-y-5 scroll-mt-24">
        <ArtistProfileSectionTitle
          title="Servicios"
          onClick={() => openModal('services')}
          isSelfArtist={isSelfArtist}
        />
        {localServices.length === 0 ? (
          <p className="text-neutral-500 text-sm">Sin servicios.</p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {localServices.slice(0, 8).map((s, idx) => {
              const serviceFeatures = Array.isArray(s.features) ? s.features : [];
              const features =
                s.duration && s.duration.trim()
                  ? [`Duración: ${s.duration.trim()}`, ...serviceFeatures]
                  : serviceFeatures;
              return (
                <ArtistServiceCard
                  key={s.id}
                  service={s}
                  coverPhotoUrl={s.imageUrl || coverPhoto}
                  highlighted={idx === 0}
                  features={features}
                  isSelfArtist={isSelfArtist}
                />
              );
            })}
          </div>
        )}
      </section>

      <section id="gallery" className="space-y-5 scroll-mt-24">
        <ArtistProfileSectionTitle title="Galería" onClick={() => {}} isSelfArtist={isSelfArtist} />
        {imageMedia.length === 0 ? (
          <p className="text-neutral-500 text-sm">Sin imágenes.</p>
        ) : (
          <ArtistProfileGalleryGrid images={imageMedia.slice(0, 7)} />
        )}
      </section>

      {activeModal && activeModal !== 'services' && activeModal !== 'profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-[#00d4c8]/35 bg-[#111214] p-6 shadow-[0_0_40px_rgba(0,212,200,0.2)]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-white">
                {activeModal === 'songs' && 'Administrar canciones'}
                {activeModal === 'featured-song' && 'Editar canción destacada'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-white/20 px-3 py-1 text-white/70 transition hover:text-white"
              >
                X
              </button>
            </div>

            {modalError && (
              <p className="mb-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {modalError}
              </p>
            )}

            {activeModal === 'songs' && (
              <div className="space-y-4">
                <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                  {editableSongs.length === 0 && (
                    <p className="text-sm text-white/60">No tienes canciones cargadas.</p>
                  )}
                  {editableSongs.map((song, idx) => (
                    <div
                      key={`${song.url}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{song.title}</p>
                        <p className="text-xs text-white/50">{song.url}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingSongIndex(idx);
                            setSongForm({ title: song.title, url: song.url });
                          }}
                          disabled={isSaving}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDeleteSong(idx)}
                          disabled={isSaving}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={songForm.title}
                    onChange={(e) => setSongForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Nombre de canción"
                    className="rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
                  />
                  <input
                    value={songForm.url}
                    onChange={(e) => setSongForm((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="URL del audio"
                    className="rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={closeModal} disabled={isSaving}>
                    Cerrar
                  </Button>
                  <Button onClick={handleSaveSong} loading={isSaving}>
                    {editingSongIndex == null ? 'Agregar canción' : 'Actualizar canción'}
                  </Button>
                </div>
              </div>
            )}

            {activeModal === 'featured-song' && (
              <div className="space-y-4">
                <div className="max-h-[360px] space-y-2 overflow-auto rounded-2xl border border-white/10 bg-black/20 p-4">
                  {editableSongs.length === 0 ? (
                    <p className="text-sm text-white/60">Primero agrega canciones para destacar una.</p>
                  ) : (
                    editableSongs.map((song) => (
                      <label
                        key={song.url}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{song.title}</p>
                          <p className="text-xs text-white/50">{song.url}</p>
                        </div>
                        <input
                          type="radio"
                          name="featured-song"
                          checked={featuredSongUrl === song.url}
                          onChange={() => setFeaturedSongUrl(song.url)}
                        />
                      </label>
                    ))
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={closeModal} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveFeaturedSong} loading={isSaving} disabled={editableSongs.length === 0}>
                    Guardar
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      <ArtistServicesAdminModal
        isOpen={activeModal === 'services'}
        services={localServices}
        onClose={closeModal}
        onServicesChange={setLocalServices}
      />
      <ArtistProfileSettingsModal
        isOpen={activeModal === 'profile'}
        profile={localProfile}
        artistDisplayName={artistDisplayName}
        onClose={closeModal}
        onSaved={(saved) => setLocalProfile((prev) => (prev ? { ...prev, ...saved } : prev))}
        onArtistNameSaved={setArtistDisplayName}
      />
    </div>
  );
}
