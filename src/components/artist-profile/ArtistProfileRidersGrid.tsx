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
  pinnedIds?: string[];
  canTogglePin?: boolean;
  onTogglePin?: (id: string) => void;
  /** Per card: opens linked-services UI (client view). */
  getOnViewLinkedServices?: (item: ArtistRiderItem) => (() => void) | undefined;
}

export function ArtistProfileRidersGrid({
  items,
  onMissingDocumentClick,
  pinnedIds = [],
  canTogglePin = false,
  onTogglePin,
  getOnViewLinkedServices,
}: ArtistProfileRidersGridProps) {
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
          id={item.id}
          title={item.title}
          description={item.description}
          bulletItems={item.bulletItems}
          imageUrl={item.imageUrl}
          documentUrl={item.documentUrl}
          onMissingDocumentClick={onMissingDocumentClick}
          onViewLinkedServices={getOnViewLinkedServices?.(item)}
          isPinned={pinnedIds.includes(item.id)}
          canTogglePin={canTogglePin}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}
