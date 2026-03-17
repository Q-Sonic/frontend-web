const REQUIRED_MSG = 'Este campo es obligatorio';
const INVALID_URL_MSG = 'Introduce una URL válida';
const PHONE_DIGITS_MSG = 'El teléfono solo puede contener dígitos';
const COUNTRY_CODE_REQUIRED_MSG = 'Si indicas teléfono, selecciona el código de país';

const PLACEHOLDER_STRING = 'string';

/**
 * Treats null, undefined, empty string, or the literal "string" (API placeholder) as missing.
 * Returns trimmed value or empty string for form/display handling.
 */
export function sanitizeOptionalString(value: string | null | undefined): string {
  if (value == null) return '';
  const s = String(value).trim();
  if (s === '' || s.toLowerCase() === PLACEHOLDER_STRING) return '';
  return s;
}

export function getRequiredError(value: string | undefined, trim = true): string | undefined {
  const s = trim ? (value ?? '').trim() : (value ?? '');
  return s ? undefined : REQUIRED_MSG;
}

export function getUrlError(value: string | undefined): string | undefined {
  if (!value || !value.trim()) return undefined;
  try {
    new URL(value.trim());
    return undefined;
  } catch {
    return INVALID_URL_MSG;
  }
}

export function getPhoneDigitsError(value: string): string | undefined {
  if (!value) return undefined;
  if (/^\d+$/.test(value.replace(/\s/g, ''))) return undefined;
  return PHONE_DIGITS_MSG;
}

export function getCountryCodeRequiredError(phone: string, countryCode: string): string | undefined {
  if (!phone.trim()) return undefined;
  return countryCode.trim() ? undefined : COUNTRY_CODE_REQUIRED_MSG;
}
