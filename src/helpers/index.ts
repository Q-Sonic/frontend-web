export { loginErrorMessage, registerErrorMessage } from './authErrors';
export { getProfileEditRoute, normalizeRole, isBackendRoleCliente, isBackendRoleArtista, isBackendRoleAdmin } from './role';
export type { ProfileEditRoute, CanonicalRole } from './role';
export { sanitizeOptionalString, getRequiredError, getUrlError, getPhoneDigitsError, getCountryCodeRequiredError } from './validation';
export { MEDIA_TYPE_OPTIONS, MAX_IMAGE_BYTES, MAX_AUDIO_BYTES, MAX_VIDEO_BYTES } from './mediaLimits';
export type { MediaTypeOption } from './mediaLimits';
export { getArtistMediaKey, getStoredArtistMedia, setStoredArtistMedia, appendStoredArtistMedia, removeStoredArtistMediaByUrl } from './artistMediaStorage';
