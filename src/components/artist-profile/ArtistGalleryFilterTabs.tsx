export type GalleryFilterKey = 'all' | 'photos' | 'videos';

interface GalleryFilterTabsProps {
  activeFilter: GalleryFilterKey;
  onChange: (filter: GalleryFilterKey) => void;
  /** Shown on the right on wide screens (e.g. result count). */
  resultCount?: number;
}

const FILTER_OPTIONS: Array<{ key: GalleryFilterKey; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'photos', label: 'Imágenes' },
  { key: 'videos', label: 'Video' },
];

export function ArtistGalleryFilterTabs({
  activeFilter,
  onChange,
  resultCount,
}: GalleryFilterTabsProps) {
  return (
    <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div
        role="tablist"
        aria-label="Filtrar galería"
        className="inline-flex max-w-full min-w-0 snap-x snap-mandatory items-center gap-1 overflow-x-auto overscroll-x-contain rounded-full p-1.5 pb-2 shadow-inner [-webkit-overflow-scrolling:touch] sm:pb-1.5"
        style={{
          backgroundColor: '#d2d5da',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.06)',
        }}
      >
        {FILTER_OPTIONS.map((option) => {
          const active = option.key === activeFilter;
          return (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.key)}
              className={`touch-manipulation snap-start min-h-[44px] whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm font-semibold tracking-tight transition sm:min-h-0 sm:px-4 sm:py-2 ${
                active
                  ? 'bg-[#0a0a0a] text-white shadow-[0_1px_2px_rgba(0,0,0,0.25)]'
                  : 'text-neutral-800/90 hover:text-neutral-950 hover:bg-black/[0.06]'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {resultCount != null ? (
        <p className="shrink-0 text-xs font-medium text-white/55 tabular-nums sm:pl-2 sm:text-sm">
          Mostrar {resultCount} resultados
        </p>
      ) : null}
    </div>
  );
}
