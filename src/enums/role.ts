/** Role values used in routes and profile flows. */
export const Role = {
  CLIENTE: 'cliente',
  ARTISTA: 'artista',
  ADMIN: 'admin',
  ORGANIZACION: 'organizacion',
  SOPORTE: 'soporte',
  BASICO: 'basico',
} as const;

export type RoleValue = (typeof Role)[keyof typeof Role];
