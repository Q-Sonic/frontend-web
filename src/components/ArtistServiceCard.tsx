import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import type { ArtistServiceRecord } from '../types';
import { formatMoney } from '../helpers/money';

/** Passed through React Router so the service detail view can show the chosen row immediately. */
export const ARTIST_SERVICE_LINK_STATE_KEY = 'artistService' as const;

const ACCENT_HEX = '#00d4c8';

/** Same shell as `ArtistProfileRiderCard` (Documentos → Riders técnicos): border, fill, hover lift + glow. */
const cardShell =
  'group relative overflow-hidden rounded-3xl border border-[#00d4c8]/20 bg-white/[0.04] ' +
  'transition-all duration-300 hover:-translate-y-1 hover:border-[#00d4c8]/50 ' +
  'hover:shadow-[0_0_24px_rgba(0,212,200,0.35)]';

export type ArtistServiceCardProps = {
  service: ArtistServiceRecord;
  coverPhotoUrl?: string | null;
  features?: string[];
  isSelfArtist?: boolean;
  hireLinkTo?: string;
};

export function ArtistServiceCard({
  service,
  coverPhotoUrl,
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
    <article className={`flex h-full min-h-0 flex-col ${cardShell}`}>
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-neutral-950">
        {coverPhotoUrl ? (
          <img
            src={coverPhotoUrl}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div
            className="h-full w-full opacity-90"
            style={{
              background: `linear-gradient(135deg, ${ACCENT_HEX}33 0%, transparent 60%), linear-gradient(225deg, #27272a 0%, #0a0a0a 100%)`,
            }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-neutral-950/40 to-transparent" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-semibold leading-snug text-white break-words sm:text-2xl">
            {service.name}
          </h3>
          <div className="flex flex-col items-end gap-0.5 self-end text-right">
            <span className="text-2xl font-semibold tabular-nums text-accent whitespace-nowrap sm:text-3xl">
              ${formatMoney(service.price)}
            </span>
            <span className="text-sm text-neutral-400">por hora</span>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400 line-clamp-4 sm:text-base">
          {service.description || '—'}
        </p>
        {features.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-400 sm:mt-4 sm:space-y-2">
            {features.map((line) => (
              <li key={line} className="mt-0.5 flex gap-2">
                <span className="shrink-0 text-accent">✓</span>
                <span className="min-w-0 leading-snug">{line}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-6">
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
              state={{ [ARTIST_SERVICE_LINK_STATE_KEY]: service }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-center text-base font-semibold text-white transition hover:bg-accent/80 sm:text-lg"
            >
              <TextButton />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
