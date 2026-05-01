import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useArtistProfileNav } from '../../contexts/ArtistProfileNavContext';
import { buildReservationNavigationState, getPrimaryReservationService } from '../../helpers/artistReservation';
import { isBackendRoleArtista } from '../../helpers/role';
import {
  ARTIST_PROFILE_ACCENT,
  ArtistProfileAvailabilityDay,
  ArtistFeaturedSongModal,
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
import { ensureArtistProfileListedForDiscovery, getArtistAvailabilityById, getArtistSongsByArtistId } from '../../api';
import { isArtistServiceBookable } from '../../helpers/artistServiceVisibility';
import type { ArtistMediaItem, ArtistProfile, ArtistServiceRecord, ArtistSongRecord } from '../../types';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiUser, FiAlertCircle } from 'react-icons/fi';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';

export function ArtistProfileMainPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { basePath, setSidebarProfileIntro } = useArtistProfileNav();
  const effectiveId = id;
  const isSelfArtist =
    !!user?.uid && isBackendRoleArtista(user.role) && user?.uid === effectiveId;
  const calendarMoreHref = isSelfArtist ? '/artist/calendario' : `${basePath}/calendar`;

  const profileLoadOptions = useMemo(
    () =>
      isSelfArtist && user?.uid
        ? {
            allowEmptyProfileForUid: user.uid,
            fallbackDisplayName: user.displayName?.trim() || user.email?.trim(),
          }
        : undefined,
    [isSelfArtist, user?.uid, user?.displayName, user?.email],
  );

  const { profile, services, artistDisplayName: artistDisplayNameFromApi, loading, error } =
    useArtistProfileById(effectiveId, profileLoadOptions);

  useEffect(() => {
    if (!isSelfArtist || !user?.uid) return;
    void ensureArtistProfileListedForDiscovery(user.uid);
  }, [isSelfArtist, user?.uid]);

  const [songs, setSongs] = useState<ArtistSongRecord[]>([]);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [servicesAdminModalOpen, setServicesAdminModalOpen] = useState(false);
  const [adminModalEditorServiceId, setAdminModalEditorServiceId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [songsModalOpen, setSongsModalOpen] = useState(false);
  const [featuredSongModalOpen, setFeaturedSongModalOpen] = useState(false);
  const [availabilityDates, setAvailabilityDates] = useState<{ blocked: string[]; reserved: string[]; pending: string[] }>({
    blocked: [],
    reserved: [],
    pending: [],
  });

  // Missing state for build fix
  const [artistDisplayName, setArtistDisplayName] = useState('');
  const [localProfile, setLocalProfile] = useState<any>(null);
  const [localServices, setLocalServices] = useState<any[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const songPreviewRef = useRef<HTMLAudioElement | null>(null);
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

  useEffect(() => {
    if (!effectiveId) return;
    void getArtistAvailabilityById(effectiveId)
      .then((data) => {
        setAvailabilityDates({
          blocked: data.blocked ?? [],
          reserved: data.reserved ?? [],
          pending: data.pending ?? [],
        });
      })
      .catch(() => {
        setAvailabilityDates({ blocked: [], reserved: [], pending: [] });
      });
  }, [effectiveId, localProfile?.blockedDates, servicesAdminModalOpen]);

  const availabilityDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() + idx);
      return d;
    });
  }, []);

  const blockedSet = useMemo(
    () => new Set<string>([...(availabilityDates.blocked ?? []), ...(availabilityDates.reserved ?? []), ...(availabilityDates.pending ?? [])]),
    [availabilityDates.blocked, availabilityDates.reserved, availabilityDates.pending],
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
    const previewEl = songPreviewRef.current;
    if (previewEl) {
      previewEl.pause();
      previewEl.currentTime = 0;
      previewEl.src = '';
    }
    setPlaying(false);
    setProgress(0);
    setDuration(0);
    setPlayingSongId(null);
  }, [effectiveId, localProfile?.featuredSong, localProfile?.media]);

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

  const orderedServices = useMemo(() => {
    const pinned = localServices.filter((service) => Boolean(service.isPinned));
    const normal = localServices.filter((service) => !service.isPinned);
    return [...pinned, ...normal];
  }, [localServices]);
  const orderedServicesPublic = useMemo(() => {
    const bookable = localServices.filter(isArtistServiceBookable);
    const pinned = bookable.filter((service) => Boolean(service.isPinned));
    const normal = bookable.filter((service) => !service.isPinned);
    return [...pinned, ...normal];
  }, [localServices]);
  const servicesForGrid = isSelfArtist ? orderedServices : orderedServicesPublic;
  const reserveService = useMemo(
    () => getPrimaryReservationService(orderedServices),
    [orderedServices],
  );
  const goToReservation = useCallback(
    (preselectedDateKey?: string) => {
      if (isSelfArtist || !reserveService) return;
      navigate(`${basePath}/services/${reserveService.id}`, {
        state: buildReservationNavigationState(reserveService, preselectedDateKey),
      });
    },
    [basePath, isSelfArtist, navigate, reserveService],
  );
  const featuredTrack = songs.find((song) => song.isFeatured) ?? songs[0];

  if (!effectiveId) {
    return (
      <div className="min-h-screen bg-[#07090b] flex flex-col items-center justify-center p-6 text-center">
        <FiUser size={64} className="text-neutral-800 mb-6" />
        <h1 className="text-3xl font-bold text-white mb-2">Perfil Inaccesible</h1>
        <p className="text-neutral-500 max-w-sm mb-10">
          No se especificó un ID de artista válido o el enlace está roto.
        </p>
        <BackButton className="rounded-full bg-accent px-8 py-3 text-sm font-bold text-black" label="Volver al inicio" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={isSelfArtist ? 'text-neutral-100 w-full max-w-6xl mx-auto p-4 space-y-8' : 'min-h-screen bg-[#07090b]'}>
        {!isSelfArtist && (
          <div className="max-w-6xl mx-auto p-4 md:px-8 mt-4">
            <BackButton className="text-neutral-400 hover:text-white" />
          </div>
        )}
        <div className={isSelfArtist ? 'space-y-8' : 'max-w-6xl mx-auto p-4 md:px-8 space-y-8 mt-2'}>
          {/* Header Skeleton */}
          <div className="rounded-[2.5rem] border border-white/5 bg-neutral-900/40 p-8 md:p-12 min-h-[320px]">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Skeleton className="h-6 w-32 rounded-full" />
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full md:w-[12ch] rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-12 w-48 rounded-full" />
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </div>
              <Skeleton className="aspect-square md:aspect-video w-full rounded-[2rem]" />
            </div>
          </div>
          {/* Grid Skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-56 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !localProfile) {
    return (
      <div className="min-h-screen bg-[#07090b] flex flex-col items-center justify-center p-6 text-center">
        <FiAlertCircle size={64} className="text-red-500/30 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">¡Oops! Artista no encontrado</h1>
        <p className="text-neutral-500 max-w-sm mb-10">
          {error || 'El perfil que buscás no existe o fue desactivado.'}
        </p>
        <BackButton className="rounded-full bg-white/5 border border-white/10 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10" />
      </div>
    );
  }

  const media = Array.isArray(localProfile.media) ? localProfile.media : [];
  const imageMedia = media.filter(
    (m: any): m is ArtistMediaItem => !!m && typeof m === 'object' && m.type === 'image',
  );

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
            {isSelfArtist ? (
              <Button
                variant="outline"
                className="rounded-full border-white/25 px-4 py-2 text-sm"
                onClick={() => setProfileModalOpen(true)}
              >
                Editar perfil
              </Button>
            ) : null}
          </div>

          {/* <div className="flex flex-wrap items-center gap-3 mt-8">
            <ArtistProfileSocialNetworkLink network="tiktok" href={social.tiktok} />
            <ArtistProfileSocialNetworkLink network="youtube" href={social.youtube} />
            <ArtistProfileSocialNetworkLink network="instagram" href={social.instagram} />
            <ArtistProfileSocialNetworkLink network="facebook" href={social.facebook} />
          </div> */}

          <div className="mt-8">
            <Button
              variant="primary"
              className="rounded-3xl px-8 py-3.5 text-xl font-bold"
              disabled={isSelfArtist || !reserveService}
              onClick={isSelfArtist ? () => navigate('/artist/settings') : () => goToReservation()}
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
              <div className="flex items-center gap-3">
                {isSelfArtist ? (
                  <Button
                    variant="outline"
                    className="rounded-full border-white/25 px-3 py-1.5 text-xs"
                    onClick={() => navigate('/artist/calendario')}
                  >
                    Editar
                  </Button>
                ) : null}
                <Link
                  className="text-sm font-normal text-white/90 hover:text-white transition"
                  to={calendarMoreHref}
                >
                  Ver todo
                </Link>
              </div>
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
                    onClick={() => {
                      setSelectedAvailabilityKey(key);
                      if (!reserved) goToReservation(key);
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-4xl bg-card/86 p-8 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-bold text-white tracking-wide">Música</h2>
              {isSelfArtist ? (
                <Button
                  variant="outline"
                  className="rounded-full border-white/25 px-3 py-1.5 text-xs"
                  onClick={() => setSongsModalOpen(true)}
                >
                  Editar
                </Button>
              ) : null}
            </div>
            {songs.length === 0 ? (
              <p className="text-neutral-500 text-sm mt-auto">Sin canciones.</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 flex-1 items-end">
                {songs.slice(0, 8).map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      const previewEl = songPreviewRef.current;
                      if (!previewEl || !track.audioUrl) return;
                      if (playingSongId === track.id) {
                        previewEl.pause();
                        previewEl.currentTime = 0;
                        setPlayingSongId(null);
                        return;
                      }
                      previewEl.pause();
                      previewEl.src = track.audioUrl;
                      previewEl.currentTime = 0;
                      void previewEl
                        .play()
                        .then(() => setPlayingSongId(track.id))
                        .catch(() => setPlayingSongId(null));
                    }}
                    className="shrink-0 flex flex-col items-center gap-2 group w-[72px] border-0 bg-transparent p-0 text-left"
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
                        {playingSongId === track.id ? (
                          <FiPause className="text-white" size={22} />
                        ) : (
                          <FiPlay className="text-white" size={22} />
                        )}
                      </div>
                    </div>
                    <div className="text-center w-full">
                      <p className="text-[11px] text-neutral-400 truncate w-full">{artistDisplayName}</p>
                      <p className="text-xs font-medium text-white truncate w-full">
                        {track.title || 'Canción'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <audio
              ref={songPreviewRef}
              preload="none"
              onEnded={() => setPlayingSongId(null)}
            />
          </div>
        </div>

        <div className="rounded-4xl bg-card/86 p-8 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-bold text-white tracking-wide">Canción destacada</h2>
            {isSelfArtist ? (
              <Button
                variant="outline"
                className="rounded-full border-white/25 px-3 py-1.5 text-xs"
                onClick={() => setFeaturedSongModalOpen(true)}
              >
                Editar
              </Button>
            ) : null}
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
          isSelfArtist={isSelfArtist}
          editAfterTitle
          onClick={() => {
            setAdminModalEditorServiceId(null);
            setServicesAdminModalOpen(true);
          }}
          asideContent={
            servicesForGrid.length > 4 ? (
              <button
                type="button"
                onClick={() => setServicesExpanded((prev) => !prev)}
                className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-[#00d4c8] underline-offset-4 transition hover:underline"
              >
                {servicesExpanded
                  ? 'Ver menos'
                  : `Ver más (${servicesForGrid.length - 4} más)`}
              </button>
            ) : null
          }
        />
        {servicesForGrid.length === 0 ? (
          <p className="text-neutral-500 text-sm">
            {isSelfArtist
              ? 'Sin servicios.'
              : 'Este artista aún no tiene servicios publicados (contrato y rider técnico requeridos).'}
          </p>
        ) : (
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {(servicesExpanded ? servicesForGrid : servicesForGrid.slice(0, 4)).map((s) => {
              const serviceFeatures = Array.isArray(s.features) ? s.features : [];
              const features =
                s.duration && s.duration.trim()
                  ? [`Duración: ${s.duration.trim()}`, ...serviceFeatures]
                  : serviceFeatures;
              return (
                <div key={s.id} className="flex h-full min-w-0 w-full">
                  <ArtistServiceCard
                    service={s}
                    coverPhotoUrl={s.imageUrl || coverPhoto}
                    features={features}
                    isSelfArtist={isSelfArtist}
                    hireLinkTo={`${basePath}/services/${s.id}`}
                    isPinned={Boolean(s.isPinned)}
                    documentsComplete={isArtistServiceBookable(s)}
                    documentsHref={isSelfArtist ? `${basePath}/documents` : undefined}
                    onContinueEditingDraft={
                      isSelfArtist
                        ? (svc) => {
                            setAdminModalEditorServiceId(svc.id);
                            setServicesAdminModalOpen(true);
                          }
                        : undefined
                    }
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
        <ArtistProfileSectionTitle title="Galería" isSelfArtist={false} />
        {imageMedia.length === 0 ? (
          <p className="text-neutral-500 text-sm">Sin imágenes.</p>
        ) : (
          <ArtistProfileGalleryGrid images={imageMedia.slice(0, 7)} />
        )}
      </section>

      <ArtistServicesAdminModal
        isOpen={servicesAdminModalOpen}
        services={localServices}
        onClose={() => {
          setServicesAdminModalOpen(false);
          setAdminModalEditorServiceId(null);
        }}
        onServicesChange={setLocalServices}
        openEditorForServiceId={adminModalEditorServiceId}
        onOpenEditorForServiceIdConsumed={() => setAdminModalEditorServiceId(null)}
      />
      <ArtistProfileSettingsModal
        isOpen={profileModalOpen}
        profile={localProfile}
        artistDisplayName={artistDisplayName}
        onClose={() => setProfileModalOpen(false)}
        onSaved={(saved) => {
          setLocalProfile((prev: ArtistProfile | null) => (prev ? { ...prev, ...saved } : prev));
        }}
        onArtistNameSaved={setArtistDisplayName}
      />
      <ArtistSongsModal
        isOpen={songsModalOpen}
        profile={localProfile}
        artistDisplayName={artistDisplayName}
        onClose={() => setSongsModalOpen(false)}
        onSongsChange={setSongs}
      />
      <ArtistFeaturedSongModal
        isOpen={featuredSongModalOpen}
        profile={localProfile}
        artistDisplayName={artistDisplayName}
        songs={songs}
        onClose={() => setFeaturedSongModalOpen(false)}
        onSongsChange={setSongs}
      />
    </div>
  );
}
