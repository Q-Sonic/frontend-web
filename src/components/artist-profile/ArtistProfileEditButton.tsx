import { FiEdit3 } from 'react-icons/fi';

export function ArtistProfileEditButton({ show, onClick }: { show: boolean; onClick?: () => void }) {
  if (!show) return null;
  return (
    <button
      onClick={onClick ?? undefined}
      className="text-white/80 hover:text-white transition p-2 rounded-xl hover:bg-white/5 cursor-pointer"
      aria-label="Editar sección"
    >
      <FiEdit3 size={20} />
    </button>
  );
}
