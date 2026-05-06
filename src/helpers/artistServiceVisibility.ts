import type { ArtistServiceRecord } from '../types';

function hasLinkedFileId(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function artistServiceHasContractLinked(service: ArtistServiceRecord | null | undefined): boolean {
  if (!service) return false;
  return hasLinkedFileId(service.contractTemplateId ?? service.contractId);
}

export function artistServiceHasTechnicalRiderLinked(service: ArtistServiceRecord | null | undefined): boolean {
  if (!service) return false;
  return hasLinkedFileId(service.technicalRiderTemplateId ?? service.technicalRiderId);
}

/** True when the service has both a contract and a technical rider file linked (public / booking ready). */
export function isArtistServiceBookable(service: ArtistServiceRecord | null | undefined): boolean {
  if (!service?.id) return false;
  return artistServiceHasContractLinked(service) && artistServiceHasTechnicalRiderLinked(service);
}

/** Short explanation for the artist when the service is still a draft. */
export function artistServiceDraftVisibilityHint(service: ArtistServiceRecord): string {
  const c = artistServiceHasContractLinked(service);
  const r = artistServiceHasTechnicalRiderLinked(service);
  if (!c && !r) {
    return 'Los clientes no verán este servicio hasta que vincules un contrato y un rider técnico (desde Documentos o editando el servicio).';
  }
  if (!c) {
    return 'Ya tienes rider técnico. Falta vincular un contrato para publicar el servicio.';
  }
  return 'Ya tienes contrato. Falta vincular un rider técnico para publicar el servicio.';
}

/** Label for the primary action on a draft card. */
export function artistServiceDraftCtaLabel(service: ArtistServiceRecord): string {
  const c = artistServiceHasContractLinked(service);
  const r = artistServiceHasTechnicalRiderLinked(service);
  if (!c && !r) return 'Ir a Documentos';
  if (!c) return 'Vincular contrato';
  return 'Vincular rider técnico';
}
