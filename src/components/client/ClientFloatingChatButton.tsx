import { FiMessageCircle } from 'react-icons/fi';

export function ClientFloatingChatButton() {
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-accent text-white shadow-[0_0_20px_rgba(0,204,203,0.45)] hover:bg-accent/90 transition-colors"
      aria-label="Abrir chat"
    >
      <FiMessageCircle size={26} strokeWidth={1.75} />
    </button>
  );
}
