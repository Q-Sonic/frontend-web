import { FiDownload, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { NuveiPaymentButton } from '../NuveiPaymentButton';
import type { ArtistServiceRecord } from '../../types';


interface ArtistProfileDocumentsServicesTableProps {
  services: ArtistServiceRecord[];
  getDocumentUrl: (service: ArtistServiceRecord) => string | undefined;
  onMissingDocumentClick?: () => void;
  showPaymentColumn?: boolean;
  disableDownloadWhenMissing?: boolean;
  mode?: 'default' | 'contract-management';
  getDisplayName?: (service: ArtistServiceRecord) => string;
  onModifyDocument?: (service: ArtistServiceRecord) => void;
  onDeleteDocument?: (service: ArtistServiceRecord) => void;
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
  getDisplayName,
  onModifyDocument,
  onDeleteDocument,
}: ArtistProfileDocumentsServicesTableProps) {
  const isContractManagementMode = mode === 'contract-management';

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center">
        <p className="text-sm text-neutral-400">Aun no hay servicios registrados para este artista.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className={`${isContractManagementMode ? 'min-w-[660px]' : 'min-w-[740px]'} w-full text-sm`}>
          <thead className="bg-white/[0.04] text-neutral-300">
            <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium [&>th]:text-neutral-400">
              {isContractManagementMode ? (
                <>
                  <th>Nombre del contrato</th>
                  <th>Descargar</th>
                  <th>Modificar</th>
                  <th className="w-[70px] text-center"> </th>
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
                <tr key={service.id} className="[&>td]:px-4 [&>td]:py-3 text-neutral-200">
                  {isContractManagementMode ? (
                    <>
                      <td className="font-medium text-white">{getDisplayName?.(service) ?? service.name}</td>
                      <td>
                        {documentUrl ? (
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[#00d4c8] hover:text-[#00ece0] transition-colors"
                          >
                            <FiDownload size={14} aria-hidden />
                            Descargar
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={onMissingDocumentClick}
                            className="inline-flex items-center gap-2 rounded-full border border-[#00d4c8]/40 px-3 py-1 text-[#00d4c8] hover:border-[#00ece0] hover:text-[#00ece0] transition-colors"
                          >
                            <FiDownload size={14} aria-hidden />
                            Descargar
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => onModifyDocument?.(service)}
                          className="inline-flex items-center gap-2 rounded-full border border-[#00d4c8]/40 px-3 py-1 text-[#00d4c8] transition-colors hover:border-[#00ece0] hover:text-[#00ece0]"
                        >
                          <FiEdit2 size={14} aria-hidden />
                          Modificar
                        </button>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteDocument?.(service)}
                          className="inline-flex items-center rounded-full border border-red-500/35 p-2 text-red-300 transition-colors hover:border-red-400/60 hover:text-red-200"
                          aria-label={`Eliminar PDF del contrato ${service.name}`}
                          title="Eliminar PDF"
                        >
                          <FiTrash2 size={14} aria-hidden />
                        </button>
                      </td>
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
                            title="Este servicio no tiene PDF disponible"
                          >
                            <FiDownload size={14} aria-hidden />
                            Descargar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={onMissingDocumentClick}
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
  );
}
