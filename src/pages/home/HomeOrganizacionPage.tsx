import { Link } from 'react-router-dom';
import { Card, Button, UserMenu } from '../../components';

const actions = [
  { label: 'Buscar artistas', to: '/organization', variant: 'primary' as const },
  { label: 'Mis eventos', to: '/organization', variant: 'secondary' as const },
  { label: 'Contratos y pagos', to: '/organization', variant: 'secondary' as const },
];

export function HomeOrganizacionPage() {
  const gradientBtn = 'bg-gradient-to-r from-violet-500 to-blue-600 text-white hover:opacity-90 border-0';

  return (
    <div className="max-w-md mx-auto px-4 py-8 w-full">
      <div className="flex justify-end mb-4">
        <UserMenu />
      </div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-white">Inicio (Organización)</h1>
        <p className="mt-2 text-neutral-400">Gestiona eventos, contratos y pagos con artistas.</p>
      </section>

      <section>
        <Card title="Accesos rápidos" variant="dark">
          <div className="space-y-3">
            {actions.map((a) => (
              <Link key={a.label} to={a.to} className="block">
                <Button
                  variant={a.variant}
                  fullWidth
                  className={a.variant === 'primary' ? gradientBtn : ''}
                >
                  {a.label}
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
