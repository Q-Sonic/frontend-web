import { ARTIST_PROFILE_ACCENT } from '../../helpers/artistProfile';

export function ArtistProfileAvailabilityDay({
  dayShort,
  num,
  reserved,
  onClick,
}: {
  dayShort: string;
  num: number;
  reserved: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 flex flex-col items-center justify-center min-w-[48px] sm:min-w-[52px] flex-1 max-w-[72px] rounded-xl px-2 py-3 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
        reserved ? 'text-white' : 'bg-white text-neutral-900 shadow-sm'
      }`}
      style={reserved ? { backgroundColor: ARTIST_PROFILE_ACCENT } : undefined}
      aria-label={`${dayShort} ${num}, ${reserved ? 'reservado' : 'disponible'}`}
    >
      <span
        className={`text-sm font-medium leading-tight ${reserved ? 'text-neutral-600' : 'text-neutral-400'}`}
      >
        {dayShort}
      </span>
      <span
        className={`text-2xl font-medium mt-2 mb-3 ${reserved ? 'text-white' : 'text-neutral-950'}`}
      >
        {num}
      </span>
    </button>
  );
}
