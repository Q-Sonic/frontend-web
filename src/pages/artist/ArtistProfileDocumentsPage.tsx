import { Navigate, useParams } from 'react-router-dom';

export function ArtistProfileDocumentsPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return <Navigate to="/artist" replace />;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 pb-12">
      <p className="text-neutral-400 text-sm leading-relaxed">
        La sección de documentos está en preparación. Los servicios siguen disponibles en la pestaña Perfil.
      </p>
    </div>
  );
}
