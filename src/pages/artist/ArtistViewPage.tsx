import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BackButton, Button, Skeleton } from '../../components';
import { getArtistProfileById, getArtistServicesByArtistId, getUser } from '../../api';
import type { ArtistProfile, ArtistMediaItem, ArtistServiceRecord } from '../../types';
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
  FiArrowRight,
} from 'react-icons/fi';
import { SiFacebook, SiInstagram, SiYoutube, SiTiktok } from 'react-icons/si';

const ACCENT = '#00d4c8';

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function headlineFromBio(biography: string | undefined, fallback: string): string {
  const t = biography?.trim();
  if (!t) return fallback;
  const line = t.split('\n')[0]?.trim() ?? t;
  if (line.length <= 56) return line;
  return `${line.slice(0, 53)}…`;
}

function serviceFeatureLines(description: string): string[] {
  const trimmed = description.trim();
  if (!trimmed) return [];
  if (trimmed.includes('\n')) {
    return trimmed
      .split('\n')
      .map((l) => l.replace(/^[•\-\u2022]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 5);
  }
  const parts = trimmed.split(/\s*[•\u2022]\s+/).filter(Boolean);
  if (parts.length > 1) return parts.slice(0, 5);
  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter((s) => s.length > 8);
  return sentences.slice(0, 4);
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

  const coverPhoto = profile.photo;
  const social = profile.socialNetworks ?? {};
  const heroTitle = headlineFromBio(profile.biography, 'Tu escenario');
  const heroSubtitle = profile.city?.trim() || 'Música en vivo';

  const editHref = '/artist/profile/edit';

  const mainContent = (
    <div className="w-full max-w-6xl mx-auto space-y-10 pb-12">
      {!isSelfArtist && (
        <div className="flex items-center justify-between">
          <BackButton className="text-neutral-400 hover:text-white" />
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-neutral-950">
        <div className="grid lg:grid-cols-[1fr_min(42%,420px)] gap-0 items-stretch min-h-[320px]">
          <div className="relative z-10 p-8 lg:p-10 flex flex-col justify-center">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-neutral-400 tracking-wide">{artistDisplayName}</p>
                <h1 className="text-4xl sm:text-5xl font-bold text-white leading-[1.05] tracking-tight">
                  {heroTitle}
                </h1>
                <p className="text-neutral-500 text-sm sm:text-base pt-1">{heroSubtitle}</p>
              </div>
              {isSelfArtist && <SectionEditLink show to={editHref} />}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              {social.tiktok && (
                <a
                  href={social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition p-2 rounded-xl hover:bg-white/5"
                  aria-label="TikTok"
                >
                  <SiTiktok size={22} />
                </a>
              )}
              {social.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition p-2 rounded-xl hover:bg-white/5"
                  aria-label="YouTube"
                >
                  <SiYoutube size={22} />
                </a>
              )}
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition p-2 rounded-xl hover:bg-white/5"
                  aria-label="Instagram"
                >
                  <SiInstagram size={22} />
                </a>
              )}
              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition p-2 rounded-xl hover:bg-white/5"
                  aria-label="Facebook"
                >
                  <SiFacebook size={22} />
                </a>
              )}
            </div>

            <div className="mt-8">
              {isSelfArtist ? (
                <Link to="/artist/calendario">
                  <Button variant="primary" className="rounded-2xl px-8 py-3.5 text-base shadow-lg shadow-[#00d4c8]/25">
                    Reservar Fecha
                  </Button>
                </Link>
              ) : (
                <Button variant="primary" className="rounded-2xl px-8 py-3.5 text-base shadow-lg shadow-[#00d4c8]/25">
                  Reservar Fecha
                </Button>
              )}
            </div>
          </div>

          <div className="relative min-h-[240px] lg:min-h-0">
            {coverPhoto ? (
              <>
                <img
                  src={coverPhoto}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-top lg:object-center"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent lg:from-neutral-950 lg:via-neutral-950/70 lg:to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/30 lg:hidden" aria-hidden />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/50 to-neutral-950" />
            )}
          </div>
        </div>
      </section>

      <section
        id="description"
        className="rounded-2xl border border-white/8 bg-neutral-900/40 p-6 scroll-mt-24"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-bold text-neutral-500 tracking-wider uppercase mb-3">Sobre el artista</h2>
            <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
              {profile.biography?.trim() || 'Sin biografía.'}
            </p>
          </div>
          {isSelfArtist && (
            <Link to={editHref}>
              <Button variant="secondary" className="shrink-0 border-white/10 text-neutral-200 whitespace-nowrap">
                <FiEdit3 size={16} /> Editar
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Disponibilidad + Música + Destacada */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Disponibilidad */}
        <div
          id="availability"
          className="rounded-2xl border border-white/[0.08] bg-neutral-900/50 p-5 flex flex-col min-h-[200px]"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-bold text-white tracking-wide">Disponibilidad</h2>
            <SectionEditLink show={isSelfArtist} to={editHref} />
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
                      : 'border-white/10 bg-white/[0.04]'
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
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/50 p-5 flex flex-col min-h-[200px]">
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

        {/* Canción destacada */}
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/50 p-5 flex flex-col">
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
        <h2 className="text-2xl font-bold text-white tracking-tight">Servicios</h2>
        {services.length === 0 ? (
          <p className="text-neutral-500 text-sm">Sin servicios.</p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {services.slice(0, 8).map((s, idx) => {
              const features = serviceFeatureLines(s.description || '');
              const highlighted = idx === 0;
              return (
                <article
                  key={s.id}
                  className={`rounded-2xl border overflow-hidden flex flex-col bg-neutral-900/50 ${
                    highlighted ? 'border-[#00d4c8]/50 ring-1 ring-[#00d4c8]/20' : 'border-white/[0.08]'
                  }`}
                >
                  <div className="h-36 bg-neutral-800 relative overflow-hidden shrink-0">
                    {coverPhoto ? (
                      <img src={coverPhoto} alt="" className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <div
                        className="w-full h-full opacity-90"
                        style={{
                          background: `linear-gradient(135deg, ${ACCENT}33 0%, transparent 60%), linear-gradient(225deg, #27272a 0%, #0a0a0a 100%)`,
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-white font-semibold leading-snug">{s.name}</h3>
                      <span className="text-[#00d4c8] font-bold text-sm whitespace-nowrap">${s.price}</span>
                    </div>
                    <p className="text-neutral-400 text-sm mt-3 leading-relaxed line-clamp-3">
                      {s.description || '—'}
                    </p>
                    {features.length > 0 && (
                      <ul className="mt-4 space-y-2 text-sm text-neutral-300">
                        {features.map((line) => (
                          <li key={line} className="flex gap-2">
                            <span className="text-[#00d4c8] shrink-0 mt-0.5">✓</span>
                            <span className="leading-snug">{line}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-6">
                      {isSelfArtist ? (
                        <Link
                          to="/artist/services"
                          className="w-full rounded-xl border border-white/10 bg-neutral-950/80 py-3 px-4 text-sm font-medium text-white flex items-center justify-center gap-2 hover:bg-neutral-800/80 transition"
                        >
                          Contratar ahora
                          <FiArrowRight className="text-[#00d4c8]" size={18} />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="w-full rounded-xl border border-white/10 bg-neutral-950/80 py-3 px-4 text-sm font-medium text-white flex items-center justify-center gap-2 hover:bg-neutral-800/80 transition"
                        >
                          Contratar ahora
                          <FiArrowRight className="text-[#00d4c8]" size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Galería */}
      <section id="gallery" className="space-y-5 scroll-mt-24">
        <h2 className="text-2xl font-bold text-white tracking-tight">Galería</h2>
        {imageMedia.length === 0 ? (
          <p className="text-neutral-500 text-sm">Sin imágenes.</p>
        ) : (
          <div className="columns-2 sm:columns-3 gap-3 space-y-3">
            {imageMedia.map((img) => (
              <div
                key={img.url}
                className="break-inside-avoid mb-3 rounded-2xl overflow-hidden border border-white/8 bg-neutral-900/40 relative"
              >
                <img
                  src={img.url}
                  alt={img.name ?? 'Imagen'}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Documentos (ancla sidebar) */}
      <section id="documents" className="space-y-3 scroll-mt-24 pt-4 border-t border-white/[0.06]">
        <h2 className="text-xs font-bold text-neutral-500 tracking-wider uppercase">Documentos</h2>
        {profile.technicalRiderUrl ? (
          <a
            href={profile.technicalRiderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#00d4c8] hover:underline text-sm font-medium"
          >
            Descargar rider (PDF)
          </a>
        ) : (
          <p className="text-neutral-500 text-sm">Sin documentos.</p>
        )}
      </section>
    </div>
  );

  return <SidebarLayout sidebar={isSelfArtist ? selfSidebar : publicSidebar}>{mainContent}</SidebarLayout>;
}
