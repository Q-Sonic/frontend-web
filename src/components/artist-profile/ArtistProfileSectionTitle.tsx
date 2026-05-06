import type { ReactNode } from 'react';
import { ArtistProfileEditButton } from './ArtistProfileEditButton';

export function ArtistProfileSectionTitle({
  title,
  onClick,
  isSelfArtist,
  asideContent,
  /** Edit icon immediately after the title (left); aside content stays on the right */
  editAfterTitle = false,
}: {
  title: string;
  onClick?: () => void;
  isSelfArtist?: boolean;
  /** e.g. “Ver más” link aligned with the edit control */
  asideContent?: ReactNode;
  editAfterTitle?: boolean;
}) {
  const editButton =
    onClick != null ? (
      <ArtistProfileEditButton show={isSelfArtist ?? false} onClick={onClick} />
    ) : null;

  if (editAfterTitle) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="shrink-0 text-3xl font-bold tracking-tight text-white">{title}</h2>
          {editButton}
        </div>
        {asideContent != null ? (
          <div className="flex shrink-0 items-center gap-3">{asideContent}</div>
        ) : null}
      </div>
    );
  }

  const hasRight = asideContent != null || onClick != null;

  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
      {hasRight ? (
        <div className="flex shrink-0 items-center gap-3">
          {asideContent}
          {editButton}
        </div>
      ) : null}
    </div>
  );
}
