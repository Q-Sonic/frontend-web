import { Topbar, UserMenu } from '../../components';

export function HomeArtistaPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Topbar appName="App" right={<UserMenu />} />
      <main className="p-4">
        <h1 className="text-xl font-semibold text-neutral-900">Inicio (Artista)</h1>
        <p className="mt-2 text-neutral-600">Bienvenido a tu espacio de artista.</p>
      </main>
    </div>
  );
}
