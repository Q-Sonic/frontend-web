import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { config } from '../../config';
import { submitLandingLead } from '../../api/landingLeadsService';
import { ApiError } from '../../api/client';
import headerLogoIcon from '../../assets/icons/Logo small - Login.svg';
import heroConcertScreen from '../../assets/images/landing/Concierto Pantalla LadingPage.svg';
import howHireBookingCard from '../../assets/images/landing/how-hire-booking-card.png';
import howHireConcertCrowd from '../../assets/images/landing/how-hire-concert-crowd.png';
import howHireTablet from '../../assets/images/landing/how-hire-tablet.png';
import catalogArtistRubenBlades from '../../assets/images/landing/catalog-artist-ruben-blades.png';
import catalogArtistMarckVibes from '../../assets/images/landing/catalog-artist-marck-vibes.png';
import catalogArtistAndreaEcheverry from '../../assets/images/landing/catalog-artist-andrea-echeverry.png';
import catalogArtistDjMax from '../../assets/images/landing/catalog-artist-dj-max.png';
import { Link } from 'react-router-dom';

const topMenuItems = ['Artistas']; // Only keeping artistas for now as it's the main focus

const catalogFeaturedArtists = [
  {
    name: 'Ruben Blades',
    image: catalogArtistRubenBlades,
    imageAlt: 'Musica en vivo con banda en escenario',
  },
  {
    name: 'Marck Vibes',
    image: catalogArtistMarckVibes,
    imageAlt: 'Artista en concierto con iluminacion dramatica',
  },
  {
    name: 'Andrea Echeverry',
    image: catalogArtistAndreaEcheverry,
    imageAlt: 'Cantante en vivo frente al microfono',
  },
  {
    name: 'Dj Max',
    image: catalogArtistDjMax,
    imageAlt: 'DJ frente al publico en club nocturno',
  },
] as const;
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
const catalogFilterDropdowns = ['Genero', 'Ubicacion', 'Disponible'] as const;

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

function FilterLinesIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none">
      <path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CatalogFilterBar() {
  return (
    <div
      aria-hidden
      className="pointer-events-none mb-8 flex max-w-full flex-nowrap items-center gap-3 self-start overflow-x-auto rounded-full border border-white/20 bg-black/50 py-2.5 pl-4 pr-5 text-xs text-neutral-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm sm:gap-4 sm:text-sm md:py-3 md:pl-5 md:pr-6"
    >
      <span className="inline-flex shrink-0 items-center justify-center text-neutral-400">
        <FilterLinesIcon className="h-4 w-4 md:h-5 md:w-5" />
      </span>
      <span className="h-4 w-px shrink-0 bg-white/20" aria-hidden />
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        {catalogFilterDropdowns.map((label) => (
          <span
            key={label}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-neutral-200"
          >
            {label}
            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 opacity-75 md:h-4 md:w-4" />
          </span>
        ))}
      </div>
      <span className="h-4 w-px shrink-0 bg-white/20" aria-hidden />
      <span className="shrink-0 whitespace-nowrap text-[0.7rem] text-neutral-400 sm:text-xs">Rango de precios</span>
      <span className="shrink-0 whitespace-nowrap text-xs font-medium text-[#28C76F] sm:text-sm">$200</span>
      <div className="relative h-1.5 w-[5.5rem] shrink-0 rounded-full bg-neutral-600 sm:w-[7.5rem] md:w-[8.5rem]">
        <div className="absolute inset-y-0 left-[18%] right-[30%] rounded-full bg-[#28C76F]" />
        <span className="absolute left-[15%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-[#28C76F] shadow" />
        <span className="absolute right-[27%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-[#28C76F] shadow" />
      </div>
      <span className="shrink-0 whitespace-nowrap text-xs font-medium text-[#28C76F] sm:text-sm">$500</span>
    </div>
  );
}

export function LandingPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState<'artist' | 'client' | ''>('');
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [leadSuccess, setLeadSuccess] = useState(false);

  async function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadError('');
    setLeadSuccess(false);

    if (!inquiryType) {
      setLeadError('Indica si eres artista o buscas talento.');
      return;
    }

    setLeadLoading(true);
    try {
      await submitLandingLead({
        fullName,
        email,
        inquiryType,
      });
      setLeadSuccess(true);
      setFullName('');
      setEmail('');
      setInquiryType('');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'No se pudo enviar. Intenta de nuevo en unos minutos.';
      setLeadError(message);
    } finally {
      setLeadLoading(false);
    }
  }

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#07090b] text-neutral-100 font-inter">
      {/* Cinematic Mesh Gradient Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div 
          className="absolute -top-[10%] -left-[10%] h-[70%] w-[70%] rounded-full bg-[#00CCCB]/20 blur-[120px] animate-pulse-slow"
          style={{ animationDelay: '0s' }}
        />
        <div 
          className="absolute top-[20%] -right-[10%] h-[60%] w-[60%] rounded-full bg-[#1a94b7]/15 blur-[100px] animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        />
        <div 
          className="absolute -bottom-[10%] left-[20%] h-[50%] w-[80%] rounded-full bg-[#00CCCB]/10 blur-[140px] animate-pulse-slow"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(7,9,11,0) 0%, #07090b 100%)'
        }}
      />
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0B0B]">
        <div className="mx-auto flex min-h-[4.5rem] max-w-[1150px] items-center justify-between px-3 py-3 md:px-5 md:py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={headerLogoIcon} alt={`${config.APP_NAME} logo`} className="h-9 w-9" />
            <span className="text-2xl font-semibold tracking-tight">{config.APP_NAME}</span>
          </Link>

          {/* Restore desktop nav: add `lg:flex` after `hidden` (was: hidden lg:flex …). */}
          <nav className="hidden items-center gap-8 text-sm text-neutral-300" aria-hidden>
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
                <h1 className="max-w-2xl text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-white">
                  La nueva era de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00CCCB] to-[#15ebe9]">música en vivo</span>
                </h1>
                <p className="mt-8 max-w-xl text-xl md:text-2xl leading-relaxed text-neutral-400 font-light">
                  Conectamos el mejor talento con los eventos más exclusivos. 
                  Contrataciones seguras, transparentes y profesionales en un solo lugar.
                </p>
                <Link to={user ? '/dashboard' : '/register'} className="inline-block mt-8">
                  <Button variant="primary" className="h-13 rounded-full px-8 text-base cursor-pointer">
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

          <section className="relative z-20 -mt-8 mb-12 flex justify-center">
            <div className="inline-flex items-center gap-10 rounded-full border border-white/10 bg-white/[0.03] px-10 py-4 backdrop-blur-md">
              <div
                className="flex items-center gap-12"
              >
                {trustItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-neutral-400"
                  >
                    <TrustIcon type={item.icon} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-10 md:p-16 backdrop-blur-xl">
            {/* Decorative glow for the form section */}
            <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#00CCCB]/10 blur-[80px]" />
            
            <div className="relative z-10 grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-5xl md:text-6xl font-bold leading-tight text-white tracking-tight">
                  ¿Sos artista o <span className="text-[#00CCCB]">buscás talento</span>?
                </h2>
                <p className="mt-8 max-w-lg text-xl text-neutral-400 leading-relaxed font-light">
                  Dejanos tu contacto y un asesor especializado te ayudará a gestionar todo en menos de 24 horas. 
                  Es simple, rápido y profesional.
                </p>
              </div>

              <form className="space-y-8 rounded-3xl bg-white/[0.02] p-8 md:p-10 border border-white/5 shadow-2xl" onSubmit={handleLeadSubmit}>
                <div className="space-y-6">
                  <div>
                    <span className="mb-4 block text-sm font-medium tracking-widest text-[#00CCCB] uppercase">Yo soy</span>
                    <div className="flex flex-wrap gap-4">
                      {['artist', 'client'].map((type) => (
                        <label 
                          key={type}
                          className={`
                            relative flex cursor-pointer items-center justify-center rounded-2xl border px-8 py-4 transition-all duration-300
                            ${inquiryType === type 
                              ? 'border-[#00CCCB] bg-[#00CCCB]/10 text-white shadow-[0_0_20px_rgba(0,204,203,0.2)]' 
                              : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/20'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="inquiryType"
                            value={type}
                            checked={inquiryType === type}
                            onChange={() => setInquiryType(type as any)}
                            className="sr-only"
                          />
                          <span className="text-sm font-semibold tracking-wide">
                            {type === 'artist' ? 'ARTISTA' : 'BUSCO TALENTO'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="group relative">
                      <input
                        type="text"
                        required
                        placeholder="Nombre Completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-transparent border-b border-white/10 py-4 text-lg text-white outline-none transition-all focus:border-[#00CCCB] placeholder:text-neutral-600"
                      />
                      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#00CCCB] transition-all duration-300 group-focus-within:w-full" />
                    </div>

                    <div className="group relative">
                      <input
                        type="email"
                        required
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent border-b border-white/10 py-4 text-lg text-white outline-none transition-all focus:border-[#00CCCB] placeholder:text-neutral-600"
                      />
                      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#00CCCB] transition-all duration-300 group-focus-within:w-full" />
                    </div>
                  </div>
                </div>

                {leadError ? (
                  <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20" role="alert">
                    {leadError}
                  </p>
                ) : null}
                {leadSuccess && (
                  <p className="text-sm text-[#28C76F] bg-[#28C76F]/10 p-3 rounded-xl border border-[#28C76F]/20" role="status">
                    ¡Recibido! Te contactaremos en breve.
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-16 rounded-2xl text-lg font-bold tracking-tight shadow-[0_10px_30px_rgba(0,204,203,0.3)] transition-transform active:scale-[0.98]"
                  loading={leadLoading}
                >
                  Solicitar acceso gratuito
                </Button>
              </form>
            </div>
          </section>

          <section className="py-20 md:py-32">
            <div className="grid gap-16 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div className="max-w-xl">
                <span className="mb-4 block text-sm font-semibold tracking-[0.3em] text-[#00CCCB] uppercase">Experiencia</span>
                <h2 className="text-5xl md:text-7xl font-bold leading-tight text-white tracking-tight">
                  Contratar en <span className="text-[#00CCCB]">{config.APP_NAME}</span> es otro nivel
                </h2>
                <p className="mt-8 text-xl leading-relaxed text-neutral-400 font-light">
                  Olvidate de las negociaciones eternas y la informalidad. Gestionamos todo el proceso con 
                  seguridad jurídica y transparencia radical.
                </p>
                <div className="mt-10 space-y-6">
                  {[
                    { title: 'Explora', desc: 'Accedé a un catálogo curado de artistas verificados.' },
                    { title: 'Reserva', desc: 'Bloqueá la fecha con un clic y firma digital automática.' },
                    { title: 'Disfruta', desc: 'Nosotros nos encargamos de que la música no pare.' },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00CCCB] text-black font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                        <p className="text-neutral-500">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative h-[500px] w-full">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#00CCCB]/10 to-transparent blur-3xl opacity-30" />
                <img
                  src={howHireConcertCrowd}
                  alt="Publico en concierto"
                  className="absolute left-[5%] top-[10%] z-[1] w-[80%] rounded-3xl object-cover shadow-2xl ring-1 ring-white/10 grayscale-[0.3] hover:grayscale-0 transition-all duration-700"
                  loading="lazy"
                />
                <div className="absolute bottom-[10%] right-[5%] z-[2] w-[45%] rounded-3xl bg-black/80 p-6 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[#00CCCB] animate-pulse" />
                    <span className="text-xs font-medium tracking-widest text-neutral-400 uppercase font-inter">Live Status</span>
                  </div>
                  <p className="mt-2 text-sm text-white font-medium italic">"La mejor inversión para mi boda, el grupo fue increíble."</p>
                  <p className="mt-1 text-[10px] text-neutral-500">— Martina P., Cliente Pro</p>
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[2.5rem] bg-black/20 p-10 md:p-16 border border-white/5">
            <div className="grid w-full gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div className="grid grid-cols-2 gap-6">
                {catalogFeaturedArtists.map((artist) => (
                  <article key={artist.name} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-4 transition-all duration-500 hover:border-[#00CCCB]/50 hover:bg-[#00CCCB]/5 hover:-translate-y-2">
                    <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-2xl bg-[#0f172a]">
                      <img
                        src={artist.image}
                        alt={artist.imageAlt}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>
                    <div className="relative z-10">
                      <span className="text-[10px] font-bold tracking-[0.2em] text-[#00CCCB] uppercase">Destacado</span>
                      <h3 className="mt-1 text-xl font-bold text-white tracking-tight">{artist.name}</h3>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-light text-neutral-400">Desde</span>
                        <span className="text-lg font-bold text-white italic">$450</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div>
                <span className="mb-4 block text-sm font-semibold tracking-[0.3em] text-[#00CCCB] uppercase">Catálogo</span>
                <h2 className="text-5xl md:text-6xl font-bold leading-tight text-white tracking-tight">
                  Explorá el talento que hará vibrar tu evento
                </h2>
                <p className="mt-8 text-xl leading-relaxed text-neutral-400 font-light">
                  Cientos de artistas verificados, desde solistas íntimos hasta bandas de estadio. 
                  Escuchá su música, reservá su fecha y gestioná el contrato online.
                </p>
                <Link to={user ? '/dashboard' : '/register'} className="inline-block mt-10">
                  <Button variant="primary" className="h-16 rounded-2xl px-12 text-lg font-bold shadow-xl">
                    Ver todo el catálogo
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#00CCCB] to-[#15ebe9] py-24 px-8 text-center">
            <div className="absolute top-0 right-0 h-full w-full opacity-20" style={{ background: 'radial-gradient(circle at 70% 30%, white 0%, transparent 70%)' }} />
            <div className="relative z-10 mx-auto max-w-4xl">
              <h2 className="text-5xl md:text-8xl font-black leading-[0.9] text-black tracking-tighter uppercase italic">
                Make it unforgettable
              </h2>
              <p className="mt-8 text-2xl font-medium text-black/70">
                Arranca hoy mismo y lleva tu evento a otro nivel.
              </p>
              <Link to={user ? '/dashboard' : '/register'} className="inline-block mt-12">
                <button className="h-20 rounded-full bg-black px-16 text-2xl font-bold text-white shadow-2xl transition-all hover:scale-105 active:scale-95">
                  Empezar ahora
                </button>
              </Link>
            </div>
          </section>
        </main>

        <footer className="mt-12 border-t border-white/15 pt-12 pb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">
                {config.APP_NAME}
              </h2>
              <p className="mt-4 max-w-xs text-sm text-neutral-400">
                Llevando la música en vivo al siguiente nivel. Encuentra, reserva y disfruta.
              </p>
            </div>

            <div className="flex items-center gap-6">
              {[
                {
                  label: 'Facebook',
                  href: 'https://www.facebook.com/share/186U37Mkek',
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                },
                {
                  label: 'Instagram',
                  href: 'https://www.instagram.com/stage_go_latam?igsh=ZXh4MWtrNmM0dXZ3',
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                },
                {
                  label: 'TikTok',
                  href: 'https://www.tiktok.com/@stagego_latam?_r=1&_t=ZS-95n7jNGoBdP',
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
                },
              ].map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-neutral-400 transition-all hover:bg-[#00d4c8] hover:text-black hover:scale-110"
                  aria-label={label}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-white/5 pt-8 text-sm">
            <div className="flex items-center gap-8">
              <Link
                to="/terms"
                className="text-neutral-400 hover:text-[#00d4c8] transition-colors"
              >
                Términos y Condiciones
              </Link>
              <Link to="/privacy" className="text-neutral-400 hover:text-[#00d4c8] transition-colors">
                Privacidad y Políticas
              </Link>
            </div>
            <p className="text-neutral-500 tabular-nums">
              © {new Date().getFullYear()} {config.APP_NAME}. Impulsando el ecosistema de la música en vivo.
            </p>
          </div>
        </footer>
      </div>
      <a
        href="https://wa.me/5491122334455" // Sample placeholder, ideally from config
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[60] flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110 hover:brightness-110 active:scale-95"
        aria-label="Contactar por WhatsApp"
      >
        <FaWhatsapp size={36} />
      </a>

      <style>
        {`
          @keyframes trust-bar-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes pulse-slow {
            0%, 100% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.1); opacity: 0.3; }
          }
          .animate-pulse-slow {
            animation: pulse-slow 8s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
}
