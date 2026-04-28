export const SUPPORT_WHATSAPP_PHONE = '5491122334455'; // Centralized support number

function normalizeWhatsappPhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export function buildWhatsappUrl(message: string, phone = SUPPORT_WHATSAPP_PHONE): string {
  const normalizedPhone = normalizeWhatsappPhone(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export const SUPPORT_MESSAGES = {
  GENERAL: 'Hola, me gustaría saber más sobre Stage Go.',
  PRIME: 'Hola, soy usuario Prime y necesito soporte.',
  ARTIST: 'Hola, soy artista y necesito ayuda con mi perfil.',
};

export function getDynamicSupportMessage(user: { displayName?: string; role?: string } | null): string {
  if (!user) return SUPPORT_MESSAGES.GENERAL;
  const name = user.displayName || 'Usuario';
  if (user.role === 'artista' || user.role === 'ARTISTA') {
    return `Hola, soy el artista ${name} y necesito soporte.`;
  }
  return `Hola, soy el cliente ${name} y necesito soporte.`;
}
