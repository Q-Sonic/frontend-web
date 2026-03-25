import { ApiError } from '../api/client';

const DUPLICATE_EMAIL_SPANISH = 'Este correo ya pertenece a una cuenta existente.';

function isLikelyNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  const msg = err instanceof Error ? err.message : '';
  return /failed to fetch|networkerror|load failed/i.test(msg);
}

export function loginErrorMessage(err: unknown): string {
  if (isLikelyNetworkError(err)) {
    return 'No se pudo conectar con el servidor. Comprueba que el backend esté en marcha y que VITE_API_BASE_URL en .env apunte a la API (p. ej. http://localhost:3000/api).';
  }
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      return 'Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.';
    }
    return err.message || 'No se pudo iniciar sesión.';
  }
  return 'Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.';
}

export function registerErrorMessage(err: unknown): string {
  if (isLikelyNetworkError(err)) {
    return 'No se pudo conectar con el servidor. Comprueba que el backend esté en marcha y que VITE_API_BASE_URL en .env sea correcta.';
  }
  const message = err instanceof Error ? err.message : String(err ?? '');
  if (err instanceof ApiError && /already in use/i.test(err.message)) return DUPLICATE_EMAIL_SPANISH;
  if (/already in use/i.test(message)) return DUPLICATE_EMAIL_SPANISH;
  if (err instanceof ApiError) {
    return err.message || 'No se pudo completar el registro. Inténtalo nuevamente.';
  }
  return message || 'No se pudo completar el registro. Inténtalo nuevamente.';
}
