/** Normalized route segment for home/profile/edit paths. Used in URLs. */
export type ProfileEditRoute =
  | 'cliente'
  | 'artista'
  | 'admin'
  | 'organizacion'
  | 'soporte'
  | 'basico';

/** Canonical role values (Spanish / backend convention). */
export type CanonicalRole =
  | 'cliente'
  | 'artista'
  | 'admin'
  | 'organizacion'
  | 'soporte'
  | string;

function normalizeRoleLower(role: string | undefined): string {
  return (role ?? '').toLowerCase().trim();
}

/**
 * Maps any backend/frontend role variant to the route segment used in URLs.
 * client/cliente -> cliente, artist/artista -> artista, etc.
 * Unknown roles fall back to 'basico'.
 */
export function getProfileEditRoute(role: string | undefined): ProfileEditRoute {
  const r = normalizeRoleLower(role);
  if (r === 'client' || r === 'cliente') return 'cliente';
  if (r === 'artist' || r === 'artista') return 'artista';
  if (r === 'admin') return 'admin';
  if (r === 'organization' || r === 'organizacion') return 'organizacion';
  if (r === 'soporte') return 'soporte';
  return 'basico';
}

/**
 * Returns the canonical role string for storage and display.
 * Use this when persisting role (e.g. localStorage) or when comparing roles.
 */
export function normalizeRole(role: string | undefined): string {
  const r = normalizeRoleLower(role);
  if (r === 'client' || r === 'cliente') return 'cliente';
  if (r === 'artist' || r === 'artista') return 'artista';
  if (r === 'admin') return 'admin';
  if (r === 'organization' || r === 'organizacion') return 'organizacion';
  if (r === 'soporte') return 'soporte';
  return role?.trim() ?? '';
}

/** True when the user should use client profile/edit flows (client or cliente). */
export function isBackendRoleCliente(role: string | undefined): boolean {
  return getProfileEditRoute(role) === 'cliente';
}

/** True when the user should use artist profile/edit flows (artist or artista). */
export function isBackendRoleArtista(role: string | undefined): boolean {
  return getProfileEditRoute(role) === 'artista';
}

/** True when the user has admin role (for admin-only features). */
export function isBackendRoleAdmin(role: string | undefined): boolean {
  return getProfileEditRoute(role) === 'admin';
}

/** True when the user has organization role. */
export function isBackendRoleOrganizacion(role: string | undefined): boolean {
  return getProfileEditRoute(role) === 'organizacion';
}

/** All valid role routes for the application. */
export const ROLE_ROUTES: ProfileEditRoute[] = ['cliente', 'artista', 'admin', 'organizacion', 'basico'];
