import { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { getArtistProfileById } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { ArtistProfileNavProvider } from '../../contexts/ArtistProfileNavContext';
import { isBackendRoleArtista, isBackendRoleCliente } from '../../helpers/role';
import { SidebarLayout } from '../../layouts';
import { FiImage, FiFileText, FiUser } from 'react-icons/fi';

const SIDEBAR_ACTIVE_NAV = '#38BACC';

export function ArtistProfileLayout() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [intro, setIntro] = useState<string | undefined>(undefined);
  const [introLoading, setIntroLoading] = useState(false);

  const isOwnArtistProfile =
    !!id && !!user?.uid && user.uid === id && isBackendRoleArtista(user.role);

  const isClienteViewer = isBackendRoleCliente(user?.role);

  useEffect(() => {
    if (!id) {
      setIntro(undefined);
      setIntroLoading(false);
      return;
    }
    let cancelled = false;
    setIntroLoading(true);
    void getArtistProfileById(id)
      .then((p) => {
        if (!cancelled) setIntro(p?.biography?.trim() || '');
      })
      .catch(() => {
        if (!cancelled) setIntro('');
      })
      .finally(() => {
        if (!cancelled) setIntroLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const sidebar = useMemo(() => {
    if (!id) return null;
    const base = `/artist/${id}`;

    const ownerMenu = [
      {
        to: base,
        label: 'Perfil',
        icon: <FiUser className="text-current" aria-hidden />,
        exactPath: true as const,
      },
      {
        to: `${base}/gallery`,
        label: 'Galeria',
        icon: <FiImage className="text-current" aria-hidden />,
        exactPath: true as const,
      },
      {
        to: `${base}/documents`,
        label: 'Documentos',
        icon: <FiFileText className="text-current" aria-hidden />,
        exactPath: true as const,
      },
    ];

    const guestMenu = [
      {
        to: base,
        label: 'Perfil',
        icon: <FiUser className="text-current" aria-hidden />,
        exactPath: true as const,
      },
      {
        to: `${base}/gallery`,
        label: 'Galeria',
        icon: <FiImage className="text-current" aria-hidden />,
        exactPath: true as const,
      },
      {
        to: `${base}/documents`,
        label: 'Documentos',
        icon: <FiFileText className="text-current" aria-hidden />,
        exactPath: true as const,
      },
    ];

    let backHref: string | undefined;
    if (isOwnArtistProfile) backHref = '/artist';

    const menuItems = isOwnArtistProfile ? ownerMenu : guestMenu;

    return {
      sectionTitle: 'Información' as const,
      activeNavColor: SIDEBAR_ACTIVE_NAV,
      backHref,
      profileIntro: intro,
      profileIntroLoading: introLoading,
      onProfileIntroEdit: undefined,
      menuItems,
    };
  }, [id, intro, introLoading, isOwnArtistProfile]);

  if (!user?.uid) return <Navigate to="/login" replace />;
  if (isClienteViewer && id) {
    const suffix = location.pathname.slice(`/artist/${id}`.length) || '';
    return <Navigate to={`/client/artists/${id}${suffix}`} replace />;
  }
  if (!id) return <Navigate to="/artist" replace />;
  if (!sidebar) return null;

  return (
    <ArtistProfileNavProvider value={{ basePath: `/artist/${id}`, exitHomePath: '/artist' }}>
      <SidebarLayout sidebar={sidebar}>
        <Outlet />
      </SidebarLayout>
    </ArtistProfileNavProvider>
  );
}
