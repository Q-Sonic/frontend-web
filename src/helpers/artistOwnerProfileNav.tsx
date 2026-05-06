import { FiImage, FiFileText, FiUser } from 'react-icons/fi';
import type { SidebarMenuItem } from '../components/AppSidebar';

/** Sidebar nav for an artist viewing their own profile (`/artist/:id/...`). */
export function artistOwnerProfileNavItems(artistBasePath: string): SidebarMenuItem[] {
  return [
    {
      to: artistBasePath,
      label: 'Perfil',
      icon: <FiUser className="text-current" aria-hidden />,
      exactPath: true,
    },
    {
      to: `${artistBasePath}/gallery`,
      label: 'Galeria',
      icon: <FiImage className="text-current" aria-hidden />,
      exactPath: true,
      additionalActivePaths: [`${artistBasePath}/gallery/edit`],
    },
    {
      to: `${artistBasePath}/documents`,
      label: 'Documentos',
      icon: <FiFileText className="text-current" aria-hidden />,
      exactPath: true,
    },
  ];
}

export const ARTIST_PROFILE_SIDEBAR_ACTIVE_NAV = '#38BACC';
