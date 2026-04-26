export const SUPPORT_WHATSAPP_PHONE = '+593994176997';

function normalizeWhatsappPhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export function buildWhatsappUrl(message: string, phone = SUPPORT_WHATSAPP_PHONE): string {
  const normalizedPhone = normalizeWhatsappPhone(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
