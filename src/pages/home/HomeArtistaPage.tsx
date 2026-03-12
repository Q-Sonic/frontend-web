import { Link } from 'react-router-dom';
import { Topbar, UserMenu, Card } from '../../components';

const gradientBtn = 'bg-gradient-to-r from-violet-500 to-blue-600 text-white hover:opacity-90';

export function HomeArtistaPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Topbar variant="dark" right={<UserMenu />} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <section className="mb-8">
          <h1 className="text-2xl font-bold text-white">Inicio (Artista)</h1>
          <p className="text-neutral-400 mt-1">Resumen de tu actividad.</p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card variant="dark" className="text-center py-6">
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-neutral-400 text-sm mt-1">Vistas de perfil</p>
          </Card>
          <Card variant="dark" className="text-center py-6">
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-neutral-400 text-sm mt-1">Contratos</p>
          </Card>
          <Card variant="dark" className="text-center py-6">
            <p className="text-3xl font-bold text-white">$0</p>
            <p className="text-neutral-400 text-sm mt-1">Ganancias</p>
          </Card>
        </section>

        <Card variant="dark" title="Accesos rápidos">
          <div className="flex flex-wrap gap-3">
            <Link to="/artist/services" className={`${gradientBtn} rounded-lg px-4 py-2 text-sm font-medium`}>
              Servicios y precios
            </Link>
            <Link to="/artist/media" className="rounded-lg px-4 py-2 text-sm font-medium border border-neutral-600 text-neutral-300 hover:bg-neutral-800">
              Subir multimedia
            </Link>
            <Link to="/profile/edit/artista" className="rounded-lg px-4 py-2 text-sm font-medium border border-neutral-600 text-neutral-300 hover:bg-neutral-800">
              Editar perfil
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
