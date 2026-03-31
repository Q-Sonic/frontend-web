import type { DiscoverArtistCardDisplay } from '../../helpers/discoverArtistCard';
import { MOCK_AUDIO_PREVIEW_URL } from './artistCards';

/** Example cards for UI documentation (non-interactive list). */
export const discoverDisabledExampleCards: DiscoverArtistCardDisplay[] = [
  {
    id: '_example-1',
    name: 'Ejemplo desactivado',
    genreLine: 'Referencia de diseño',
    imageUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop&q=80',
    previewAudioUrl: MOCK_AUDIO_PREVIEW_URL,
    priceFromUsd: 199,
    availableToday: false,
    availableDateLabel: 'Próximamente',
  },
];
