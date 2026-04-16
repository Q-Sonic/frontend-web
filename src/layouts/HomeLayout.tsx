import { Link } from 'react-router-dom';
import { UserMenu } from '../components/UserMenu';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export interface HomeAction {
  label: string;
  to: string;
  variant?: 'primary' | 'secondary';
}

export type HomeRole = 'cliente' | 'artista' | 'admin' | 'organizacion' | 'basico';

interface HomeLayoutProps {
  title: string;
  subtitle: string;
  actions: HomeAction[];
  /** Optional accent for role (border/icon tint); uses violet by default */
  role?: HomeRole;
}

const gradientBtn = 'bg-gradient-to-r from-violet-500 to-blue-600 text-white hover:opacity-90 border-0';

export function HomeLayout({ title, subtitle, actions }: HomeLayoutProps) {
  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100">
      <div className="absolute right-4 top-4 z-20">
        <UserMenu />
      </div>
      <main className="max-w-md mx-auto px-4 py-8 pt-16 sm:pt-8">
        <section className="mb-8">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-neutral-400">{subtitle}</p>
        </section>
        <section>
          <Card title="Accesos rápidos" variant="dark">
            <div className="space-y-3">
              {actions.map((a) => (
                <Link key={a.to} to={a.to} className="block">
                  <Button
                    variant={a.variant ?? 'primary'}
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
      </main>
    </div>
  );
}
