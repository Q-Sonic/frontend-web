import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import type { ArtistServiceRecord } from '../types';
import { formatMoney } from '../helpers/money';

const ACCENT_HEX = '#00d4c8';

export type ArtistServiceCardProps = {
  service: Pick<ArtistServiceRecord, 'id' | 'name' | 'price' | 'description'>;
  coverPhotoUrl?: string | null;
  highlighted?: boolean;
  features?: string[];
  isSelfArtist?: boolean;
  hireLinkTo?: string;
};

export function ArtistServiceCard({
  service,
  coverPhotoUrl,
  highlighted = false,
  features = [],
  isSelfArtist = false,
  hireLinkTo = '/artist/services',
}: ArtistServiceCardProps) {

  const TextButton = () => {
    return (
      <>
        <span>Contratar ahora</span>
        <FiArrowRight className="text-white" size={20} />
      </>
    );
  };

  return (
    <article
      className={`rounded-2xl border overflow-hidden flex flex-col bg-neutral-900/30 ${
        highlighted ? 'border-accent/50 ring-1 ring-accent/20' : 'border-white/8'
      }`}
    >
      <div className="h-36 bg-neutral-800 relative overflow-hidden shrink-0">
        {coverPhotoUrl ? (
          <img src={coverPhotoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full opacity-90"
            style={{
              background: `linear-gradient(135deg, ${ACCENT_HEX}33 0%, transparent 60%), linear-gradient(225deg, #27272a 0%, #0a0a0a 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-neutral-900/30 to-transparent" />
      </div>

      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-2xl text-white font-semibold leading-snug">{service.name}</h3>
          <div className="flex flex-col items-end gap-1">
            <span className="text-3xl text-accent font-semibold whitespace-nowrap">
              ${formatMoney(service.price)}
            </span>
            <span className="text text-neutral-400">por hora</span>
          </div>
        </div>
        <p className="text-neutral-400 mt-3 leading-relaxed line-clamp-3">
          {service.description || '—'}
        </p>
        {features.length > 0 && (
          <ul className="mt-4 space-y-2 text-neutral-400">
            {features.map((line) => (
              <li key={line} className="flex gap-2 mt-0.5">
                <span className="text-accent">✓</span>
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6">
          {isSelfArtist ? (
            <div
              className="w-full bg-accent/50 text-white/70 text-xl text-center font-semibold px-4 py-2 rounded-full flex justify-center items-center gap-2 opacity-60 cursor-not-allowed select-none"
              tabIndex={-1}
              aria-disabled="true"
            >
              <TextButton />
            </div>
          ) : (
            <Link
              to={hireLinkTo}
              className="w-full bg-accent text-white text-xl text-center font-semibold px-4 py-2 rounded-full flex justify-center items-center gap-2 hover:bg-accent/80 transition"
            >
              <TextButton />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
