import { FaWhatsapp } from 'react-icons/fa';
import { buildWhatsappUrl, SUPPORT_MESSAGES } from '../../config/whatsapp';

export function ClientFloatingChatButton() {
  return (
    <a
      href={buildWhatsappUrl(SUPPORT_MESSAGES.GENERAL)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-30 flex items-center justify-center w-14 h-14 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
      aria-label="Contactar por WhatsApp"
    >
      <div className="relative w-full h-full flex items-center justify-center bg-[#25D366] rounded-full shadow-[0_0_20px_rgba(37,211,102,0.4)]">
         <FaWhatsapp size={28} className="text-white" />
      </div>
    </a>
  );
}
