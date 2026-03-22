import { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { getArtistProfileById } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { isBackendRoleArtista, isBackendRoleCliente } from '../../helpers/role';
import { SidebarLayout } from '../../layouts';
import { FiCalendar, FiImage, FiFileText, FiUser } from 'react-icons/fi';

const SIDEBAR_ACTIVE_NAV = '#38BACC';

export function ArtistProfileLayout() {
  const { id } = useParams<{ id: string }>();
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

    /** Cliente logueado: navegación completa al ver un artista. */
    const clientVisitorMenu = [
      {
        to: base,
        label: 'Perfil',
        icon: <FiUser className="text-current" aria-hidden />,
        exactPath: true as const,
      },
      {
        to: `${base}/documents`,
        label: 'Documentos',
        icon: <FiFileText className="text-current" aria-hidden />,
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

    /** Otro rol visitando un perfil ajeno (mismo orden que el panel del artista, sin calendario embebido). */
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
    else if (isClienteViewer) backHref = '/client';

    let menuItems;
    if (isOwnArtistProfile) menuItems = ownerMenu;
    else if (isClienteViewer) menuItems = clientVisitorMenu;
    else menuItems = guestMenu;

    return {
      sectionTitle: 'Información' as const,
      activeNavColor: SIDEBAR_ACTIVE_NAV,
      backHref,
      profileIntro: intro,
      profileIntroLoading: introLoading,
      onProfileIntroEdit: undefined,
      menuItems,
    };
  }, [id, intro, introLoading, isOwnArtistProfile, isClienteViewer]);

  if (!user?.uid) return <Navigate to="/login" replace />;
  if (!id) return <Navigate to="/artist" replace />;
  if (!sidebar) return null;

  return (
    <SidebarLayout sidebar={sidebar}>
      <Outlet />
    </SidebarLayout>
  );
}
