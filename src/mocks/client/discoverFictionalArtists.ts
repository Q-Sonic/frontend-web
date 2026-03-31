import type { DiscoverArtistCardDisplay } from '../../helpers/discoverArtistCard';
import { MOCK_AUDIO_PREVIEW_URL } from './artistCards';

/**
 * Placeholder artists for the discovery grid while the API returns few rows.
 * `profileDisabled` keeps “Ver Perfil” inactive (no real profile id).
 */
export const discoverFictionalArtists: DiscoverArtistCardDisplay[] = [
  {
    id: '_fictional-luna-mora',
    name: 'Sofía Rivera',
    genreLine: 'Pop · Acústico',
    imageUrl:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=700&h=500&fit=crop&q=82',
    previewAudioUrl: MOCK_AUDIO_PREVIEW_URL,
    priceFromUsd: 145,
    availableToday: true,
    profileDisabled: true,
  },
  {
    id: '_fictional-mateo-vega',
    name: 'Carlos Mendoza',
    genreLine: 'Salsa · Urbano',
    imageUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&h=500&fit=crop&q=82',
    previewAudioUrl: MOCK_AUDIO_PREVIEW_URL,
    priceFromUsd: 190,
    availableToday: false,
    availableDateLabel: 'Disponible 24 de Junio',
    profileDisabled: true,
  },
];
