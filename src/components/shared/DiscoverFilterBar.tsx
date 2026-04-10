import { FiChevronDown } from 'react-icons/fi';
import type { ArtistProfileListFilters } from '../../api';

const GENRE_OPTIONS = ['', 'Pop', 'Rock', 'Salsa', 'Jazz', 'Urbano', 'Acústico'] as const;
const CITY_OPTIONS = ['', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla'] as const;

type DiscoverFilterBarProps = {
  filters: ArtistProfileListFilters;
  onChange: (next: ArtistProfileListFilters) => void;
};

export function DiscoverFilterBar({ filters, onChange }: DiscoverFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 pb-8 items-end">
      <div className="relative min-w-[140px]">
        <label className="sr-only">Género</label>
        <select
          className="appearance-none w-full pl-3.5 pr-9 py-2 rounded-full bg-neutral-900/90 border border-white/10 text-sm text-white font-medium cursor-pointer hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-accent/30"
          value={filters.genre ?? ''}
          onChange={(e) => onChange({ ...filters, genre: e.target.value || undefined })}
        >
          <option value="">Género</option>
          {GENRE_OPTIONS.filter(Boolean).map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <FiChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
          size={16}
          aria-hidden
        />
      </div>

      <div className="relative min-w-[140px]">
        <label className="sr-only">Ciudad</label>
        <select
          className="appearance-none w-full pl-3.5 pr-9 py-2 rounded-full bg-neutral-900/90 border border-white/10 text-sm text-white font-medium cursor-pointer hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-accent/30"
          value={filters.city ?? ''}
          onChange={(e) => onChange({ ...filters, city: e.target.value || undefined })}
        >
          <option value="">Ciudad</option>
          {CITY_OPTIONS.filter(Boolean).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <FiChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
          size={16}
          aria-hidden
        />
      </div>

      <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wide text-neutral-500">
        <span className="sr-only">Precio mínimo USD</span>
        <span className="not-sr-only">Min USD</span>
        <input
          type="number"
          min={0}
          placeholder="—"
          className="w-24 rounded-full bg-neutral-900/90 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30"
          value={filters.minPrice ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange({
              ...filters,
              minPrice: v === '' ? undefined : Number(v),
            });
          }}
        />
      </label>

      <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wide text-neutral-500">
        <span className="sr-only">Precio máximo USD</span>
        <span className="not-sr-only">Max USD</span>
        <input
          type="number"
          min={0}
          placeholder="—"
          className="w-24 rounded-full bg-neutral-900/90 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30"
          value={filters.maxPrice ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange({
              ...filters,
              maxPrice: v === '' ? undefined : Number(v),
            });
          }}
        />
      </label>

      <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-neutral-900/90 px-3 py-2 text-sm text-white cursor-pointer hover:border-white/20">
        <input
          type="checkbox"
          className="rounded border-white/20 bg-black/40 text-accent focus:ring-accent/40"
          checked={filters.availableToday === true}
          onChange={(e) =>
            onChange({
              ...filters,
              availableToday: e.target.checked ? true : undefined,
            })
          }
        />
        Disponible hoy
      </label>
    </div>
  );
}
