import { ClientAreaHeader } from '../../components/client/ClientAreaHeader';
import { ClientFloatingChatButton } from '../../components/client/ClientFloatingChatButton';
import { ClientAreaPageShell } from '../../components/shared/ClientAreaPageShell';

export function ClientContractsPage() {
  return (
    <ClientAreaPageShell>
      <div>
        <ClientAreaHeader />
        <div className="max-w-lg rounded-2xl border border-white/10 bg-card/40 p-8 mt-6">
          <h1 className="text-xl font-bold text-white">Contratos</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Esta sección estará disponible próximamente. Los contratos por artista están en el perfil del artista bajo
            Contratos.
          </p>
        </div>
      </div>
      <ClientFloatingChatButton />
    </ClientAreaPageShell>
  );
}
