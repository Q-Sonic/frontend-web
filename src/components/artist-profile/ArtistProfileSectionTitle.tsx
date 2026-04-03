import type { ReactNode } from 'react';
import { ArtistProfileEditButton } from './ArtistProfileEditButton';

export function ArtistProfileSectionTitle({
  title,
  onClick,
  isSelfArtist,
  asideContent,
}: {
  title: string;
  onClick?: () => void;
  isSelfArtist?: boolean;
  /** e.g. “Ver más” link aligned with the edit control */
  asideContent?: ReactNode;
}) {
  const hasRight = asideContent != null || onClick != null;

  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
      {hasRight ? (
        <div className="flex shrink-0 items-center gap-3">
          {asideContent}
          {onClick ? (
            <ArtistProfileEditButton show={isSelfArtist ?? false} onClick={onClick} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
