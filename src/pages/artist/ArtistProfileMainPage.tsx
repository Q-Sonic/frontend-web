import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';
import { isBackendRoleArtista } from '../../helpers/role';
import {
  ARTIST_PROFILE_ACCENT,
  ArtistProfileAvailabilityDay,
  ArtistFeaturedSongModal,
  ArtistProfileEditButton,
  ArtistProfileGalleryGrid,
  ArtistProfileSettingsModal,
  ArtistProfileSectionTitle,
  ArtistProfileSocialNetworkLink,
  ArtistSongsModal,
  ArtistServicesAdminModal,
  ArtistServiceCard,
  BackButton,
  Button,
  Skeleton,
  defaultAvailabilitySelection,
  localDateKey,
  weekdayShortEs,
} from '../../components';
import { getArtistSongsByArtistId } from '../../api';
import type { ArtistMediaItem, ArtistProfile, ArtistServiceRecord, ArtistSongRecord } from '../../types';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward } from 'react-icons/fi';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';

type ArtistModalType = 'profile' | 'songs' | 'featured-song' | 'services' | null;

export function ArtistProfileMainPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { basePath, setSidebarProfileIntro } = useArtistProfileNav();
  const effectiveId = id;
  const isSelfArtist =
    !!user?.uid && isBackendRoleArtista(user.role) && user?.uid === effectiveId;
  const calendarMoreHref = isSelfArtist ? '/artist/calendario' : `${basePath}/calendar`;

  const { profile, services, artistDisplayName: artistDisplayNameFromApi, loading, error } = useArtistProfileById(effectiveId);
  const [artistDisplayName, setArtistDisplayName] = useState('Artista');
  const [localProfile, setLocalProfile] = useState<(ArtistProfile & { uid: string }) | null>(null);
  const [localServices, setLocalServices] = useState<ArtistServiceRecord[]>([]);
  const [activeModal, setActiveModal] = useState<ArtistModalType>(null);
  const [songs, setSongs] = useState<ArtistSongRecord[]>([]);
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);

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

  useEffect(() => {
    if (!effectiveId) return;
    void getArtistSongsByArtistId(effectiveId)
      .then(setSongs)
      .catch(() => setSongs([]));
  }, [effectiveId]);

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

  const featuredTrack = songs.find((song) => song.isFeatured) ?? songs[0];
  const featuredSong = featuredTrack
    ? {
        title: featuredTrack.title ?? 'Canción',
        artistName: artistDisplayName,
        streamUrl: featuredTrack.audioUrl,
        coverUrl: featuredTrack.coverUrl || localProfile.photo,
      }
    : undefined;

  const coverPhoto = localProfile.photo?.trim() || '';
  const social = localProfile.socialNetworks ?? {};
  const heroSubtitle = localProfile.city?.trim() || 'Música en vivo';

  const openModal = (modalType: Exclude<ArtistModalType, null>) => {
    setModalError('');
    setActiveModal(modalType);
  };

  const closeModal = () => {
    if (isSaving) return;
    setActiveModal(null);
    setModalError('');
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
            {songs.length === 0 ? (
              <p className="text-neutral-500 text-sm mt-auto">Sin canciones.</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 flex-1 items-end">
                {songs.slice(0, 8).map((track) => (
                  <a
                    key={track.id}
                    href={track.audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex flex-col items-center gap-2 group w-[72px]"
                  >
                    <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden border border-white/10 bg-neutral-800 shadow-lg">
                      {track.coverUrl || coverPhoto ? (
                        <img
                          src={track.coverUrl || coverPhoto}
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
                        {track.title || 'Canción'}
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
          asideContent={
            localServices.length > 4 ? (
              <button
                type="button"
                onClick={() => setServicesExpanded((prev) => !prev)}
                className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-[#00d4c8] underline-offset-4 transition hover:underline"
              >
                {servicesExpanded
                  ? 'Ver menos'
                  : `Ver más (${localServices.length - 4} más)`}
              </button>
            ) : null
          }
        />
        {localServices.length === 0 ? (
          <p className="text-neutral-500 text-sm">Sin servicios.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {(servicesExpanded ? localServices : localServices.slice(0, 4)).map((s) => {
              const serviceFeatures = Array.isArray(s.features) ? s.features : [];
              const features =
                s.duration && s.duration.trim()
                  ? [`Duración: ${s.duration.trim()}`, ...serviceFeatures]
                  : serviceFeatures;
              return (
                <div key={s.id} className="min-w-0 flex h-full">
                  <ArtistServiceCard
                    service={s}
                    coverPhotoUrl={s.imageUrl || coverPhoto}
                    features={features}
                    isSelfArtist={isSelfArtist}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div
        className="my-10 sm:my-12 border-t border-white/10"
        aria-hidden
      />

      <section id="gallery" className="space-y-5 scroll-mt-24">
        <ArtistProfileSectionTitle title="Galería" onClick={() => {}} isSelfArtist={isSelfArtist} />
        {imageMedia.length === 0 ? (
          <p className="text-neutral-500 text-sm">Sin imágenes.</p>
        ) : (
          <ArtistProfileGalleryGrid images={imageMedia.slice(0, 7)} />
        )}
      </section>

      {activeModal && activeModal !== 'services' && activeModal !== 'profile' && activeModal !== 'songs' && activeModal !== 'featured-song' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-[#00d4c8]/35 bg-[#111214] p-6 shadow-[0_0_40px_rgba(0,212,200,0.2)]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-white">
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
        onSaved={(saved) => {
          setLocalProfile((prev) => (prev ? { ...prev, ...saved } : prev));
          setSidebarProfileIntro?.(saved.biography?.trim() ?? '');
        }}
        onArtistNameSaved={setArtistDisplayName}
      />
      <ArtistSongsModal
        isOpen={activeModal === 'songs'}
        profile={localProfile}
        artistDisplayName={artistDisplayName}
        onClose={closeModal}
        onSongsChange={setSongs}
      />
      <ArtistFeaturedSongModal
        isOpen={activeModal === 'featured-song'}
        profile={localProfile}
        artistDisplayName={artistDisplayName}
        songs={songs}
        onClose={closeModal}
        onSongsChange={setSongs}
      />
    </div>
  );
}
