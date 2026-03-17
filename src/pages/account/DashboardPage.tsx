import { HomeLayout } from '../../layouts';

const actions = [
  { label: 'Mi perfil', to: '/profile', variant: 'primary' as const },
];

export function AccountDashboardPage() {
  return (
    <HomeLayout
      title="Inicio"
      subtitle="Bienvenido a tu espacio."
      actions={actions}
    />
  );
}
