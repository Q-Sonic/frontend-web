import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  ArtistProfileDocumentsServicesTable,
  ArtistProfileRidersGrid,
  Skeleton,
  type ArtistRiderItem,
} from '../../components';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import { useAuth } from '../../contexts/AuthContext';
import { contractPdfUrlForService, technicalRiderPdfFromProfile } from '../../helpers/artistDocumentUrls';
import { isBackendRoleArtista } from '../../helpers/role';
import type { ArtistServiceRecord } from '../../types';

const RIDER_IMAGES = [
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=987&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?q=80&w=987&auto=format&fit=crop',
];

const DEFAULT_RIDER_SECTIONS = [
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
];

function toBulletItems(description: string | undefined): string[] {
  if (!description?.trim()) return ['Sin especificaciones técnicas por ahora.'];
  const segments = description
    .split(/[.,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return segments.slice(0, 4);
}

export function ArtistProfileDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { profile, services, loading, error } = useArtistProfileById(id);
  const [infoBanner, setInfoBanner] = useState('');
  const isSelfArtist = !!user?.uid && isBackendRoleArtista(user.role) && user.uid === id;

  const riderPdfUrl = technicalRiderPdfFromProfile(profile);
  const getDocumentUrl = (service: ArtistServiceRecord) => contractPdfUrlForService(service, profile);
  const handleMissingDocumentClick = () => {
    setInfoBanner('Este artista aun no tiene un PDF cargado. Lo activaremos cuando backend reciba el archivo.');
  };

  const riderItems: ArtistRiderItem[] = useMemo(() => {
    return DEFAULT_RIDER_SECTIONS.map((section, index) => {
      const matchingService = services.find((service) =>
        service.name.toLowerCase().includes(section.title.toLowerCase().split(' ')[0]),
      );
      return {
        id: section.id,
        title: section.title,
        description: matchingService?.description || section.description,
        bulletItems: matchingService ? toBulletItems(matchingService.description) : section.bulletItems,
        imageUrl: RIDER_IMAGES[index % RIDER_IMAGES.length],
        documentUrl: riderPdfUrl,
      };
    });
  }, [riderPdfUrl, services]);

  if (!id) return <Navigate to="/artist" replace />;

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto space-y-8 px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-12">
        <div className="space-y-2">
          <Skeleton className="h-8 w-80 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-2xl rounded" />
        </div>
        <Skeleton className="h-56 rounded-2xl" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-12">
        <p className="text-red-400 text-sm leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-9 px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-12">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Listado de contratos por servicio
        </h1>
        <p className="text-sm text-white/60 max-w-3xl leading-relaxed">
          Consulta las condiciones clave de cada servicio y descarga el documento técnico del artista.
          {isSelfArtist ? ' Puedes revisar estos archivos tal como los ven tus clientes.' : ''}
        </p>
      </header>

      <section className="space-y-4">
        <ArtistProfileDocumentsServicesTable
          services={services}
          getDocumentUrl={getDocumentUrl}
          onMissingDocumentClick={handleMissingDocumentClick}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white tracking-tight">Riders Técnicos disponibles</h2>
        {infoBanner && (
          <p className="text-xs text-[#00d4c8] bg-[#00d4c8]/10 border border-[#00d4c8]/30 rounded-lg px-3 py-2">
            {infoBanner}
          </p>
        )}
        <ArtistProfileRidersGrid items={riderItems} onMissingDocumentClick={handleMissingDocumentClick} />
      </section>
    </div>
  );
}
