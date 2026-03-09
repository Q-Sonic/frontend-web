import { Topbar, UserMenu } from '../../components';

export function HomeClientePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Topbar appName="App" right={<UserMenu />} />
      <main className="p-4">
        <h1 className="text-xl font-semibold text-neutral-900">Inicio (Cliente)</h1>
        <p className="mt-2 text-neutral-600">Bienvenido a tu espacio de cliente.</p>
      </main>
    </div>
  );
}
