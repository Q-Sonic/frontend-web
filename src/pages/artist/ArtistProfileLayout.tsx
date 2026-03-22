import { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { getArtistProfileById } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { isBackendRoleArtista } from '../../helpers/role';
import { SidebarLayout } from '../../layouts';
import { FiUser, FiImage, FiFileText } from 'react-icons/fi';

const SIDEBAR_ACTIVE_NAV = '#38BACC';

export function ArtistProfileLayout() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [intro, setIntro] = useState<string | undefined>(undefined);
  const [introLoading, setIntroLoading] = useState(false);

  const isOwnArtistProfile =
    !!id && !!user?.uid && user.uid === id && isBackendRoleArtista(user.role);

  useEffect(() => {
    if (!isOwnArtistProfile || !id) {
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
  }, [id, isOwnArtistProfile]);

  const sidebar = useMemo(() => {
    if (!id) return null;
    const base = `/artist/${id}`;
    return {
      sectionTitle: 'Información' as const,
      activeNavColor: SIDEBAR_ACTIVE_NAV,
      backHref: isOwnArtistProfile ? '/artist' : undefined,
      profileIntro: isOwnArtistProfile ? intro : undefined,
      profileIntroLoading: isOwnArtistProfile ? introLoading : false,
      onProfileIntroEdit: isOwnArtistProfile ? () => {} : undefined,
      menuItems: [
        {
          to: base,
          label: 'Perfil',
          icon: <FiUser className="text-current" aria-hidden />,
          exactPath: true,
        },
        {
          to: `${base}/gallery`,
          label: 'Galeria',
          icon: <FiImage className="text-current" aria-hidden />,
        },
        {
          to: `${base}/documents`,
          label: 'Documentos',
          icon: <FiFileText className="text-current" aria-hidden />,
        },
      ],
    };
  }, [id, isOwnArtistProfile, intro, introLoading]);

  if (!user?.uid) return <Navigate to="/login" replace />;
  if (!id) return <Navigate to="/artist" replace />;
  if (!sidebar) return null;

  return (
    <SidebarLayout sidebar={sidebar}>
      <Outlet />
    </SidebarLayout>
  );
}
