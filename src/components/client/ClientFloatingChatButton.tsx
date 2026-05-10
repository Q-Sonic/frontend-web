import { useChat } from '../../contexts/ChatContext';

export function ClientFloatingChatButton() {
  const { setIsChatOpen } = useChat();

  const handleClick = () => {
    setIsChatOpen(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed z-30 flex h-14 w-14 cursor-pointer items-center justify-center transition-transform hover:scale-110 active:scale-95 bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] right-[max(1.5rem,env(safe-area-inset-right,0px))]"
      aria-label="Abrir chat"
    >
      <div className="relative w-full h-full flex items-center justify-center bg-accent rounded-full shadow-[0_0_20px_rgba(0,204,203,0.4)]">
         <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
         </svg>
      </div>
    </button>
  );
}
