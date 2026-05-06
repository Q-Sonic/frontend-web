/** Document types collected at registration (Spanish UI labels). */
export type IdentityDocumentType = 'cedula' | 'ruc' | 'pasaporte';

export const IDENTITY_DOCUMENT_OPTIONS: readonly { value: IdentityDocumentType; label: string }[] = [
  { value: 'cedula', label: 'Cédula' },
  { value: 'ruc', label: 'RUC' },
  { value: 'pasaporte', label: 'Pasaporte' },
];

export function identityDocumentLabel(type: IdentityDocumentType): string {
  return IDENTITY_DOCUMENT_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

/** Ecuador cédula check digit (10 digits). */
export function isValidEcuadorCedula(digits: string): boolean {
  if (!/^\d{10}$/.test(digits)) return false;
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let val = parseInt(digits.charAt(i), 10) * coef[i];
    if (val >= 10) val -= 9;
    sum += val;
  }
  const check = sum % 10 === 0 ? 0 : 10 - (sum % 10);
  return check === parseInt(digits.charAt(9), 10);
}

export function normalizeIdentityNumber(type: IdentityDocumentType, raw: string): string {
  const t = raw.trim();
  if (type === 'pasaporte') return t.toUpperCase().replace(/\s+/g, '');
  return t.replace(/\D/g, '');
}

export function getIdentityInputHint(type: IdentityDocumentType): string {
  switch (type) {
    case 'cedula':
      return 'Ingresa 10 dígitos';
    case 'ruc':
      return 'Ingresa 13 dígitos';
    case 'pasaporte':
      return 'Entre 6 y 20 caracteres alfanuméricos';
    default:
      return '';
  }
}

export function getIdentityPlaceholder(type: IdentityDocumentType): string {
  switch (type) {
    case 'cedula':
      return '1710034063';
    case 'ruc':
      return '1710034063001';
    case 'pasaporte':
      return 'AB1234567';
    default:
      return '';
  }
}

export function getIdentityNumberError(
  type: IdentityDocumentType,
  normalized: string
): string | undefined {
  if (!normalized) return 'Este campo es obligatorio';

  if (type === 'cedula') {
    if (normalized.length !== 10) return 'La cédula debe tener 10 dígitos';
    if (!isValidEcuadorCedula(normalized)) return 'Cédula no válida (revisa el dígito verificador)';
    return undefined;
  }

  if (type === 'ruc') {
    if (normalized.length !== 13) return 'El RUC debe tener 13 dígitos';
    if (normalized.endsWith('001') && !isValidEcuadorCedula(normalized.slice(0, 10))) {
      return 'Los primeros 10 dígitos no coinciden con una cédula válida';
    }
    return undefined;
  }

  if (type === 'pasaporte') {
    if (normalized.length < 6 || normalized.length > 20) {
      return 'El pasaporte debe tener entre 6 y 20 caracteres';
    }
    if (!/^[A-Z0-9]+$/.test(normalized)) {
      return 'Solo letras y números (sin espacios)';
    }
    return undefined;
  }

  return undefined;
}
