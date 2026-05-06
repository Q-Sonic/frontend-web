import { HomeLayout } from '../../layouts';

const actions = [
  { label: 'Buscar artistas', to: '/organization', variant: 'primary' as const },
  { label: 'Mi perfil', to: '/profile', variant: 'secondary' as const },
];

export function HomeOrganizacionPage() {
  return (
    <HomeLayout
      title="Inicio (Organización)"
      subtitle="Gestiona eventos, contratos y pagos con artistas."
      actions={actions}
    />
  );
}
