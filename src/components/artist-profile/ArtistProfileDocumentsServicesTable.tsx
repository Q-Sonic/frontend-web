import { FiDownload, FiEdit2, FiLink2, FiList, FiTrash2 } from 'react-icons/fi';
import { NuveiPaymentButton } from '../NuveiPaymentButton';
import type { ArtistServiceRecord } from '../../types';


interface ArtistProfileDocumentsServicesTableProps {
  services: ArtistServiceRecord[];
  getDocumentUrl: (service: ArtistServiceRecord) => string | undefined;
  onMissingDocumentClick?: () => void;
  showPaymentColumn?: boolean;
  disableDownloadWhenMissing?: boolean;
  mode?: 'default' | 'contract-management';
  /** Shown when `mode` is `contract-management` and the list is empty. */
  managementEmptyMessage?: string;
  getDisplayName?: (service: ArtistServiceRecord) => string;
  onModifyDocument?: (service: ArtistServiceRecord) => void;
  onDeleteDocument?: (service: ArtistServiceRecord) => void;
  /** Clears a page-level notice (e.g. success toast) when the user uses the table. */
  onDismissBanner?: () => void;
  /** Contract-management: second column opens linked services (contract file id = row `id`). */
  onShowLinkedServices?: (service: ArtistServiceRecord) => void;
  /** Contract-management: column to associate this contract file with an existing service. */
  onLinkService?: (service: ArtistServiceRecord) => void;
  /** When true with `contract-management`, hides modify/delete columns (e.g. client catalog). */
  managementReadOnly?: boolean;
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return 'Precio a convenir';
  return `$${value.toLocaleString('en-US')}/hr`;
}

export function ArtistProfileDocumentsServicesTable({
  services,
  getDocumentUrl,
  onMissingDocumentClick,
  showPaymentColumn = true,
  disableDownloadWhenMissing = false,
  mode = 'default',
  managementEmptyMessage,
  getDisplayName,
  onModifyDocument,
  onDeleteDocument,
  onDismissBanner,
  onShowLinkedServices,
  onLinkService,
  managementReadOnly = false,
}: ArtistProfileDocumentsServicesTableProps) {
  const isContractManagementMode = mode === 'contract-management';

  const managementMinWidth =
    managementReadOnly && onShowLinkedServices
      ? 'min-w-[560px]'
      : onShowLinkedServices && onLinkService
        ? 'min-w-[920px]'
        : onShowLinkedServices || onLinkService
          ? 'min-w-[800px]'
          : 'min-w-[660px]';

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center">
        <p className="text-sm text-neutral-400">
          {isContractManagementMode
            ? managementEmptyMessage ??
              'Aún no hay contratos subidos. Pulsa «Agregar Contrato» para añadir el primero.'
            : 'Aun no hay servicios registrados para este artista.'}
        </p>
      </div>
    );
  }

  const clientMobileStack =
    isContractManagementMode && managementReadOnly && Boolean(onShowLinkedServices);

  const headCell =
    '[&>th]:px-2.5 [&>th]:py-2.5 [&>th]:text-left [&>th]:text-xs [&>th]:font-medium [&>th]:text-neutral-400 sm:[&>th]:px-4 sm:[&>th]:py-3 sm:[&>th]:text-sm';
  const bodyRow =
    '[&>td]:px-2.5 [&>td]:py-2.5 [&>td]:text-xs text-neutral-200 sm:[&>td]:px-4 sm:[&>td]:py-3 sm:[&>td]:text-sm';

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      {clientMobileStack ? (
        <div className="md:hidden divide-y divide-white/10">
          {services.map((service) => {
            const documentUrl = getDocumentUrl(service);
            const label = getDisplayName?.(service) ?? service.name;
            return (
              <div key={service.id} className="px-4 py-4">
                <p className="font-medium text-white text-sm leading-snug break-words">{label}</p>
                <div className="mt-4 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onDismissBanner?.();
                      onShowLinkedServices?.(service);
                    }}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-[#00d4c8]/40 px-4 py-2.5 text-sm font-medium text-[#00d4c8] transition-colors active:bg-[#00d4c8]/10 hover:border-[#00ece0] hover:text-[#00ece0]"
                  >
                    <FiList size={16} aria-hidden />
                    Ver servicios
                  </button>
                  {documentUrl ? (
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onDismissBanner?.()}
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#00d4c8]/15 px-4 py-2.5 text-sm font-semibold text-[#00ece0] ring-1 ring-[#00d4c8]/35 transition-colors active:bg-[#00d4c8]/25 hover:bg-[#00d4c8]/20"
                    >
                      <FiDownload size={16} aria-hidden />
                      Descargar PDF
                    </a>
                  ) : disableDownloadWhenMissing ? (
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="inline-flex min-h-[44px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-white/35"
                      title="Este contrato no está disponible para descarga"
                    >
                      <FiDownload size={16} aria-hidden />
                      Descargar PDF
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onDismissBanner?.();
                        onMissingDocumentClick?.();
                      }}
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-[#00d4c8]/40 px-4 py-2.5 text-sm font-medium text-[#00d4c8] transition-colors active:bg-[#00d4c8]/10 hover:border-[#00ece0] hover:text-[#00ece0]"
                    >
                      <FiDownload size={16} aria-hidden />
                      Descargar PDF
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className={clientMobileStack ? 'hidden md:block' : ''}>
      <div className="-mx-1 overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch] px-1 sm:mx-0 sm:px-0">
        <table className={`${isContractManagementMode ? managementMinWidth : 'min-w-[740px]'} w-full text-sm`}>
          <thead className="bg-white/[0.04] text-neutral-300">
            <tr className={headCell}>
              {isContractManagementMode ? (
                <>
                  <th>Nombre del contrato</th>
                  {onShowLinkedServices ? <th>Servicios vinculados</th> : null}
                  {onLinkService ? <th>Asociar a servicio</th> : null}
                  <th>Descargar</th>
                  {managementReadOnly ? null : (
                    <>
                      <th>Modificar</th>
                      <th className="w-[70px] text-center"> </th>
                    </>
                  )}
                </>
              ) : (
                <>
                  <th>Servicio</th>
                  <th>Condiciones clave del contrato</th>
                  <th>Monto</th>
                  <th>
                    <span className="inline-flex items-center gap-1.5">
                      PDF <span className="text-[10px] font-normal text-neutral-500">(descarga)</span>
                    </span>
                  </th>
                  {showPaymentColumn ? <th>Pago</th> : null}
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {services.map((service) => {
              const documentUrl = getDocumentUrl(service);
              return (
                <tr key={service.id} className={bodyRow}>
                  {isContractManagementMode ? (
                    <>
                      <td className="min-w-0 max-w-[min(14rem,42vw)] align-top font-medium text-white break-words md:max-w-none">
                        {getDisplayName?.(service) ?? service.name}
                      </td>
                      {onShowLinkedServices ? (
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              onDismissBanner?.();
                              onShowLinkedServices(service);
                            }}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#00d4c8]/40 px-2.5 py-1.5 text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0] sm:min-h-0 sm:gap-2 sm:px-3 sm:py-1"
                          >
                            <FiList size={14} aria-hidden />
                            Ver
                          </button>
                        </td>
                      ) : null}
                      {onLinkService ? (
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              onDismissBanner?.();
                              onLinkService(service);
                            }}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#00d4c8]/40 px-2.5 py-1.5 text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0] sm:min-h-0 sm:gap-2 sm:px-3 sm:py-1"
                          >
                            <FiLink2 size={14} aria-hidden />
                            Asociar
                          </button>
                        </td>
                      ) : null}
                      <td>
                        {documentUrl ? (
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onDismissBanner?.()}
                            className="inline-flex min-h-[40px] items-center gap-1.5 text-[#00d4c8] hover:text-[#00ece0] transition-colors sm:min-h-0 sm:gap-2"
                          >
                            <FiDownload size={14} aria-hidden />
                            Descargar
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onDismissBanner?.();
                              onMissingDocumentClick?.();
                            }}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#00d4c8]/40 px-2.5 py-1.5 text-[#00d4c8] hover:border-[#00ece0] hover:text-[#00ece0] transition-colors sm:min-h-0 sm:gap-2 sm:px-3 sm:py-1"
                          >
                            <FiDownload size={14} aria-hidden />
                            Descargar
                          </button>
                        )}
                      </td>
                      {managementReadOnly ? null : (
                        <>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                onDismissBanner?.();
                                onModifyDocument?.(service);
                              }}
                              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#00d4c8]/40 px-2.5 py-1.5 text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0] sm:min-h-0 sm:gap-2 sm:px-3 sm:py-1"
                            >
                              <FiEdit2 size={14} aria-hidden />
                              Modificar
                            </button>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => onDeleteDocument?.(service)}
                              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-red-500/35 p-2 text-red-300 transition-colors hover:border-red-400/60 hover:text-red-200 sm:min-h-0 sm:min-w-0"
                              aria-label={`Eliminar contrato ${service.name}`}
                              title="Eliminar contrato"
                            >
                              <FiTrash2 size={14} aria-hidden />
                            </button>
                          </td>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <td className="font-medium text-white">{service.name}</td>
                      <td className="text-neutral-300">{service.description || 'Sin descripción.'}</td>
                      <td className="whitespace-nowrap text-neutral-300">{formatPrice(service.price)}</td>
                      <td>
                        {documentUrl ? (
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onDismissBanner?.()}
                            className="inline-flex items-center gap-2 text-[#00d4c8] hover:text-[#00ece0] transition-colors"
                          >
                            <FiDownload size={14} aria-hidden />
                            Descargar
                          </a>
                        ) : disableDownloadWhenMissing ? (
                          <button
                            type="button"
                            disabled
                            aria-disabled="true"
                            className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-white/35"
                            title="Este servicio no tiene contrato disponible"
                          >
                            <FiDownload size={14} aria-hidden />
                            Descargar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onDismissBanner?.();
                              onMissingDocumentClick?.();
                            }}
                            className="inline-flex items-center gap-2 rounded-full border border-[#00d4c8]/40 px-3 py-1 text-[#00d4c8] hover:border-[#00ece0] hover:text-[#00ece0] transition-colors"
                          >
                            <FiDownload size={14} aria-hidden />
                            Descargar
                          </button>
                        )}
                      </td>
                      {showPaymentColumn ? (
                        <td>
                          <NuveiPaymentButton
                            amount={service.price || 1}
                            description={`Pago por servicio: ${service.name}`}
                            dev_reference={service.id || `order-${Date.now()}`}
                            className="!py-1 !px-3 !rounded-full !text-xs"
                          >
                            Pagar
                          </NuveiPaymentButton>
                        </td>
                      ) : null}
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
