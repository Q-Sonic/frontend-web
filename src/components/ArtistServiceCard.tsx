import { Link } from 'react-router-dom';
import { FiAlertCircle, FiArrowRight, FiEdit2 } from 'react-icons/fi';
import { FaThumbtack } from 'react-icons/fa6';
import type { ArtistServiceRecord } from '../types';
import { formatMoney } from '../helpers/money';
import {
  artistServiceDraftCtaLabel,
  artistServiceDraftVisibilityHint,
  artistServiceHasContractLinked,
  artistServiceHasTechnicalRiderLinked,
} from '../helpers/artistServiceVisibility';

/** Passed through React Router so the service detail view can show the chosen row immediately. */
export const ARTIST_SERVICE_LINK_STATE_KEY = 'artistService' as const;

const ACCENT_HEX = '#00d4c8';

const cardShellActive =
  'group relative overflow-hidden rounded-3xl border border-[#00d4c8]/20 bg-white/[0.04] ' +
  'transition-all duration-300 hover:-translate-y-1 hover:border-[#00d4c8]/50 ' +
  'hover:shadow-[0_0_24px_rgba(0,212,200,0.35)]';

const cardShellDraft =
  'group relative overflow-hidden rounded-3xl border border-amber-400/30 bg-[#0f1114] ' +
  'shadow-[inset_0_1px_0_rgba(251,191,36,0.08)] transition-all duration-200 hover:border-amber-400/45';

export type ArtistServiceCardProps = {
  service: ArtistServiceRecord;
  coverPhotoUrl?: string | null;
  features?: string[];
  isSelfArtist?: boolean;
  hireLinkTo?: string;
  isPinned?: boolean;
  documentsComplete?: boolean;
  documentsHref?: string;
  /** When set on draft cards, replaces the Documentos link with opening the admin editor for this service. */
  onContinueEditingDraft?: (service: ArtistServiceRecord) => void;
};

function DraftChip({ ok, short }: { ok: boolean; short: string }) {
  return (
    <span
      className={`rounded-lg border px-2 py-1 text-[11px] font-semibold tabular-nums sm:text-xs ${
        ok
          ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-100'
          : 'border-amber-400/40 bg-amber-500/15 text-amber-100'
      }`}
    >
      {short} {ok ? '✓' : '✗'}
    </span>
  );
}

export function ArtistServiceCard({
  service,
  coverPhotoUrl,
  features = [],
  isSelfArtist = false,
  hireLinkTo = '/artist/services',
  isPinned = false,
  documentsComplete = true,
  documentsHref,
  onContinueEditingDraft,
}: ArtistServiceCardProps) {
  const shell = documentsComplete ? cardShellActive : cardShellDraft;
  const hasContract = artistServiceHasContractLinked(service);
  const hasRider = artistServiceHasTechnicalRiderLinked(service);
  const draftHint = artistServiceDraftVisibilityHint(service);
  const draftCta = artistServiceDraftCtaLabel(service);

  const TextButton = () => {
    return (
      <>
        <span>Contratar ahora</span>
        <FiArrowRight className="text-white" size={20} />
      </>
    );
  };

  return (
    <article className={`flex h-full min-h-0 w-full min-w-0 flex-col ${shell}`}>
      <div className="relative aspect-[4/3] w-full min-w-0 shrink-0 overflow-hidden bg-neutral-950">
        {coverPhotoUrl ? (
          <img
            src={coverPhotoUrl}
            alt=""
            className={`h-full w-full min-h-0 min-w-0 object-cover object-center ${!documentsComplete ? 'opacity-50' : ''}`}
          />
        ) : (
          <div
            className={documentsComplete ? 'h-full w-full opacity-90' : 'h-full w-full opacity-50'}
            style={{
              background: documentsComplete
                ? `linear-gradient(135deg, ${ACCENT_HEX}33 0%, transparent 60%), linear-gradient(225deg, #27272a 0%, #0a0a0a 100%)`
                : 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, transparent 55%), linear-gradient(225deg, #1c1917 0%, #0a0a0a 100%)',
            }}
          />
        )}
        <div
          className={`pointer-events-none absolute inset-0 bg-linear-to-t from-neutral-950/40 to-transparent ${!documentsComplete ? 'from-neutral-950/75' : ''}`}
        />
        {!documentsComplete && (
          <div
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-4"
            role="status"
            aria-label={draftHint}
          >
            <div
              className="w-full max-w-[min(100%,17.5rem)] rounded-2xl bg-transparent px-3 py-3 sm:max-w-[19rem] sm:px-4 sm:py-4 [&_*]:[text-shadow:0_1px_10px_rgba(0,0,0,0.92),0_2px_20px_rgba(0,0,0,0.65)]"
            >
              <div className="mb-2 flex items-center justify-center gap-2 text-amber-100">
                <FiAlertCircle className="size-4 shrink-0 text-amber-400 sm:size-5" aria-hidden />
                <span className="text-center text-xs font-semibold uppercase tracking-wide text-amber-50 sm:text-sm">
                  Borrador · no visible
                </span>
              </div>
              <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                <DraftChip ok={hasContract} short="Contrato" />
                <DraftChip ok={hasRider} short="Rider" />
              </div>
              <p className="line-clamp-3 text-center text-xs leading-relaxed text-amber-50/95 sm:text-sm sm:leading-snug">
                {draftHint}
              </p>
            </div>
          </div>
        )}
        {isPinned && (
          <div
            className="absolute left-3 top-3 z-40 inline-flex items-center gap-1 rounded-full border border-accent/55 bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-accent backdrop-blur-sm"
          >
            <FaThumbtack size={11} className="-rotate-45" aria-hidden />
            Fijado
          </div>
        )}
      </div>

      <div className={`flex min-h-0 min-w-0 flex-1 flex-col p-5 sm:p-6 ${!documentsComplete ? 'opacity-[0.97]' : ''}`}>
        <div className="flex w-full min-w-0 flex-col gap-3">
          <h3 className="text-xl font-semibold leading-snug text-white break-words sm:text-2xl">
            {service.name}
          </h3>
          <div className="flex w-full min-w-0 flex-col items-end gap-0.5 text-right">
            <span
              className={`text-2xl font-semibold tabular-nums whitespace-nowrap sm:text-3xl ${documentsComplete ? 'text-accent' : 'text-amber-200/95'}`}
            >
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
                <span className={`shrink-0 ${documentsComplete ? 'text-accent' : 'text-amber-400/75'}`}>✓</span>
                <span className="min-w-0 leading-snug">{line}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-6">
          {!documentsComplete ? (
            onContinueEditingDraft ? (
              <button
                type="button"
                onClick={() => onContinueEditingDraft(service)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-amber-400/45 bg-amber-500/15 px-4 py-2.5 text-center text-sm font-semibold text-amber-100 transition hover:border-amber-300/55 hover:bg-amber-500/25 sm:text-base"
              >
                Continuar editando
                <FiEdit2 className="size-4 shrink-0 text-amber-200" aria-hidden />
              </button>
            ) : documentsHref ? (
              <Link
                to={documentsHref}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-amber-400/45 bg-amber-500/15 px-4 py-2.5 text-center text-sm font-semibold text-amber-100 transition hover:border-amber-300/55 hover:bg-amber-500/25 sm:text-base"
              >
                {draftCta}
                <FiArrowRight className="size-4 shrink-0 text-amber-200" aria-hidden />
              </Link>
            ) : (
              <div
                className="flex w-full cursor-not-allowed select-none items-center justify-center gap-2 rounded-full border border-amber-500/35 bg-amber-950/35 px-4 py-2.5 text-center text-sm font-semibold text-amber-100/85 sm:text-base"
                aria-disabled="true"
              >
                {draftCta}
              </div>
            )
          ) : isSelfArtist ? (
            <div
              className="flex w-full cursor-not-allowed select-none items-center justify-center gap-2 rounded-full bg-accent/50 px-4 py-2 text-center text-base font-semibold text-white/70 opacity-60 sm:text-lg"
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
