import { ArtistProfileEditButton } from './ArtistProfileEditButton';

export function ArtistProfileSectionTitle({
  title,
  onClick,
  isSelfArtist,
}: {
  title: string;
  onClick: () => void;
  isSelfArtist?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
      <ArtistProfileEditButton show={isSelfArtist ?? false} onClick={onClick} />
    </div>
  );
}
