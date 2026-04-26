export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  /** App name used in Topbar and branding across the app. */
  APP_NAME: 'Stage Go',
  APP_TAGLINE: 'Prime',
  SOCIAL_LINKS: {
    FACEBOOK: 'https://www.facebook.com/share/186U37Mkek',
    INSTAGRAM: 'https://www.instagram.com/stage_go_latam?igsh=ZXh4MWtrNmM0dXZ3',
    TIKTOK: 'https://www.tiktok.com/@stagego_latam?_r=1&_t=ZS-95n7jNGoBdP',
  },
} as const;
