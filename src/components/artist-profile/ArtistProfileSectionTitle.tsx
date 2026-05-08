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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="min-w-0 text-2xl font-bold tracking-tight text-white break-words sm:text-3xl">
            {title}
          </h2>
          {editButton}
        </div>
        {asideContent != null ? (
          <div className="flex shrink-0 items-center gap-3 sm:justify-end">{asideContent}</div>
        ) : null}
      </div>
    );
  }

  const hasRight = asideContent != null || onClick != null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <h2 className="min-w-0 text-2xl font-bold tracking-tight text-white break-words sm:text-3xl">
        {title}
      </h2>
      {hasRight ? (
        <div className="flex shrink-0 items-center gap-3">
          {asideContent}
          {editButton}
        </div>
      ) : null}
    </div>
  );
}
