import { useMemo } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { ArtistProfileNavProvider } from '../../contexts/ArtistProfileNavContext';
import { ARTIST_PROFILE_ACCENT } from '../../helpers/artistProfile';
import { SidebarLayout } from '../../layouts';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import { FiCalendar, FiCpu, FiFileText, FiImage, FiUser } from 'react-icons/fi';

const SIDEBAR_ACTIVE_NAV = '#38BACC';

export function ClientArtistProfileLayout() {
  const { id } = useParams<{ id: string }>();
  const { profile, artistDisplayName, loading } = useArtistProfileById(id);

  const sidebar = useMemo(() => {
    if (!id) return null;
    const base = `/client/artists/${id}`;
    const bio = profile?.biography?.trim() ?? '';

    const profileIntroRich = loading ? undefined : (
      <>
        <span className="font-semibold block mb-1.5" style={{ color: ARTIST_PROFILE_ACCENT }}>
          {artistDisplayName}
        </span>
        <span className="text-neutral-400">{bio || 'Sin descripción.'}</span>
      </>
    );

    const menuItems = [
      {
        to: base,
        label: 'Perfil del Artista',
        icon: <FiUser className="text-current" aria-hidden />,
        exactPath: true as const,
      },
      {
        to: `${base}/contracts`,
        label: 'Contratos',
        icon: <FiFileText className="text-current" aria-hidden />,
        exactPath: true as const,
      },
      {
        to: `${base}/rider`,
        label: 'Rider técnico',
        icon: <FiCpu className="text-current" aria-hidden />,
        exactPath: true as const,
      },
      {
        to: `${base}/gallery`,
        label: 'Galería',
        icon: <FiImage className="text-current" aria-hidden />,
        exactPath: true as const,
      },
      {
        to: `${base}/calendar`,
        label: 'Calendario',
        icon: <FiCalendar className="text-current" aria-hidden />,
        exactPath: true as const,
      },
    ];

    return {
      sectionTitle: 'Información' as const,
      activeNavColor: SIDEBAR_ACTIVE_NAV,
      backHref: '/client' as const,
      profileIntroRich,
      profileIntroLoading: loading,
      onProfileIntroEdit: undefined,
      menuItems,
    };
  }, [id, artistDisplayName, loading, profile?.biography]);

  if (!id) return <Navigate to="/client" replace />;
  if (!sidebar) return null;

  return (
    <ArtistProfileNavProvider value={{ basePath: `/client/artists/${id}`, exitHomePath: '/client' }}>
      <SidebarLayout sidebar={sidebar}>
        <Outlet />
      </SidebarLayout>
    </ArtistProfileNavProvider>
  );
}
