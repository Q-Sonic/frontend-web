import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useArtistProfileById } from '../../hooks/useArtistProfileById';
import { 
  Button, 
  Skeleton,
  ArtistProfileSettingsModal, 
  ArtistSongsModal,
  ArtistFeaturedSongModal,
  ArtistServicesAdminModal,
  ArtistCalendarSettings,
} from '../../components';
import { ArtistAccessSettingsPage } from './ArtistAccessSettingsPage';
import { ArtistProfileDocumentsPage } from './ArtistProfileDocumentsPage';
import { 
  FiUser, 
  FiLock, 
  FiFileText, 
  FiMusic, 
  FiImage,
  FiPlus,
  FiCalendar,
  FiAlertCircle
} from 'react-icons/fi';
import { isBackendRoleArtista } from '../../helpers/role';
import { Navigate, useNavigate } from 'react-router-dom';

type SettingsTab = 'profile' | 'media' | 'calendar' | 'documents' | 'access';

export function ArtistSettingsHubPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  
  const isArtist = !!user?.uid && isBackendRoleArtista(user.role);
  
  const { 
    profile, 
    services, 
    artistDisplayName: artistDisplayNameFromApi, 
    loading, 
    error, 
    refetch 
  } = useArtistProfileById(user?.uid ?? undefined, {
    allowEmptyProfileForUid: user?.uid ?? '',
    fallbackDisplayName: user?.displayName ?? 'Artista'
  });

  const [artistDisplayName, setArtistDisplayName] = useState('');
  const [localProfile, setLocalProfile] = useState<any>(null);
  const [localServices, setLocalServices] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<'profile' | 'songs' | 'featured-song' | 'services' | null>(null);

  useEffect(() => {
    if (profile) setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (services) setLocalServices(services);
  }, [services]);

  useEffect(() => {
    if (artistDisplayNameFromApi) setArtistDisplayName(artistDisplayNameFromApi);
  }, [artistDisplayNameFromApi]);

  if (!user?.uid) return <Navigate to="/login" replace />;
  if (!isArtist) return <Navigate to="/artist" replace />;

  const closeModal = () => setActiveModal(null);

  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: <FiUser /> },
    { id: 'calendar', label: 'Mi Calendario', icon: <FiCalendar /> },
    { id: 'media', label: 'Música y Galería', icon: <FiMusic /> },
    { id: 'documents', label: 'Documentos y Contratos', icon: <FiFileText /> },
    { id: 'access', label: 'Seguridad y Acceso', icon: <FiLock /> },
  ] as const;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-16">
      <header className="mb-10 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white font-title">Configuración</h1>
        <p className="text-neutral-400 text-sm max-w-2xl">
          Gestiona tu información pública, archivos técnicos, acceso y seguridad de tu cuenta desde un solo lugar.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-[#38BACC]/15 text-[#7ee8f0] border border-[#38BACC]/30' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="rounded-3xl border border-white/10 bg-[#111214] p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
            {loading ? (
              <div className="space-y-8 animate-pulse">
                <Skeleton className="h-8 w-48 rounded-lg mb-6" />
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                 <FiAlertCircle className="mx-auto text-4xl text-red-500/50 mb-4" />
                 <p className="text-red-400 font-medium">Error al cargar datos: {error}</p>
                 <Button variant="outline" className="mt-4" onClick={() => void refetch()}>Reintentar</Button>
              </div>
            ) : (
              <>
                {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <FiUser className="text-[#38BACC]" /> Datos del Perfil
                  </h2>
                  <div className="grid gap-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/3">
                      <div>
                        <p className="text-sm font-medium text-white">Información Básica</p>
                        <p className="text-xs text-neutral-500">Nombre artístico, biografía, redes sociales y ubicación.</p>
                      </div>
                      <Button 
                        variant="secondary" 
                        onClick={() => setActiveModal('profile')}
                        className="rounded-xl px-4 py-2 text-xs"
                      >
                        Editar Perfil
                      </Button>
                    </div>
                  </div>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <FiLock className="text-[#38BACC]" /> Servicios y Tarifas
                  </h2>
                  <div className="grid gap-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/3">
                      <div>
                        <p className="text-sm font-medium text-white">Configuración de Servicios</p>
                        <p className="text-xs text-neutral-500">Crea servicios, define precios y detalla inclusiones.</p>
                      </div>
                      <Button 
                        variant="secondary" 
                        onClick={() => setActiveModal('services')}
                        className="rounded-xl px-4 py-2 text-xs"
                      >
                        Gestionar
                      </Button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ArtistCalendarSettings artistId={user.uid} />
              </div>
            )}

            {activeTab === 'access' && <ArtistAccessSettingsPage />}
            
            {activeTab === 'documents' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ArtistProfileDocumentsPage />
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <FiMusic className="text-[#38BACC]" /> Música y Canciones
                  </h2>
                  <div className="grid gap-4">
                    <Button variant="secondary" className="w-full justify-between" onClick={() => setActiveModal('songs')}>
                       <span>Gestionar Repertorio</span>
                       <FiMusic />
                    </Button>
                    <Button variant="outline" className="w-full justify-between" onClick={() => setActiveModal('featured-song')}>
                       <span>Elegir Canción Destacada</span>
                       <FiMusic />
                    </Button>
                  </div>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <FiImage className="text-[#38BACC]" /> Galería de Fotos
                  </h2>
                  <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center">
                     <FiImage className="mx-auto text-4xl text-neutral-600 mb-4" />
                     <p className="text-neutral-400">Sube y organiza las fotos de tu perfil.</p>
                     <Button 
                        variant="secondary" 
                        className="mt-6 rounded-full px-8"
                        onClick={() => navigate(`/artist/${user.uid}/gallery/edit`)}
                     >
                        Ir a Galería
                     </Button>
                  </div>
                </section>
              </div>
            )}
            </>
            )}
          </div>
        </main>
      </div>

      <ArtistServicesAdminModal
        isOpen={activeModal === 'services'}
        artistId={user.uid}
        services={localServices}
        onClose={closeModal}
        onServicesChange={setLocalServices}
      />
      <ArtistProfileSettingsModal
        isOpen={activeModal === 'profile'}
        profile={localProfile}
        artistDisplayName={artistDisplayName}
        onClose={closeModal}
        onSaved={(saved) => {
          setLocalProfile((prev: any) => (prev ? { ...prev, ...saved } : prev));
        }}
        onArtistNameSaved={setArtistDisplayName}
      />
      <ArtistSongsModal
        isOpen={activeModal === 'songs'}
        profile={localProfile}
        artistDisplayName={artistDisplayName}
        onClose={closeModal}
        onSongsChange={setSongs}
      />
      <ArtistFeaturedSongModal
        isOpen={activeModal === 'featured-song'}
        profile={localProfile}
        artistDisplayName={artistDisplayName}
        songs={songs}
        onClose={closeModal}
        onSongsChange={setSongs}
      />
    </div>
  );
}
