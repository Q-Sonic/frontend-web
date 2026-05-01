import { FiChevronDown } from 'react-icons/fi';
import type { ArtistProfileListFilters } from '../../api';

type DiscoverFilterBarProps = {
  filters: ArtistProfileListFilters;
  onChange: (next: ArtistProfileListFilters) => void;
  genreOptions: string[];
  cityOptions: string[];
  resultsCount: number;
};

export function DiscoverFilterBar({
  filters,
  onChange,
  genreOptions,
  cityOptions,
  resultsCount,
}: DiscoverFilterBarProps) {
  const hasInvalidRange =
    filters.minPrice != null &&
    filters.maxPrice != null &&
    Number(filters.minPrice) > Number(filters.maxPrice);
  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined && value !== '');

  const fieldClass =
    'h-10 w-full rounded-lg border border-white/10 bg-neutral-900/70 px-3 text-sm text-white ' +
    'outline-none transition-all placeholder:text-neutral-500 hover:border-white/20 focus:border-accent/40 focus:ring-2 focus:ring-accent/20';

  return (
    <section className="mb-6 rounded-xl border border-white/8 bg-neutral-950/45 p-3.5 md:p-4 shadow-[0_6px_20px_rgba(0,0,0,0.2)] backdrop-blur-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Filtros</h2>
        <div className="text-xs font-medium text-neutral-400">
          {resultsCount} artista{resultsCount === 1 ? '' : 's'} encontrado{resultsCount === 1 ? '' : 's'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-12">
        <div className="relative xl:col-span-2">
          <label className="mb-1 block text-xs font-medium text-neutral-400">Genero</label>
          <select
            className={`${fieldClass} appearance-none pl-3.5 pr-9 font-medium cursor-pointer`}
            value={filters.genre ?? ''}
            onChange={(e) => onChange({ ...filters, genre: e.target.value || undefined })}
          >
            <option value="">Todos</option>
            {genreOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <FiChevronDown className="pointer-events-none absolute right-3 top-[1.95rem] text-neutral-400" size={15} aria-hidden />
        </div>

        <div className="relative xl:col-span-2">
          <label className="mb-1 block text-xs font-medium text-neutral-400">Ciudad</label>
          <select
            className={`${fieldClass} appearance-none pl-3.5 pr-9 font-medium cursor-pointer`}
            value={filters.city ?? ''}
            onChange={(e) => onChange({ ...filters, city: e.target.value || undefined })}
          >
            <option value="">Todas</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <FiChevronDown className="pointer-events-none absolute right-3 top-[1.95rem] text-neutral-400" size={15} aria-hidden />
        </div>

        <label className="flex flex-col gap-1 xl:col-span-2">
          <span className="text-xs font-medium text-neutral-400">Monto minimo (USD)</span>
          <input
            type="number"
            min={0}
            placeholder="Ej: 100"
            className={`${fieldClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            value={filters.minPrice ?? ''}
            onChange={(e) => {
              const v = e.target.value.trim();
              onChange({
                ...filters,
                minPrice: v === '' ? undefined : Math.max(0, Number(v)),
              });
            }}
          />
        </label>

        <label className="flex flex-col gap-1 xl:col-span-2">
          <span className="text-xs font-medium text-neutral-400">Monto maximo (USD)</span>
          <input
            type="number"
            min={0}
            placeholder="Ej: 500"
            className={`${fieldClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            value={filters.maxPrice ?? ''}
            onChange={(e) => {
              const v = e.target.value.trim();
              onChange({
                ...filters,
                maxPrice: v === '' ? undefined : Math.max(0, Number(v)),
              });
            }}
          />
        </label>

        <label className="inline-flex h-10 items-center gap-2.5 rounded-lg border border-white/10 bg-neutral-900/70 px-3 text-sm text-white cursor-pointer transition-all hover:border-white/25 xl:col-span-2 xl:mt-[1.45rem]">
          <span className="relative inline-flex h-5 w-5 items-center justify-center">
            <input
              type="checkbox"
              className="peer absolute inset-0 h-5 w-5 cursor-pointer appearance-none rounded border border-white/30 bg-black/40 transition-all checked:border-accent checked:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-accent/35"
              checked={filters.availableToday === true}
              onChange={(e) =>
                onChange({
                  ...filters,
                  availableToday: e.target.checked ? true : undefined,
                })
              }
            />
            <svg
              viewBox="0 0 20 20"
              className="pointer-events-none h-3.5 w-3.5 text-accent opacity-0 transition-opacity peer-checked:opacity-100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
            >
              <path d="M5 10.5l3.1 3.1L15 6.8" />
            </svg>
          </span>
          <span className="font-medium">Disponible hoy</span>
        </label>

        <div className="flex items-end xl:col-span-2 xl:mt-[1.45rem]">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => onChange({})}
              className="h-10 w-full rounded-lg border border-white/15 bg-white/2 px-3 text-xs font-semibold text-neutral-200 transition-all hover:border-accent/45 hover:text-white"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
      </div>

      {hasInvalidRange ? (
        <p className="mt-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300">
          El monto minimo no puede ser mayor que el monto maximo.
        </p>
      ) : null}
    </section>
  );
}
