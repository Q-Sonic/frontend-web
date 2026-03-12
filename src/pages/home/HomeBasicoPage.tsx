import { HomeLayout } from '../../components';

const actions = [
  { label: 'Mi perfil', to: '/profile/basico', variant: 'primary' as const },
];

export function HomeBasicoPage() {
  return (
    <HomeLayout
      role="basico"
      title="Inicio"
      subtitle="Bienvenido a tu espacio."
      actions={actions}
    />
  );
}
