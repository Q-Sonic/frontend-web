import { ArtistProfileRiderCard } from './ArtistProfileRiderCard';

export interface ArtistRiderItem {
  id: string;
  title: string;
  description: string;
  bulletItems: string[];
  imageUrl: string;
  documentUrl?: string;
}

interface ArtistProfileRidersGridProps {
  items: ArtistRiderItem[];
  onMissingDocumentClick?: () => void;
}

export function ArtistProfileRidersGrid({ items, onMissingDocumentClick }: ArtistProfileRidersGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center">
        <p className="text-sm text-neutral-400">No hay riders cargados por ahora.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <ArtistProfileRiderCard
          key={item.id}
          title={item.title}
          description={item.description}
          bulletItems={item.bulletItems}
          imageUrl={item.imageUrl}
          documentUrl={item.documentUrl}
          onMissingDocumentClick={onMissingDocumentClick}
        />
      ))}
    </div>
  );
}
