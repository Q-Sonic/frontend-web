import { Link } from 'react-router-dom';
import { FiChevronDown, FiClock } from 'react-icons/fi';
import { ClientAreaHeader } from '../../components/client/ClientAreaHeader';
import { ClientFloatingChatButton } from '../../components/client/ClientFloatingChatButton';
import { mockClientArtistCards, type ClientArtistCard } from '../../mocks/client';

const filterPills = [
  { id: 'genre', label: 'Genero' },
  { id: 'location', label: 'Ubicacion' },
  { id: 'price', label: 'Precio' },
  { id: 'rating', label: 'Rating' },
  { id: 'available', label: 'Disponible' },
] as const;

export function DashboardPage() {
  return (
    <div className="relative min-h-full bg-surface text-neutral-100">
      <div className="p-4 md:p-6 pb-28">
        <div>
          <ClientAreaHeader />

          <section className="pt-2 pb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Encuentra artistas para tu evento
            </h1>
            <p className="mt-2 text-sm md:text-base text-neutral-500">
              Explora cantantes disponibles cerca de ti
            </p>
          </section>

          <div className="flex flex-wrap gap-2 pb-8">
            {filterPills.map((pill) => (
              <div key={pill.id} className="relative">
                <label className="sr-only">{pill.label}</label>
                <select
                  className="appearance-none pl-3.5 pr-9 py-2 rounded-full bg-neutral-900/90 border border-white/10 text-sm text-white font-medium cursor-pointer hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  defaultValue=""
                >
                  <option value="" disabled>
                    {pill.label}
                  </option>
                  <option value="all">Todos</option>
                </select>
                <FiChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  size={16}
                  aria-hidden
                />
              </div>
            ))}
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-7 gap-5 md:gap-6">
            {mockClientArtistCards.map((artist) => (
              <li key={artist.id}>
                <ArtistCard artist={artist} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ClientFloatingChatButton />
    </div>
  );
}

const ArtistCard = ({ artist }: { artist: ClientArtistCard }) => {
  return (
    <article
      className="group rounded-2xl overflow-hidden border border-accent/20 bg-card/40 shadow-[0_0_16px_rgba(0,204,203,0.1)] flex flex-col"
      style={{ boxShadow: '0 0 20px rgba(0, 204, 203, 0.12)' }}
    >
      <div className="aspect-4/3 overflow-hidden bg-black/40">
        <img
          src={artist.imageUrl}
          alt=""
          className="w-full h-full object-cover grayscale-[0.35] contrast-[0.95] group-hover:grayscale-0 transition-all duration-300"
        />
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex gap-3 justify-between items-start">
          <div className="min-w-0">
            <h2 className="font-semibold text-white truncate">{artist.name}</h2>
            <p className="text-sm text-neutral-500 truncate">{artist.genre}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">Tarifa desde</p>
            <p className="text-lg font-semibold text-white tabular-nums">
              ${artist.priceUsd} USD
            </p>
          </div>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div className="min-w-0 text-xs text-neutral-400 flex items-center gap-1.5">
            {artist.availableToday ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Disponible hoy</span>
              </>
            ) : (
              <>
                <FiClock className="text-accent shrink-0" size={14} aria-hidden />
                <span className="truncate">{artist.availableDateLabel}</span>
              </>
            )}
          </div>
          <Link
            to={`/artist/${artist.id}`}
            className="shrink-0 inline-flex items-center justify-center rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 transition-colors"
          >
            Ver Perfil
          </Link>
        </div>
      </div>
    </article>
  );
};
