export type GalleryFilterKey = 'all' | 'photos' | 'videos' | 'concerts' | 'backstage' | 'fans';

interface GalleryFilterTabsProps {
  activeFilter: GalleryFilterKey;
  onChange: (filter: GalleryFilterKey) => void;
}

const FILTER_OPTIONS: Array<{ key: GalleryFilterKey; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'photos', label: 'Fotos' },
  { key: 'videos', label: 'Videos' },
  { key: 'concerts', label: 'Conciertos' },
  { key: 'backstage', label: 'Backstage' },
  { key: 'fans', label: 'Fans' },
];

export function ArtistGalleryFilterTabs({ activeFilter, onChange }: GalleryFilterTabsProps) {
  return (
    <div
      className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1.5 shadow-inner"
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
            onClick={() => onChange(option.key)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold tracking-tight transition ${
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
  );
}
