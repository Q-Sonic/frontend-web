import type { ArtistMediaItem } from '../../types';

interface ArtistGalleryMasonryGridProps {
  items: ArtistMediaItem[];
}

const HEIGHT_VARIANTS = ['h-44', 'h-52', 'h-40', 'h-56', 'h-48'] as const;

function getMediaTypeBadge(type: ArtistMediaItem['type']) {
  if (type === 'video') return 'Video';
  if (type === 'audio') return 'Audio';
  return 'Foto';
}

export function ArtistGalleryMasonryGrid({ items }: ArtistGalleryMasonryGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center">
        <p className="text-sm text-white/60">Todavia no hay elementos para este filtro.</p>
      </div>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 xl:columns-4 [&>*]:mb-4">
      {items.map((item, index) => {
        const heightClass = HEIGHT_VARIANTS[index % HEIGHT_VARIANTS.length];
        return (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative block w-full overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 ${heightClass} break-inside-avoid transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00d4c8]/45 hover:shadow-[0_0_18px_rgba(0,212,200,0.28)]`}
          >
            {item.type === 'video' ? (
              <video
                src={item.url}
                className="h-full w-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={item.url}
                alt={item.name ?? 'Media'}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between gap-2">
              <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/90">
                {getMediaTypeBadge(item.type)}
              </span>
              <span className="truncate text-xs text-white/80">{item.name || 'Sin titulo'}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
