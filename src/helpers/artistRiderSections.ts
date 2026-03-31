import type { ArtistProfile } from '../types/profile';
import type { ArtistServiceRecord } from '../types';
import type { ArtistRiderItem } from '../components/artist-profile';
import { technicalRiderPdfFromProfile } from './artistDocumentUrls';

export const RIDER_SECTION_IMAGES = [
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=987&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?q=80&w=987&auto=format&fit=crop',
] as const;

export const DEFAULT_RIDER_SECTIONS = [
  {
    id: 'show-en-vivo',
    title: 'Show en vivo',
    description: 'Requerimientos técnicos para conciertos estándar.',
    bulletItems: ['Batería', 'Voz principal', 'Bajo', 'Guitarra', 'Monitores de escena'],
  },
  {
    id: 'formato-acustico',
    title: 'Formato acústico',
    description: 'Setup reducido para eventos pequeños o privados.',
    bulletItems: ['Voz', 'Guitarra acústica', 'DI box', '2 monitores'],
  },
  {
    id: 'show-con-banda',
    title: 'Show con banda',
    description: 'Requerimientos completos para presentación con músicos.',
    bulletItems: ['Batería completa', 'Bajo', '2 guitarras', 'Teclados', '6 monitores'],
  },
] as const;

function toBulletItemsFromDescription(description: string | undefined): string[] {
  if (!description?.trim()) return ['Sin especificaciones técnicas por ahora.'];
  const segments = description
    .split(/[.,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return segments.slice(0, 4);
}

export function buildArtistRiderItems(
  services: ArtistServiceRecord[],
  profile: ArtistProfile | null,
): ArtistRiderItem[] {
  const riderPdfUrl = technicalRiderPdfFromProfile(profile);
  return DEFAULT_RIDER_SECTIONS.map((section, index) => {
    const matchingService = services.find((service) =>
      service.name.toLowerCase().includes(section.title.toLowerCase().split(' ')[0]),
    );
    return {
      id: section.id,
      title: section.title,
      description: matchingService?.description || section.description,
      bulletItems: matchingService
        ? toBulletItemsFromDescription(matchingService.description)
        : [...section.bulletItems],
      imageUrl: RIDER_SECTION_IMAGES[index % RIDER_SECTION_IMAGES.length],
      documentUrl: riderPdfUrl,
    };
  });
}
