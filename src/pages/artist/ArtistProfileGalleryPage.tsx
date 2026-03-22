import { Navigate, useParams } from 'react-router-dom';

export function ArtistProfileGalleryPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return <Navigate to="/artist" replace />;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 pb-12">
      <p className="text-neutral-400 text-sm leading-relaxed">
        La galería dedicada está en preparación. Mientras tanto puedes ver las fotos en la pestaña Perfil de
        este artista.
      </p>
    </div>
  );
}
