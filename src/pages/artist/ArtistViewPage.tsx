import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArtistServiceCard, BackButton, Button, Skeleton } from '../../components';
import { getArtistProfileById, getArtistServicesByArtistId, getUser } from '../../api';
import type { ArtistProfile, ArtistMediaItem, ArtistServiceRecord, ArtistSocialNetworks } from '../../types';
import { withMinimumDelay } from '../../helpers/withMinimumDelay';
import { useAuth } from '../../contexts/AuthContext';
import { isBackendRoleArtista } from '../../helpers/role';
import { SidebarLayout } from '../../layouts';
import {
  FiPlay,
  FiPause,
  FiEdit3,
  FiCalendar,
  FiSkipBack,
  FiSkipForward,
} from 'react-icons/fi';
import Tiktok from '../../../public/icons/Tiktok';
import Youtube from '../../../public/icons/Youtube';
import Instagram from '../../../public/icons/Instagram';
import Facebook from '../../../public/icons/Facebook';
const ACCENT = '#00d4c8';

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}



function SectionEditLink({ show, to }: { show: boolean; to: string }) {
  if (!show) return null;
  return (
    <Link
      to={to}
      className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-neutral-400 transition hover:border-white/20 hover:text-white"
      aria-label="Editar sección"
    >
      <FiEdit3 size={16} />
    </Link>
  );
}

export function ArtistViewPage({ idOverride }: { idOverride?: string }) {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const effectiveId = idOverride ?? params.id;

  const isSelfArtist =
    !!user?.uid && isBackendRoleArtista(user?.role) && effectiveId === user.uid;

  const basePath = isSelfArtist ? '/artist/profile' : `/artist/${effectiveId}`;
  const publicSidebar = {
    sectionTitle: 'Información',
    menuItems: [
      { to: `${basePath}#description`, label: 'Perfil Publico' },
      { to: `${basePath}#documents`, label: 'Documentos' },
      { to: `${basePath}#gallery`, label: 'Galeria' },
    ],
  };

  const selfSidebar = {
    sectionTitle: 'Información',
    menuItems: publicSidebar.menuItems,
    footer: (
      <div className="space-y-2">
        <p className="text-muted font-bold tracking-wider text-xs">Descripción</p>
        <Link to="/artist/profile/edit" className="block text-sm text-violet-400 hover:underline">
          Editar
        </Link>
      </div>
    ),
  };
  const [profile, setProfile] = useState<(ArtistProfile & { uid: string }) | null>(null);
  const [services, setServices] = useState<ArtistServiceRecord[]>([]);
  const [artistDisplayName, setArtistDisplayName] = useState<string>('Artista');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!effectiveId) {
      setLoading(false);
      return;
    }

    const safeId = effectiveId;
    setLoading(true);
    setError('');

    let cancelled = false;
    async function load() {
      try {
        const [profileData, servicesList, userData] = await withMinimumDelay(1000, async () => {
          return Promise.all([
            getArtistProfileById(safeId),
            getArtistServicesByArtistId(safeId),
            getUser(safeId),
          ]);
        });

        if (cancelled) return;
        setProfile(profileData);
        setServices(servicesList);
        setArtistDisplayName(userData?.displayName || userData?.email || 'Artista');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [effectiveId]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    setPlaying(false);
    setProgress(0);
    setDuration(0);
  }, [effectiveId]);

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

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * duration;
    setProgress(ratio * 100);
  }, [duration]);

  const availabilityDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() + idx);
      return d;
    });
  }, []);

  const blockedSet = useMemo(
    () => new Set(profile?.blockedDates ?? []),
    [profile?.blockedDates],
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
    const content = (
      <div className={isSelfArtist ? 'text-neutral-100 w-full max-w-6xl mx-auto' : 'min-h-screen bg-neutral-950'}>
        {!isSelfArtist && (
          <div className="p-4 pb-0">
            <BackButton className="text-neutral-400 hover:text-white" />
          </div>
        )}
        <div className="p-4 space-y-8">
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
          <Skeleton className="h-8 w-40 rounded" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );

    return (
      <SidebarLayout sidebar={isSelfArtist ? selfSidebar : publicSidebar}>
        {content}
      </SidebarLayout>
    );
  }

  if (error || !profile) {
    const content = (
      <div className={isSelfArtist ? 'text-neutral-100 max-w-2xl mx-auto p-4' : 'min-h-screen bg-neutral-950 p-4'}>
        {!isSelfArtist && <BackButton className="text-neutral-400 hover:text-white" />}
        <p className={isSelfArtist ? 'text-red-400 mt-2' : 'text-red-400 mt-4'}>{error || 'Perfil no encontrado.'}</p>
      </div>
    );

    return (
      <SidebarLayout sidebar={isSelfArtist ? selfSidebar : publicSidebar}>
        {content}
      </SidebarLayout>
    );
  }

  const media = profile.media ?? [];
  const imageMedia = media.filter((m) => m.type === 'image');
  const audioMedia = media.filter((m) => m.type === 'audio');

  const featuredSong = profile.featuredSong ??
    (audioMedia[0]
      ? {
          title: audioMedia[0].name ?? 'Canción',
          artistName: artistDisplayName,
          streamUrl: audioMedia[0].url,
          coverUrl: profile.photo,
        }
      : undefined);

  // const coverPhoto =profile.photo;
  const coverPhoto = 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  const social = profile.socialNetworks ?? {};
  const heroSubtitle = profile.city?.trim() || 'Música en vivo';

  const editHref = '/artist/profile/edit';

  const mainContent = (
    <div className="w-full mx-auto space-y-10 pb-12 p-6">
      {/* Hero */}
      <section
        className="relative -m-6 overflow-hidden bg-neutral-950 min-h-[320px] pt-16 -mb-[250px] "
        style={{
          backgroundImage: `url(${coverPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
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
            {isSelfArtist && <SectionEditLink show to={editHref} />}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <SocialNetworks social="tiktok" href={social.tiktok} />
            <SocialNetworks social="youtube" href={social.youtube} />
            <SocialNetworks social="instagram" href={social.instagram} />
            <SocialNetworks social="facebook" href={social.facebook} />
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

      {/* Disponibilidad + Música + Destacada */}
      <div className="relative grid lg:grid-cols-3 gap-4 lg:gap-5">
        <div className="flex flex-col gap-4 col-span-2">
          {/* Disponibilidad */}
          <div
            id="availability"
            className="rounded-4xl bg-card/86 p-8 flex flex-col min-h-[200px]"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-bold text-white tracking-wide">Disponibilidad</h2>
              <Link
                className="text-sm text-neutral-500 hover:text-white transition"
                to="/artist/calendario"
              >Mirar todos</Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
              {availabilityDays.map((d) => {
                const key = localDateKey(d);
                const blocked = blockedSet.has(key);
                const dayShort = d.toLocaleDateString('es-ES', { weekday: 'short' });
                const num = d.getDate();
                return (
                  <div
                    key={key}
                    className={`shrink-0 w-[52px] rounded-xl border px-2 py-2.5 text-center transition ${
                      blocked
                        ? 'border-red-500/40 bg-red-500/10'
                        : 'border-white/10 bg-white/4'
                    }`}
                  >
                    <div className="text-[10px] uppercase text-neutral-500 leading-tight">{dayShort}</div>
                    <div
                      className={`text-sm font-semibold mt-0.5 ${
                        blocked ? 'text-red-200' : 'text-white'
                      }`}
                    >
                      {num}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-auto pt-4 flex flex-wrap gap-3 text-[11px] text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white/40" /> Libre
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400" /> No disponible
              </span>
            </div>
          </div>

          {/* Música */}
          <div className="rounded-4xl bg-card/86 p-8 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-bold text-white tracking-wide">Música</h2>
              <SectionEditLink show={isSelfArtist} to="/artist/media" />
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
                        <img src={coverPhoto} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xl">♪</div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                        <FiPlay className="text-white" size={22} />
                      </div>
                    </div>
                    <div className="text-center w-full">
                      <p className="text-[11px] text-neutral-400 truncate w-full">{artistDisplayName}</p>
                      <p className="text-xs font-medium text-white truncate w-full">{track.name || 'Canción'}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Canción destacada */}
        <div className="rounded-4xl bg-card/86 p-8 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-bold text-white tracking-wide">Canción destacada</h2>
            <SectionEditLink show={isSelfArtist} to={editHref} />
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
                    <div className="w-full h-full flex items-center justify-center text-4xl text-neutral-600">♪</div>
                  )}
                </div>
                <p className="text-white font-semibold text-sm mt-4 text-center truncate w-full px-2">
                  {featuredSong.title}
                </p>
                {featuredSong.artistName && (
                  <p className="text-neutral-500 text-xs truncate w-full text-center px-2">{featuredSong.artistName}</p>
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
                    style={{ width: `${progress}%`, backgroundColor: ACCENT }}
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
                    style={{ backgroundColor: ACCENT }}
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

      {/* Servicios */}
      <section className="space-y-5">
        <TitleSection title="Servicios" />
        {services.length === 0 ? (
          <p className="text-neutral-500 text-sm">Sin servicios.</p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {services.slice(0, 8).map((s, idx) => {
              const features = [
                'Duración: 60-90 minutos',
                'Equipo de sonido incluido',
                'Producción de luces profesional',
                'Músicos de apoyo',
              ];
              return (
                <ArtistServiceCard
                  key={s.id}
                  service={s}
                  coverPhotoUrl={coverPhoto}
                  highlighted={idx === 0}
                  features={features}
                  isSelfArtist={isSelfArtist}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Galería — hasta 7 fotos; filas incompletas centradas (p. ej. 4+3) */}
      <section id="gallery" className="space-y-5 scroll-mt-24">
        <TitleSection title="Galería" />
        {imageMedia.length === 0 ? (
          <p className="text-neutral-500 text-sm">Sin imágenes.</p>
        ) : (
          <GalleryGrid images={imageMedia.slice(0, 7)} />
        )}
      </section>
    </div>
  );

  return <SidebarLayout sidebar={isSelfArtist ? selfSidebar : publicSidebar}>{mainContent}</SidebarLayout>;
}



const defaultGalleryYear = new Date().getFullYear();

function GalleryGrid({ images }: { images: ArtistMediaItem[] }) {
  const count = images.length;
  const itemWidthClass =
    count === 1
      ? 'w-full max-w-3xl'
      : 'w-[calc(50%-0.5rem)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]';

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {images.map((img) => (
        <div
          key={img.url}
          className={`relative aspect-3/2 shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-neutral-900 ${itemWidthClass}`}
        >
          <img
            src={img.url}
            alt={img.name ?? 'Imagen'}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/55 via-black/20 to-transparent"
            aria-hidden
          />
          <span className="absolute left-4 top-4 z-10 text-sm font-medium text-white drop-shadow-sm">
            {defaultGalleryYear}
          </span>
        </div>
      ))}
    </div>
  );
}

const SocialNetworks = ({ social, href }: { social: 'tiktok' | 'youtube' | 'instagram' | 'facebook', href?: string | undefined }) => {
  
  if (!href || !social) return null;

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/80 hover:text-white transition p-2 rounded-xl hover:bg-white/5"
        aria-label="TikTok"
      >
        {social == 'tiktok' && <Tiktok />}
        {social == 'youtube' && <Youtube />}
        {social == 'instagram' && <Instagram />}
        {social == 'facebook' && <Facebook />}
      </a>
    </>
  );
}

const TitleSection = ({ title }: { title: string }) => {
  return (
    <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
  );
}