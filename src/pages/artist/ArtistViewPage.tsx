import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BackButton, Card } from '../../components';
import { getArtistProfileById, getArtistServicesByArtistId } from '../../services';
import type { ArtistProfile, ArtistMediaItem, ArtistServiceRecord } from '../../types';

export function ArtistViewPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<(ArtistProfile & { uid: string }) | null>(null);
  const [services, setServices] = useState<ArtistServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getArtistProfileById(id)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getArtistServicesByArtistId(id)
      .then((list) => {
        if (!cancelled) setServices(list);
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (!id) {
    return (
      <div className="min-h-screen bg-neutral-950 p-4">
        <BackButton className="text-neutral-400 hover:text-white" />
        <p className="text-neutral-500 mt-4">Artista no especificado.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 p-4">
        <BackButton className="text-neutral-400 hover:text-white" />
        <p className="text-neutral-500 mt-4">Cargando...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-neutral-950 p-4">
        <BackButton className="text-neutral-400 hover:text-white" />
        <p className="text-red-400 mt-4">{error || 'Perfil no encontrado.'}</p>
      </div>
    );
  }

  const media = profile.media ?? [];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <BackButton className="text-neutral-400 hover:text-white" />
      </div>
      <Card variant="dark" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {profile.photo ? (
            <img src={profile.photo} alt="" className="w-24 h-24 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 text-3xl">🎤</div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">Perfil del artista</h1>
            {profile.city && <p className="text-neutral-400 text-sm">{profile.city}</p>}
          </div>
        </div>
      </Card>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">Biografía</h2>
        <Card variant="dark">
          <p className="text-neutral-300 whitespace-pre-wrap">{profile.biography || 'Sin biografía.'}</p>
        </Card>
      </section>

      {services.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">Servicios y precios</h2>
          <div className="space-y-3">
            {services.map((s) => (
              <Card key={s.id} variant="dark">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-medium text-white">{s.name}</h3>
                  <span className="text-violet-400 font-semibold">${s.price} USD</span>
                </div>
                {s.description && (
                  <p className="text-neutral-400 text-sm mt-1">{s.description}</p>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Multimedia</h2>
        {media.length === 0 ? (
          <Card variant="dark">
            <p className="text-neutral-500">Aún no hay contenido multimedia.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {media.map((item: ArtistMediaItem) => (
              <Card key={item.url} variant="dark">
                {item.type === 'image' && (
                  <img src={item.url} alt={item.name ?? 'Media'} className="w-full max-h-80 object-contain rounded" />
                )}
                {item.type === 'audio' && (
                  <audio controls src={item.url} className="w-full">
                    Audio
                  </audio>
                )}
                {item.type === 'video' && (
                  <video controls src={item.url} className="w-full max-h-80 rounded">
                    Video
                  </video>
                )}
                {item.name && <p className="text-neutral-400 text-sm mt-2">{item.name}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
