export const MAX_PINNED_ITEMS = 3;

type PinnedCollection = 'services' | 'riders';

function getPinnedStorageKey(artistId: string, collection: PinnedCollection): string {
  return `artist:${artistId}:${collection}:pinned`;
}

export function getPinnedItemIds(artistId: string | undefined, collection: PinnedCollection): string[] {
  if (!artistId) return [];
  try {
    const raw = window.localStorage.getItem(getPinnedStorageKey(artistId, collection));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export function savePinnedItemIds(
  artistId: string | undefined,
  collection: PinnedCollection,
  nextIds: string[],
): string[] {
  if (!artistId) return [];
  const deduped = Array.from(new Set(nextIds)).slice(0, MAX_PINNED_ITEMS);
  try {
    window.localStorage.setItem(getPinnedStorageKey(artistId, collection), JSON.stringify(deduped));
  } catch {
    // Ignore storage failures (private mode / quota exceeded).
  }
  return deduped;
}

export function togglePinnedItemId(
  currentPinnedIds: string[],
  itemId: string,
): { nextPinnedIds: string[]; exceededLimit: boolean } {
  if (currentPinnedIds.includes(itemId)) {
    return {
      nextPinnedIds: currentPinnedIds.filter((id) => id !== itemId),
      exceededLimit: false,
    };
  }
  if (currentPinnedIds.length >= MAX_PINNED_ITEMS) {
    return {
      nextPinnedIds: currentPinnedIds,
      exceededLimit: true,
    };
  }
  return {
    nextPinnedIds: [...currentPinnedIds, itemId],
    exceededLimit: false,
  };
}

export function sortPinnedFirst<T extends { id: string }>(items: T[], pinnedIds: string[]): T[] {
  if (items.length === 0 || pinnedIds.length === 0) return items;
  const pinRank = new Map<string, number>();
  pinnedIds.forEach((id, index) => pinRank.set(id, index));
  return [...items].sort((a, b) => {
    const aRank = pinRank.get(a.id);
    const bRank = pinRank.get(b.id);
    if (aRank === undefined && bRank === undefined) return 0;
    if (aRank === undefined) return 1;
    if (bRank === undefined) return -1;
    return aRank - bRank;
  });
}
