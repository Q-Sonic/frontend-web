import { Link } from 'react-router-dom';
import { Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { config } from '../../config';
import headerLogoIcon from '../../assets/icons/Logo small - Login.svg';
import heroConcertScreen from '../../assets/images/landing/Concierto Pantalla LadingPage.svg';

const topMenuItems = ['Explora', 'Artistas', 'Como funciona', 'Precios', 'Contacto'];
type TrustItem = {
  label: string;
  icon: 'verified' | 'payments' | 'support' | 'bookings';
};

const trustItems: TrustItem[] = [
  { label: 'ARTISTAS VERIFICADOS', icon: 'verified' },
  { label: 'PAGOS 100% SEGUROS', icon: 'payments' },
  { label: 'SOPORTE 24/7', icon: 'support' },
  { label: 'CONTRATACIONES INMEDIATAS', icon: 'bookings' },
];
const trustItemsLoop = [...trustItems, ...trustItems];
const filterItems = ['Genero', 'Ubicacion', 'Disponible', 'Rango de precios'];

function TrustIcon({ type }: { type: TrustItem['icon'] }) {
  if (type === 'verified') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6 text-neutral-300" fill="none">
        <path d="M12 2.5l2.6 1.6 3-.1 1.5 2.6 2.6 1.5-.1 3 1.6 2.6-1.6 2.6.1 3-2.6 1.5-1.5 2.6-3-.1-2.6 1.6-2.6-1.6-3 .1-1.5-2.6-2.6-1.5.1-3-1.6-2.6 1.6-2.6-.1-3 2.6-1.5 1.5-2.6 3 .1L12 2.5z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8.3 12.3l2.4 2.4 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === 'payments') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6 text-neutral-300" fill="none">
        <rect x="3.2" y="6.2" width="17.6" height="12" rx="2.4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.8 10.2h16.4M7.8 14.3h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'support') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6 text-neutral-300" fill="none">
        <path d="M4.5 12a7.5 7.5 0 1115 0" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="12" width="4" height="6.5" rx="1.7" stroke="currentColor" strokeWidth="1.5" />
        <rect x="17" y="12" width="4" height="6.5" rx="1.7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 18.5v1.1a1.9 1.9 0 01-1.9 1.9h-1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6 text-neutral-300" fill="none">
      <path d="M7 3.5v3M17 3.5v3M4 9.2h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="4" y="5.8" width="16" height="14.7" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 14l2.1 2.1L15.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#07090b] text-neutral-100">
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 bottom-0 top-[4.75rem] z-0"
        style={{
          background:
            'radial-gradient(980px 700px at 0% 0%, rgba(41,199,235,0.7) 0%, rgba(26,148,183,0.52) 24%, rgba(10,74,98,0.34) 44%, rgba(7,24,36,0.17) 58%, rgba(7,9,11,0.05) 72%, rgba(7,9,11,0) 86%)',
        }}
      />
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0B0B]">
        <div className="mx-auto flex min-h-[4.5rem] max-w-[1150px] items-center justify-between px-3 py-3 md:px-5 md:py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={headerLogoIcon} alt={`${config.APP_NAME} logo`} className="h-9 w-9" />
            <span className="text-2xl font-semibold tracking-tight">{config.APP_NAME}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm text-neutral-300">
            {topMenuItems.map((item) => (
              <a key={item} href="#" className="transition hover:text-white">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/dashboard">
                <Button variant="secondary" className="h-10 rounded-full px-6">
                  Ir al inicio
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="primary" className="h-10 rounded-full px-7 text-sm">
                    Iniciar sesion
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" className="h-10 rounded-full px-7 text-sm border-[#00CCCB]/45">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-[1150px] px-3 pt-[4.75rem] pb-10 md:px-5 md:pb-14 lg:px-8">

        <main className="space-y-10 md:space-y-14 pt-4 md:pt-6">
          <section className="rounded-2xl p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
              <div>
                <h1 className="max-w-xl text-4xl md:text-5xl font-semibold leading-tight text-white">
                  Contrata el artista perfecto para tu evento en minutos
                </h1>
                <p className="mt-6 max-w-lg text-2xl leading-relaxed text-neutral-300">
                  Descubre un catalogo exclusivo de artistas certificados, revisa sus perfiles y reserva su fecha,
                  todo en un solo lugar
                </p>
                <Link to={user ? '/dashboard' : '/register'} className="inline-block mt-8">
                  <Button variant="primary" className="h-13 rounded-full px-8 text-base">
                    Explorar catalogo
                  </Button>
                </Link>
              </div>

              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-xl">
                  <div
                    className={[
                      'rounded-[1.35rem] p-[7px]',
                      'bg-[#2f343b]',
                      'shadow-[0_22px_44px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)]',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'rounded-[1.05rem] border border-[#7c8aa0]/65',
                        'bg-[#1a1d22]',
                        'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.35)]',
                      ].join(' ')}
                    >
                      <div className="rounded-[0.95rem] bg-black p-2 md:p-2.5">
                        <div className="overflow-hidden rounded-[0.65rem]">
                          <img
                            src={heroConcertScreen}
                            alt={`${config.APP_NAME} - evento en vivo`}
                            className="block h-auto w-full select-none"
                            loading="eager"
                            decoding="async"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-white/15 py-3 overflow-hidden">
            <div
              className="flex w-max items-center gap-6 md:gap-10"
              style={{ animation: 'trust-bar-marquee 24s linear infinite' }}
            >
              {trustItemsLoop.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="min-w-[220px] md:min-w-[290px] flex items-center justify-center gap-3 text-center text-sm md:text-lg tracking-wide text-neutral-300"
                >
                  <TrustIcon type={item.icon} />
                  {item.label}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#00CCCB]/65 bg-[radial-gradient(circle_at_80%_95%,rgba(0,204,203,0.18),transparent_42%),#07090c] p-7 md:p-9">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-4xl md:text-6xl font-semibold leading-tight text-white">
                  Eres un artista o buscas talento personalizado?
                </h2>
                <p className="mt-5 max-w-lg text-lg md:text-3xl text-neutral-300 leading-relaxed">
                  Dejanos tu correo y un asesor te ayudara a gestionar tu contratacion en menos de 24 horas.
                </p>
              </div>

              <form className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-3xl text-neutral-100">Nombre Completo</span>
                  <input
                    type="text"
                    className="h-13 w-full rounded-2xl border border-[#00CCCB] bg-transparent px-4 text-white outline-none transition focus:border-[#15ebe9]"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-3xl text-neutral-100">Correo electronico</span>
                  <input
                    type="email"
                    className="h-13 w-full rounded-2xl border border-[#00CCCB] bg-transparent px-4 text-white outline-none transition focus:border-[#15ebe9]"
                  />
                </label>

                <Button type="button" variant="primary" className="mt-2 h-13 rounded-full px-8 text-lg">
                  Solicitar acceso gratuito
                </Button>
              </form>
            </div>
          </section>

          <section className="rounded-2xl bg-[radial-gradient(circle_at_80%_30%,rgba(0,204,203,0.25),transparent_42%),#050709] p-7 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <h2 className="text-4xl md:text-6xl font-semibold leading-tight text-white">
                  Como contratar en {config.APP_NAME}?
                </h2>
                <p className="mt-5 max-w-lg text-lg md:text-3xl leading-relaxed text-neutral-300">
                  Encontrar, escuchar y contratar al artista perfecto para tu evento nunca fue tan facil.
                  Nuestra plataforma te permite gestionar todo el proceso de forma segura y transparente
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#0f1824] to-[#111827]" />
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#093d4a] to-[#174467]" />
                </div>
                <div className="aspect-[7/2] rounded-2xl bg-gradient-to-r from-[#383838] via-[#505050] to-[#636363] px-6 flex items-center overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-neutral-200">
                    {filterItems.map((item) => (
                      <span key={item} className="rounded-full border border-white/30 px-3 py-1.5">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(0,204,203,0.2),transparent_45%),#040507] p-7 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
              <div className="grid grid-cols-2 gap-4">
                {['Ruben Blades', 'Marck Vibes', 'Andrea Echeverry', 'Dj Max'].map((artistName) => (
                  <article key={artistName} className="rounded-2xl border border-white/20 bg-black/40 p-3">
                    <div className="mb-2 aspect-square rounded-xl bg-gradient-to-br from-[#1f2937] to-[#0f172a]" />
                    <h3 className="font-medium text-white">{artistName}</h3>
                    <p className="text-sm text-neutral-300">$ 450 USD</p>
                    <p className="text-xs text-[#00CCCB] mt-0.5">Desde</p>
                  </article>
                ))}
              </div>

              <div>
                <h2 className="text-4xl md:text-6xl font-semibold leading-tight text-white">
                  Descubre el talento que hara vibrar tu evento
                </h2>
                <p className="mt-5 max-w-lg text-lg md:text-3xl leading-relaxed text-neutral-300">
                  Explora cientos de artistas de todos los generos, escucha sus mejores temas y reserva su fecha de
                  forma segura y transparente. El proximo gran show comienza aqui.
                </p>
                <Link to={user ? '/dashboard' : '/register'} className="inline-block mt-8">
                  <Button variant="primary" className="h-13 rounded-full px-8 text-base">
                    Explorar catalogo
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-[#515156] py-16 px-6 text-center shadow-[0_0_18px_rgba(0,204,203,0.3)]">
            <h2 className="text-4xl md:text-7xl font-semibold leading-tight text-white">
              Haz que tu evento sea inolvidable
            </h2>
            <Link to={user ? '/dashboard' : '/register'} className="inline-block mt-8">
              <Button variant="primary" className="h-13 rounded-full px-8 text-2xl">
                Empieza ahora
              </Button>
            </Link>
          </section>
        </main>

        <footer className="mt-12 border-t border-white/15 pt-8 pb-4">
          <h2 className="text-6xl font-semibold text-white">{config.APP_NAME}</h2>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-4xl text-neutral-200">
            {['Facebook', 'YouTube', 'Instagram', 'Tiktok'].map((item) => (
              <a key={item} href="#" className="transition hover:text-white">
                {item}
              </a>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-400">
            <div className="flex flex-wrap items-center gap-4">
              <a href="#" className="hover:text-neutral-200">Privacidad y Politicas</a>
              <a href="#" className="hover:text-neutral-200">Terminos y Condiciones</a>
            </div>
            <p>Copyright © {new Date().getFullYear()} {config.APP_NAME}</p>
          </div>
        </footer>
      </div>
      <style>
        {`
          @keyframes trust-bar-marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
        `}
      </style>
    </div>
  );
}
