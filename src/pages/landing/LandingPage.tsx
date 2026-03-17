import { Link } from 'react-router-dom';
import { Topbar, Button, UserMenu } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { config } from '../../config';

const gradientBtn = 'bg-gradient-to-r from-violet-500 to-blue-600 text-white hover:opacity-90';
const cardClass =
  'rounded-xl border border-neutral-700 bg-neutral-900/50 p-6 text-left transition hover:border-neutral-600';

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Topbar
        variant="dark"
        right={
          user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="primary" className={gradientBtn}>
                  Ir al inicio
                </Button>
              </Link>
              <UserMenu />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <span className="text-sm text-neutral-300 hover:text-white">Iniciar sesión</span>
              </Link>
              <Link to="/register">
                <Button variant="primary" className={gradientBtn}>
                  Registrarse
                </Button>
              </Link>
            </div>
          )
        }
      />

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <section className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contrata a tus artistas preferidos para tu evento o concierto
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10">
            Encuentra talento musical, contrata para fiestas, bodas, conciertos y más. Todo en un solo lugar.
          </p>
          {!user && (
            <Link to="/register">
              <Button className={`${gradientBtn} px-6 py-3 text-base`}>
                Crear cuenta gratis
              </Button>
            </Link>
          )}
        </section>

        <section className="mb-20">
          <h2 className="text-2xl font-semibold text-white mb-6">¿Qué es {config.APP_NAME}?</h2>
          <p className="text-neutral-400 mb-8 max-w-2xl">
            La plataforma que conecta a quienes organizan eventos con artistas y músicos. Contrata para tu evento o concierto y gestiona todo de forma sencilla.
          </p>
        </section>

        <section className="mb-20">
          <h2 className="text-2xl font-semibold text-white mb-6">Para ti</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className={cardClass}>
              <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">¿Contratas artistas?</h3>
              <p className="text-neutral-400 mb-4">
                Contrata a tus artistas preferidos para un evento, concierto, fiesta o boda. Explora el catálogo, filtra por género y ubicación, y contrata con confianza.
              </p>
              {!user && (
                <Link to="/register">
                  <span className={`text-sm font-medium ${gradientBtn} px-4 py-2 rounded-lg inline-block`}>
                    Registrarme como contratante
                  </span>
                </Link>
              )}
            </div>
            <div className={cardClass}>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <span className="text-2xl">🎤</span>
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">¿Eres artista o músico?</h3>
              <p className="text-neutral-400 mb-4">
                Sé parte del catálogo de artistas. Te contratan para eventos, conciertos y shows; maximiza tus ganancias, tu exposición y haz que tu música se escuche.
              </p>
              {!user && (
                <Link to="/register">
                  <span className={`text-sm font-medium ${gradientBtn} px-4 py-2 rounded-lg inline-block`}>
                    Unirme como artista
                  </span>
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="text-center pt-8 border-t border-neutral-800">
          <p className="text-neutral-500 text-sm">
            © {new Date().getFullYear()} {config.APP_NAME} {config.APP_TAGLINE}
          </p>
        </section>
      </main>
    </div>
  );
}
