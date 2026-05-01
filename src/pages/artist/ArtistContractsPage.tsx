import { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiFileText, FiXCircle } from 'react-icons/fi';
import type { ContractRecord } from '../../types/contract';
import {
  artistAcceptContract,
  artistRejectContract,
  fetchArtistContractHistory,
  dispatchContractsApiRefresh,
} from '../../api/contractService';
import { ClientContractSigningModal } from '../../components/client/ClientContractSigningModal';

function isPendingArtistSignature(c: ContractRecord): boolean {
  return c.status === 'PENDING_ARTIST_SIGNATURE' || c.status === 'PENDING';
}

export function ArtistContractsPage() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState<ContractRecord | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchArtistContractHistory();
      setContracts(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar contratos.');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const pending = useMemo(() => contracts.filter(isPendingArtistSignature), [contracts]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-8">
        <h1 className="text-3xl font-bold text-white">Contratos</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Revisa y firma tus contratos pendientes. Si el pago está pendiente, no podrás firmar.
        </p>

        {error ? <div className="mt-5 rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-red-300">{error}</div> : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          Pendientes de firma: <span className="font-bold text-[#00d4c8]">{pending.length}</span>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="text-neutral-500">Cargando contratos...</div>
          ) : pending.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-neutral-400">
              No tienes contratos pendientes de firma.
            </div>
          ) : (
            pending.map((c) => {
              const unpaid = c.financials?.paymentStatus === 'UNPAID';
              return (
                <article key={c.id} className="rounded-2xl border border-white/10 bg-[#121820] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-400">Contrato ID: {c.id}</p>
                      <h2 className="text-lg font-semibold text-white">{c.eventDetails?.name || 'Evento'}</h2>
                      <p className="text-sm text-neutral-400">{c.eventDetails?.location || 'Ubicación por definir'}</p>
                      <p className="text-sm text-neutral-400">
                        Pago: <span className={unpaid ? 'text-amber-300' : 'text-emerald-300'}>{c.financials?.paymentStatus || 'UNPAID'}</span>
                      </p>
                      {unpaid ? (
                        <p className="text-xs font-semibold text-amber-300">
                          El cliente debe pagar para habilitar la firma del artista.
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {c.sourceContractUrl ? (
                        <a
                          href={c.sourceContractUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
                        >
                          <FiFileText /> Ver términos base
                        </a>
                      ) : null}
                      {c.contractUrl ? (
                        <a
                          href={c.contractUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
                        >
                          <FiFileText /> Contrato firmado
                        </a>
                      ) : null}
                      <button
                        type="button"
                        disabled={saving || unpaid}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#00d4c8] px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                        onClick={() => {
                          setActive(c);
                          setSignOpen(true);
                        }}
                      >
                        <FiCheckCircle /> Firmar y aceptar
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-200"
                        onClick={async () => {
                          setSaving(true);
                          try {
                            await artistRejectContract(c.id, 'Rechazado por artista');
                            dispatchContractsApiRefresh();
                            await load();
                          } finally {
                            setSaving(false);
                          }
                        }}
                      >
                        <FiXCircle /> Rechazar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <ClientContractSigningModal
          isOpen={signOpen}
          onClose={() => {
            if (!saving) setSignOpen(false);
          }}
          artistParty={{ roleLabel: 'Artista', name: 'Tu firma', signed: false, initials: 'AR' }}
          clientParty={{ roleLabel: 'Cliente', name: active?.artistDisplayName || 'Cliente', signed: true, initials: 'CL' }}
          summary={{
            event: active?.eventDetails?.name || 'Evento',
            dateLabel: 'Fecha según contrato',
            location: active?.eventDetails?.location || 'Por definir',
            totalValue: `$${Math.round(Number(active?.financials?.totalAmount || 0))}`,
            duration: 'Según contrato',
            service: active?.eventDetails?.name || 'Servicio',
          }}
          onSign={async ({ dataUrl, acceptedTerms }) => {
            if (!active) return;
            setSaving(true);
            try {
              await artistAcceptContract(active.id, { artistSignatureDataUrl: dataUrl, acceptedTerms });
              setSignOpen(false);
              dispatchContractsApiRefresh();
              await load();
            } finally {
              setSaving(false);
            }
          }}
        />
    </div>
  );
}
