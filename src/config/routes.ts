import { getProfileEditRoute } from '../helpers/role';

/** Clean dashboard path by role (no /home/artista). */
export function getDashboardPath(role: string | undefined): string {
  const r = getProfileEditRoute(role);
  switch (r) {
    case 'artista':
      return '/artist';
    case 'cliente':
      return '/client';
    case 'admin':
      return '/admin';
    case 'organizacion':
      return '/organization';
    default:
      return '/dashboard';
  }
}

/** Clean profile path by role (no /profile/artista). */
export function getProfilePath(role: string | undefined): string {
  const r = getProfileEditRoute(role);
  switch (r) {
    case 'artista':
      return '/artist/profile';
    case 'cliente':
      return '/client/profile';
    case 'admin':
      return '/admin/profile';
    case 'organizacion':
      return '/organization/profile';
    default:
      return '/profile';
  }
}

/** Clean profile edit path by role (artist uses public profile; no dedicated edit route). */
export function getProfileEditPath(role: string | undefined): string {
  const r = getProfileEditRoute(role);
  switch (r) {
    case 'artista':
      return '/artist/settings';
    case 'cliente':
      return '/client/profile/edit';
    case 'admin':
      return '/admin/profile/edit';
    case 'organizacion':
      return '/organization/profile/edit';
    default:
      return '/profile/edit';
  }
}
