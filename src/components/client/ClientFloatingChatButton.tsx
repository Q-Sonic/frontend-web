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
      className="fixed bottom-6 right-6 z-30 flex items-center justify-center w-14 h-14 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
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
