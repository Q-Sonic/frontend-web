import { HomeLayout } from '../../components';

const actions = [
  { label: 'Buscar artistas', to: '/home/organizacion', variant: 'primary' as const },
  { label: 'Mi perfil', to: '/profile', variant: 'secondary' as const },
];

export function HomeOrganizacionPage() {
  return (
    <HomeLayout
      role="organizacion"
      title="Inicio (Organización)"
      subtitle="Gestiona eventos, contratos y pagos con artistas."
      actions={actions}
    />
  );
}
