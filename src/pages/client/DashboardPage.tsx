import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Topbar, UserMenu, Card } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { listArtistProfiles } from '../../api';
import type { ArtistProfileListItem } from '../../types';

const gradientBtn = 'bg-gradient-to-r from-violet-500 to-blue-600 text-white hover:opacity-90 rounded-lg px-4 py-2 text-sm font-medium';

function ArtistCard({ artist }: { artist: ArtistProfileListItem }) {
  const name = artist.displayName || 'Artista';
  const photo = artist.photo;
  const city = artist.city || '—';

  return (
    <Card variant="dark" className="overflow-hidden">
      <div className="p-0">
        <div className="aspect-[4/3] bg-neutral-800 flex items-center justify-center">
          {photo ? (
            <img src={photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl text-neutral-600">🎤</span>
          )}
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-white">{name}</h3>
          <p className="text-sm text-neutral-400">{city}</p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-neutral-500">Consultar precio</span>
            <Link to={`/artist/${artist.uid}`} className={gradientBtn}>
              Ver perfil
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function HomeClientePage() {
  useAuth();
  const [artists, setArtists] = useState<ArtistProfileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');

  useEffect(() => {
    let cancelled = false;
    listArtistProfiles()
      .then((list) => {
        if (!cancelled) setArtists(list);
      })
      .catch(() => {
        if (!cancelled) setArtists([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = artists.filter((a) => {
    const matchSearch = !search.trim() || (a.displayName?.toLowerCase().includes(search.toLowerCase()) || (a.city?.toLowerCase().includes(search.toLowerCase())));
    const matchCity = !filterCity || a.city === filterCity;
    return matchSearch && matchCity;
  });
  const cities = [...new Set(artists.map((a) => a.city).filter(Boolean))] as string[];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {/* Left sidebar */}
      <aside className="w-56 shrink-0 border-r border-neutral-800 flex flex-col bg-neutral-900">
        <Link to="/" className="p-4 flex items-baseline gap-1.5">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-blue-600 bg-clip-text text-transparent">Q</span>
          <span className="text-white font-semibold">-Sonic</span>
          <span className="text-xs text-neutral-400 ml-0.5">Prime</span>
        </Link>
        <nav className="p-2 flex-1">
          <Link to="/client" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/20 text-violet-300">
            Inicio
          </Link>
          <Link to="/client/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800">
            Mi perfil
          </Link>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          variant="dark"
          right={
            <div className="flex items-center gap-2 w-full max-w-md">
              <input
                type="search"
                placeholder="Buscar artista, género o ciudad"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <UserMenu />
            </div>
          }
        />

        <main className="flex-1 flex gap-6 p-6 overflow-auto">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white mb-1">Encuentra artistas para tu evento</h1>
            <p className="text-neutral-400 mb-6">Explora talentos disponibles cerca de ti.</p>

            <div className="flex flex-wrap gap-3 mb-6">
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="">Ubicación</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <p className="text-neutral-500">Cargando artistas...</p>
            ) : filtered.length === 0 ? (
              <p className="text-neutral-500">No hay artistas que coincidan.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((artist) => (
                  <ArtistCard key={artist.uid} artist={artist} />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="w-72 shrink-0 space-y-4 hidden xl:block">
            <Card variant="dark" title="Mi Billetera">
              <p className="text-2xl font-semibold text-white mb-2">$0.00 USD</p>
              <button type="button" className={gradientBtn}>+ Recargar</button>
            </Card>
            <Card variant="dark" title="Próximo show">
              <p className="text-neutral-400 text-sm mb-2">Sin shows programados</p>
              <button type="button" className="text-sm text-violet-400 hover:underline">Ver detalles</button>
            </Card>
          </aside>
        </main>
      </div>
    </div>
  );
}
