export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  /** App name used in Topbar and branding across the app. */
  APP_NAME: 'Stage Go',
  APP_TAGLINE: 'Prime',
} as const;
