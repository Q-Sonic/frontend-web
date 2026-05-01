import { FiX } from 'react-icons/fi';

export type ArtistDocumentLinkedServicesModalProps = {
  isOpen: boolean;
  variant: 'contract' | 'rider';
  documentTitle: string;
  linkedServices: { id: string; name: string }[];
  onClose: () => void;
  /** Artist dashboard copy vs neutral client copy when the list is empty. */
  audience: 'artist' | 'client';
};

export function ArtistDocumentLinkedServicesModal({
  isOpen,
  variant,
  documentTitle,
  linkedServices,
  onClose,
  audience,
}: ArtistDocumentLinkedServicesModalProps) {
  if (!isOpen) return null;

  const titleTrim = documentTitle.trim();
  const isArtist = audience === 'artist';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="associations-modal-title"
        className="flex max-h-[min(calc(100dvh-1.5rem),900px)] w-full max-w-[min(calc(100vw-1.5rem),580px)] flex-col overflow-hidden rounded-t-2xl border border-[#00d4c8]/30 bg-[#111214] shadow-[0_0_35px_rgba(0,212,200,0.15)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 p-4 sm:p-6 sm:pb-4">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 pr-1 sm:pr-2">
              <h3
                id="associations-modal-title"
                className="text-base font-semibold tracking-tight text-white leading-snug sm:text-lg"
              >
                {variant === 'contract' ? (
                  <>
                    Servicios vinculados al contrato{' '}
                    <span className="break-words text-[#00d4c8]" title={titleTrim || 'Contrato'}>
                      {titleTrim || 'este contrato'}
                    </span>
                  </>
                ) : (
                  <>
                    Servicios vinculados al rider técnico{' '}
                    <span className="break-words text-[#00d4c8]" title={titleTrim || 'Rider técnico'}>
                      {titleTrim || 'este rider técnico'}
                    </span>
                  </>
                )}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full border border-white/20 p-2.5 text-white/70 transition hover:border-white/35 hover:bg-white/5 hover:text-white sm:p-2"
              aria-label="Cerrar"
            >
              <FiX size={17} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {linkedServices.length === 0 ? (
            <div className="space-y-3">
              <p className="m-0 text-sm text-neutral-300 leading-relaxed">
                {variant === 'contract' ? (
                  <>
                    Todavía <span className="text-white/90">ningún servicio</span> está vinculado a este contrato.
                  </>
                ) : (
                  <>
                    Todavía <span className="text-white/90">ningún servicio</span> está vinculado a este{' '}
                    <span className="whitespace-nowrap">rider técnico</span>.
                  </>
                )}
              </p>
              {isArtist ? (
                <p className="m-0 text-sm text-neutral-400 leading-relaxed">
                  {variant === 'contract' ? (
                    <>
                      Para enlazarlo en segundos, usa el botón <span className="text-[#00d4c8]">«Asociar»</span> en la
                      columna <span className="text-white/80">Asociar a servicio</span> de esta misma tabla de
                      contratos. También puedes hacerlo al editar un servicio desde la administración de servicios.
                    </>
                  ) : (
                    <>
                      Para enlazarlo en segundos, usa el botón <span className="text-[#00d4c8]">«Asociar»</span> en la
                      columna <span className="text-white/80">Asociar a servicio</span> de la tabla de riders. También
                      puedes hacerlo al editar un servicio desde la administración de servicios.
                    </>
                  )}
                </p>
              ) : (
                <p className="m-0 text-sm text-neutral-400 leading-relaxed">
                  El artista aún no ha asociado servicios públicos a este documento en la plataforma.
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-neutral-400 leading-relaxed">
                {variant === 'contract' ? (
                  linkedServices.length === 1 ? (
                    <>Un servicio usa este contrato:</>
                  ) : (
                    <>{linkedServices.length} servicios usan este contrato:</>
                  )
                ) : linkedServices.length === 1 ? (
                  <>Un servicio usa este rider técnico:</>
                ) : (
                  <>{linkedServices.length} servicios usan este rider técnico:</>
                )}
              </p>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {linkedServices.map((svc) => (
                  <li
                    key={svc.id}
                    className="rounded-lg px-3 py-2.5 text-sm text-white/90 bg-white/[0.04] break-words"
                  >
                    {svc.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-5 sm:pt-4">
          <div className="flex w-full justify-center sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] w-full max-w-sm rounded-full border border-white/25 px-4 py-2.5 text-sm text-white/80 transition hover:border-white/40 hover:text-white sm:min-h-0 sm:w-auto sm:max-w-none sm:py-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
