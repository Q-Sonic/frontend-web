import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BackButton, Button, Card, Skeleton } from '../../components';
import { getArtistProfileById, getArtistServicesByArtistId, getUser } from '../../api';
import type { ArtistProfile, ArtistMediaItem, ArtistServiceRecord } from '../../types';
import { withMinimumDelay } from '../../helpers/withMinimumDelay';
import { useAuth } from '../../contexts/AuthContext';
import { isBackendRoleArtista } from '../../helpers/role';
import { SidebarLayout } from '../../layouts';
import { FiPlay, FiEdit3, FiCalendar, FiMapPin, FiMusic } from 'react-icons/fi';

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
      <div
        className={
          isSelfArtist
            ? 'text-neutral-100 max-w-2xl mx-auto p-4'
            : 'min-h-screen bg-neutral-950 p-4'
        }
      >
        {!isSelfArtist && (
          <BackButton className="text-neutral-400 hover:text-white" />
        )}
        <div className={isSelfArtist ? 'space-y-4' : 'mt-4 space-y-4 max-w-2xl mx-auto'}>
          <Card variant="dark" className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center">
                <Skeleton className="h-12 w-12 rounded-full opacity-60" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-6 w-56 rounded" />
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </div>
            </div>
          </Card>

          <Card variant="dark">
            <Skeleton className="h-5 w-40 rounded" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-4/6 rounded" />
            </div>
          </Card>

          <Card variant="dark">
            <Skeleton className="h-5 w-52 rounded" />
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            </div>
          </Card>
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
      ? { title: audioMedia[0].name ?? 'Canción', artistName: profile.city ?? '', streamUrl: audioMedia[0].url, coverUrl: profile.photo }
      : undefined);

  const availabilityDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const coverPhoto = profile.photo;

  const mainContent = (
    <div className="space-y-8">
      {!isSelfArtist && (
        <div className="flex items-center justify-between">
          <BackButton className="text-neutral-400 hover:text-white" />
        </div>
      )}

      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/40"
      >
        {coverPhoto && (
          <div
            className="absolute inset-0 bg-center bg-cover opacity-25"
            style={{ backgroundImage: `url(${coverPhoto})` }}
          />
        )}
        <div className="relative p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white leading-tight">{artistDisplayName}</h1>
                  {profile.city && (
                    <div className="flex items-center gap-2 text-neutral-400 mt-1 text-sm">
                      <FiMapPin size={16} />
                      <span>{profile.city}</span>
                    </div>
                  )}
                </div>
                <Button variant="primary" className="shrink-0">
                  Reservar Fecha
                </Button>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-neutral-400 font-bold tracking-wider">Disponibilidad</div>
                <div className="flex flex-wrap gap-2">
                  {availabilityDays.slice(0, 6).map((d) => {
                    const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short' });
                    const dayNum = d.getDate();
                    return (
                      <div key={d.toISOString()} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-center">
                        <div className="text-[11px] text-neutral-400">{dayLabel}</div>
                        <div className="text-sm font-semibold text-white">{dayNum}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description (public) + edit button (self) */}
              <div id="description" className="pt-3">
                <div className="text-xs text-neutral-400 font-bold tracking-wider mb-2">Descripción</div>
                <div className="rounded-xl border border-white/10 bg-neutral-950/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-neutral-200 whitespace-pre-wrap leading-relaxed flex-1">
                      {profile.biography || 'Sin biografía.'}
                    </p>
                    {isSelfArtist && (
                      <Link to="/artist/profile/edit" className="shrink-0">
                        <Button variant="secondary" className="border-neutral-600 text-neutral-300 whitespace-nowrap">
                          <FiEdit3 size={16} /> Editar
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Featured song */}
            <div className="lg:col-span-2 space-y-4">
              <div className="text-xs text-neutral-400 font-bold tracking-wider flex items-center gap-2">
                <FiMusic size={16} /> Cancion destacada
              </div>

              <div className="rounded-2xl border border-white/10 bg-neutral-950/30 overflow-hidden">
                {featuredSong?.coverUrl && (
                  <div className="h-32 bg-black/20 relative">
                    <img src={featuredSong.coverUrl} alt="" className="w-full h-full object-cover opacity-70" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-white font-semibold truncate">{featuredSong?.title || '—'}</div>
                      {featuredSong?.artistName && (
                        <div className="text-neutral-400 text-sm mt-1 truncate">{featuredSong.artistName}</div>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#00d4c8]/15 border border-[#00d4c8]/30 flex items-center justify-center text-[#00d4c8] shrink-0">
                      <FiPlay />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Music */}
      <section className="space-y-3">
        <div className="text-xs text-neutral-400 font-bold tracking-wider">Musica</div>
        {audioMedia.length === 0 ? (
          <div className="text-neutral-500 text-sm">Sin canciones.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {audioMedia.slice(0, 3).map((track) => (
              <div key={track.url} className="rounded-xl border border-white/10 bg-neutral-950/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-900 border border-white/10">
                    {profile.photo ? (
                      <img src={profile.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/60">🎵</div>
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
                    <FiPlay size={18} />
                  </div>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm truncate">{track.name || 'Canción'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Services */}
      <section className="space-y-4">
        <div className="text-2xl font-bold text-white">Servicios</div>
        {services.length === 0 ? (
          <div className="text-neutral-500 text-sm">Sin servicios.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.slice(0, 4).map((s, idx) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-neutral-950/30 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-white font-semibold truncate">{s.name}</div>
                    <div className="text-[#00d4c8] font-bold">${s.price}</div>
                  </div>
                  <p className="text-neutral-400 text-sm mt-2 leading-relaxed line-clamp-3">
                    {s.description || ''}
                  </p>
                  <div className="mt-4">
                    <Button variant="secondary" className="w-full border-neutral-600 text-neutral-300">
                      <FiCalendar size={16} /> Continuar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Gallery */}
      <section id="gallery" className="space-y-4">
        <div className="text-2xl font-bold text-white">Galeria</div>
        {imageMedia.length === 0 ? (
          <div className="text-neutral-500 text-sm">Sin imágenes.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {imageMedia.slice(0, 6).map((img) => (
              <div key={img.url} className="rounded-xl overflow-hidden border border-white/10 bg-neutral-950/30 aspect-[1/1]">
                <img src={img.url} alt={img.name ?? 'Imagen'} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Documents placeholder (for sidebar link) */}
      <section id="documents" className="space-y-3">
        <div className="text-xs text-neutral-400 font-bold tracking-wider">Documentos</div>
        {profile.technicalRiderUrl ? (
          <a
            href={profile.technicalRiderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-violet-400 hover:underline"
          >
            Descargar rider (PDF)
          </a>
        ) : (
          <div className="text-neutral-500 text-sm">Sin documentos.</div>
        )}
      </section>
    </div>
  );

  return <SidebarLayout sidebar={isSelfArtist ? selfSidebar : publicSidebar}>{mainContent}</SidebarLayout>;
}
