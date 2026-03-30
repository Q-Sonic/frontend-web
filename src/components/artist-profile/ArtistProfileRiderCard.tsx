import { FiDownload } from 'react-icons/fi';

interface ArtistProfileRiderCardProps {
  title: string;
  description: string;
  bulletItems: string[];
  imageUrl: string;
  documentUrl?: string;
  onMissingDocumentClick?: () => void;
}

export function ArtistProfileRiderCard({
  title,
  description,
  bulletItems,
  imageUrl,
  documentUrl,
  onMissingDocumentClick,
}: ArtistProfileRiderCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-[#00d4c8]/20 bg-white/[0.04] min-h-[300px] transition-all duration-300 hover:-translate-y-1 hover:border-[#00d4c8]/50 hover:shadow-[0_0_24px_rgba(0,212,200,0.35)]">
      <div
        className="absolute inset-0 opacity-45 transition-opacity duration-300 group-hover:opacity-60"
        style={{
          backgroundImage: `linear-gradient(160deg, rgba(255,255,255,0.12), rgba(0,0,0,0.85)), url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="relative flex h-full flex-col p-6">
        <h3 className="text-2xl font-semibold text-white leading-tight">{title}</h3>
        <p className="mt-3 text-sm text-white/75 leading-relaxed">{description}</p>

        {bulletItems.length > 0 && (
          <ul className="mt-5 space-y-1.5 text-sm text-white/80 list-disc list-inside">
            {bulletItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-6">
          {documentUrl ? (
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00d4c8] px-4 py-2 text-xs font-semibold text-[#0d1117] hover:bg-[#00ece0] transition-colors"
            >
              <FiDownload size={14} aria-hidden />
              Descargar PDF
            </a>
          ) : (
            <button
              type="button"
              onClick={onMissingDocumentClick}
              className="inline-flex items-center gap-2 rounded-full border border-[#00d4c8]/45 px-4 py-2 text-xs font-medium text-[#00d4c8] hover:border-[#00ece0] hover:text-[#00ece0] transition-colors"
            >
              <FiDownload size={14} aria-hidden />
              Descargar PDF
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
