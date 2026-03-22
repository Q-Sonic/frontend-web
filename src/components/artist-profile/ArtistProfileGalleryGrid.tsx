import type { ArtistMediaItem } from '../../types';

const defaultGalleryYear = new Date().getFullYear();

export function ArtistProfileGalleryGrid({ images }: { images: ArtistMediaItem[] }) {
  const count = images.length;
  const itemWidthClass =
    count === 1
      ? 'w-full max-w-3xl'
      : 'w-[calc(50%-0.5rem)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]';

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {images.map((img) => (
        <div
          key={img.url}
          className={`relative aspect-3/2 shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-neutral-900 ${itemWidthClass}`}
        >
          <img
            src={img.url}
            alt={img.name ?? 'Imagen'}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/55 via-black/20 to-transparent"
            aria-hidden
          />
          <span className="absolute left-4 top-4 z-10 text-sm font-medium text-white drop-shadow-sm">
            {defaultGalleryYear}
          </span>
        </div>
      ))}
    </div>
  );
}
