import { useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiSliders, FiX } from 'react-icons/fi';
import type { ArtistProfileListFilters } from '../../api';
import { acquireBodyScrollLock } from '../../helpers/bodyScrollLock';

type DiscoverFilterBarProps = {
  filters: ArtistProfileListFilters;
  onChange: (next: ArtistProfileListFilters) => void;
  genreOptions: string[];
  cityOptions: string[];
  resultsCount: number;
};

type FilterFieldsProps = {
  filters: ArtistProfileListFilters;
  onChange: (next: ArtistProfileListFilters) => void;
  genreOptions: string[];
  cityOptions: string[];
  fieldClass: string;
  /** Taller controls + spacing for touch (mobile sheet) */
  touchLayout?: boolean;
};

function DiscoverFilterFields({
  filters,
  onChange,
  genreOptions,
  cityOptions,
  fieldClass,
  touchLayout,
}: FilterFieldsProps) {
  const chevronTop = touchLayout ? 'top-[2.35rem]' : 'top-[1.95rem]';

  return (
    <div
      className={
        touchLayout
          ? 'grid grid-cols-1 gap-4 sm:grid-cols-2'
          : 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-12'
      }
    >
      <div className={touchLayout ? 'relative' : 'relative xl:col-span-2'}>
        <label className="mb-1.5 block text-xs font-medium text-neutral-400">Genero</label>
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
        <FiChevronDown
          className={`pointer-events-none absolute right-3 ${chevronTop} text-neutral-400`}
          size={touchLayout ? 18 : 15}
          aria-hidden
        />
      </div>

      <div className={touchLayout ? 'relative' : 'relative xl:col-span-2'}>
        <label className="mb-1.5 block text-xs font-medium text-neutral-400">Ciudad</label>
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
        <FiChevronDown
          className={`pointer-events-none absolute right-3 ${chevronTop} text-neutral-400`}
          size={touchLayout ? 18 : 15}
          aria-hidden
        />
      </div>

      <label className={`flex flex-col gap-1 ${touchLayout ? '' : 'xl:col-span-2'}`}>
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

      <label className={`flex flex-col gap-1 ${touchLayout ? '' : 'xl:col-span-2'}`}>
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

      <label
        className={
          touchLayout
            ? 'inline-flex min-h-[44px] items-center gap-2.5 rounded-lg border border-white/10 bg-neutral-900/70 px-3 text-sm text-white cursor-pointer transition-all hover:border-white/25'
            : `inline-flex h-10 items-center gap-2.5 rounded-lg border border-white/10 bg-neutral-900/70 px-3 text-sm text-white cursor-pointer transition-all hover:border-white/25 xl:col-span-2 xl:mt-[1.45rem]`
        }
      >
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

      <div className={touchLayout ? 'pt-1' : 'flex items-end xl:col-span-2 xl:mt-[1.45rem]'}>
        {Object.values(filters).some((value) => value !== undefined && value !== '') ? (
          <button
            type="button"
            onClick={() => onChange({})}
            className="h-11 w-full rounded-lg border border-white/15 bg-white/2 px-3 text-xs font-semibold text-neutral-200 transition-all hover:border-accent/45 hover:text-white touch-manipulation min-h-[44px]"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function DiscoverFilterBar({
  filters,
  onChange,
  genreOptions,
  cityOptions,
  resultsCount,
}: DiscoverFilterBarProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const hasInvalidRange =
    filters.minPrice != null &&
    filters.maxPrice != null &&
    Number(filters.minPrice) > Number(filters.maxPrice);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.genre) n += 1;
    if (filters.city) n += 1;
    if (filters.minPrice != null) n += 1;
    if (filters.maxPrice != null) n += 1;
    if (filters.availableToday) n += 1;
    return n;
  }, [filters]);

  const fieldClassDesktop =
    'h-10 w-full rounded-lg border border-white/10 bg-neutral-900/70 px-3 text-sm text-white ' +
    'outline-none transition-all placeholder:text-neutral-500 hover:border-white/20 focus:border-accent/40 focus:ring-2 focus:ring-accent/20';

  const fieldClassTouch =
    'min-h-[44px] w-full rounded-lg border border-white/10 bg-neutral-900/70 px-3 py-2.5 text-base text-white ' +
    'outline-none transition-all placeholder:text-neutral-500 hover:border-white/20 focus:border-accent/40 focus:ring-2 focus:ring-accent/20';

  useEffect(() => {
    if (!mobileSheetOpen) return;
    const release = acquireBodyScrollLock();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      release();
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileSheetOpen]);

  const invalidRangeMessage = hasInvalidRange ? (
    <p className="mt-3 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300">
      El monto minimo no puede ser mayor que el monto maximo.
    </p>
  ) : null;

  return (
    <>
      {/* Mobile: compact trigger + bottom sheet */}
      <div className="mb-6 md:hidden">
        <div className="flex items-stretch gap-3 rounded-xl border border-white/8 bg-neutral-950/45 p-3 shadow-[0_6px_20px_rgba(0,0,0,0.2)] backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="flex min-h-[44px] min-w-0 flex-1 touch-manipulation items-center gap-2.5 rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-left text-sm font-semibold text-white transition-colors hover:border-accent/35 hover:bg-white/[0.04] active:bg-white/[0.06]"
            aria-expanded={mobileSheetOpen}
            aria-haspopup="dialog"
          >
            <FiSliders className="shrink-0 text-accent" size={18} aria-hidden />
            <span className="min-w-0 truncate">Filtros</span>
            {activeFilterCount > 0 ? (
              <span className="ml-auto shrink-0 rounded-full bg-accent/25 px-2 py-0.5 text-[11px] font-bold tabular-nums text-accent">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          <div className="flex shrink-0 flex-col justify-center border-l border-white/10 pl-3 text-right">
            <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Resultados</span>
            <span className="text-sm font-semibold tabular-nums text-neutral-300">
              {resultsCount}
            </span>
          </div>
        </div>

        {mobileSheetOpen ? (
          <div
            className="fixed inset-0 z-[52] flex flex-col justify-end md:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="discover-filters-sheet-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
              aria-label="Cerrar filtros"
              onClick={() => setMobileSheetOpen(false)}
            />
            <div
              className={
                'relative max-h-[min(88dvh,640px)] w-full overflow-y-auto overscroll-y-contain rounded-t-2xl ' +
                'border border-b-0 border-white/12 bg-neutral-950 shadow-[0_-12px_48px_rgba(0,0,0,0.55)] ' +
                'pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-1'
              }
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-white/8 bg-neutral-950/95 px-4 py-3 backdrop-blur-md">
                <h2 id="discover-filters-sheet-title" className="text-base font-semibold text-white">
                  Filtros
                </h2>
                <button
                  type="button"
                  onClick={() => setMobileSheetOpen(false)}
                  className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full border border-white/15 p-2 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar"
                >
                  <FiX size={22} aria-hidden />
                </button>
              </div>
              <div className="px-4 pb-4 pt-3">
                <DiscoverFilterFields
                  filters={filters}
                  onChange={onChange}
                  genreOptions={genreOptions}
                  cityOptions={cityOptions}
                  fieldClass={fieldClassTouch}
                  touchLayout
                />
                {invalidRangeMessage}
                <button
                  type="button"
                  onClick={() => setMobileSheetOpen(false)}
                  className="mt-5 flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-black transition-opacity hover:opacity-95 active:opacity-90"
                >
                  Ver {resultsCount} resultado{resultsCount === 1 ? '' : 's'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Tablet/desktop: inline panel */}
      <section className="mb-6 hidden rounded-xl border border-white/8 bg-neutral-950/45 p-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.2)] backdrop-blur-sm md:block md:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Filtros</h2>
          <div className="text-xs font-medium text-neutral-400">
            {resultsCount} artista{resultsCount === 1 ? '' : 's'} encontrado{resultsCount === 1 ? '' : 's'}
          </div>
        </div>

        <DiscoverFilterFields
          filters={filters}
          onChange={onChange}
          genreOptions={genreOptions}
          cityOptions={cityOptions}
          fieldClass={fieldClassDesktop}
        />

        {invalidRangeMessage}
      </section>
    </>
  );
}
