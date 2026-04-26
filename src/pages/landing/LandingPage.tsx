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
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#07090b] text-neutral-100">
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 bottom-0 top-[4.75rem] z-0"
        style={{
          background: [
            'radial-gradient(980px 700px at 0% 0%, rgba(41,199,235,0.7) 0%, rgba(26,148,183,0.52) 24%, rgba(10,74,98,0.34) 44%, rgba(7,24,36,0.17) 58%, rgba(7,9,11,0.05) 72%, rgba(7,9,11,0) 86%)',
            // Right-side wash (page-level, same paint as hero): avoids a separate section layer so the glow has no rectangular edge; vw/vh keep softness on different screens.
            'radial-gradient(ellipse 125vw min(115vh, 1050px) at 92% 42%, rgba(41,199,235,0.12) 0%, rgba(26,148,183,0.05) 30%, rgba(0,204,203,0.035) 44%, rgba(7,9,11,0) 60%)',
          ].join(', '),
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
                <h1 className="max-w-xl text-4xl md:text-5xl font-semibold leading-tight text-white">
                  Contrata el artista perfecto para tu evento en minutos
                </h1>
                <p className="mt-6 max-w-lg text-2xl leading-relaxed text-neutral-300">
                  Descubre un catalogo exclusivo de artistas certificados, revisa sus perfiles y reserva su fecha,
                  todo en un solo lugar
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

              <form className="space-y-4" onSubmit={handleLeadSubmit}>
                <fieldset className="space-y-3">
                  <legend className="sr-only">Tipo de consulta</legend>
                  <span className="mb-2 block text-xl text-neutral-100 md:text-2xl">Yo soy</span>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-neutral-100 has-[:checked]:border-[#00CCCB] has-[:checked]:bg-[#00CCCB]/10">
                      <input
                        type="radio"
                        name="inquiryType"
                        value="artist"
                        checked={inquiryType === 'artist'}
                        onChange={() => setInquiryType('artist')}
                        className="h-4 w-4 accent-[#00CCCB]"
                      />
                      <span>Artista</span>
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-neutral-100 has-[:checked]:border-[#00CCCB] has-[:checked]:bg-[#00CCCB]/10">
                      <input
                        type="radio"
                        name="inquiryType"
                        value="client"
                        checked={inquiryType === 'client'}
                        onChange={() => setInquiryType('client')}
                        className="h-4 w-4 accent-[#00CCCB]"
                      />
                      <span>Busco talento</span>
                    </label>
                  </div>
                </fieldset>

                <label className="block">
                  <span className="mb-2 block text-3xl text-neutral-100">Nombre Completo</span>
                  <input
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={120}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-13 w-full rounded-2xl border border-[#00CCCB] bg-transparent px-4 text-white outline-none transition focus:border-[#15ebe9]"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-3xl text-neutral-100">Correo electronico</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-13 w-full rounded-2xl border border-[#00CCCB] bg-transparent px-4 text-white outline-none transition focus:border-[#15ebe9]"
                  />
                </label>

                {leadError ? (
                  <p className="text-sm text-red-400" role="alert">
                    {leadError}
                  </p>
                ) : null}
                {leadSuccess ? (
                  <p className="text-sm text-[#28C76F]" role="status">
                    Listo. Te contactaremos en menos de 24 horas.
                  </p>
                ) : null}

                <Button
                  type="submit"
                  variant="primary"
                  className="mt-2 h-13 rounded-full px-8 text-lg cursor-pointer"
                  loading={leadLoading}
                >
                  Solicitar acceso gratuito
                </Button>
              </form>
            </div>
          </section>

          <section className="p-7 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
              <div className="max-w-xl lg:max-w-none">
                <h2 className="text-4xl md:text-6xl font-semibold leading-tight text-white">
                  Como contratar en {config.APP_NAME}?
                </h2>
                <p className="mt-5 max-w-lg text-lg md:text-3xl leading-relaxed text-neutral-300">
                  Encontrar, escuchar y contratar al artista perfecto para tu evento nunca fue tan facil.
                  Nuestra plataforma te permite gestionar todo el proceso de forma segura y transparente
                </p>
              </div>

              <div className="relative mx-auto min-h-[300px] w-full max-w-[min(100%,440px)] sm:min-h-[360px] lg:mx-0 lg:ml-auto lg:mr-0 lg:min-h-[400px] lg:max-w-[480px]">
                <img
                  src={howHireConcertCrowd}
                  alt="Publico en concierto con iluminacion de escenario"
                  className="pointer-events-none absolute left-[8%] top-[14%] z-[1] w-[82%] rounded-[1.35rem] object-cover shadow-[0_28px_56px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/10 select-none"
                  loading="lazy"
                  decoding="async"
                />
                <img
                  src={howHireTablet}
                  alt="Mano usando lapiz en tableta digital"
                  className="pointer-events-none absolute bottom-[2%] right-0 z-[2] w-[52%] rounded-[1.35rem] object-cover shadow-[0_22px_44px_-8px_rgba(0,0,0,0.72)] ring-1 ring-white/10 select-none"
                  loading="lazy"
                  decoding="async"
                />
                <img
                  src={howHireBookingCard}
                  alt="Interfaz de reserva de fecha de artista en la app"
                  className="pointer-events-none absolute left-0 top-0 z-[3] w-[46%] max-w-[210px] rounded-[1.35rem] object-cover shadow-[0_22px_44px_-8px_rgba(0,0,0,0.78)] ring-1 ring-white/10 select-none sm:max-w-[240px] sm:w-[44%]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </section>

          <section className="flex flex-col items-stretch rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(0,204,203,0.2),transparent_45%),#040507] p-7 md:p-10">
            <CatalogFilterBar />
            <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
              <div className="grid grid-cols-2 gap-4">
                {catalogFeaturedArtists.map((artist) => (
                  <article key={artist.name} className="rounded-2xl border border-white/20 bg-black/40 p-3">
                    <div className="mb-2 aspect-square overflow-hidden rounded-xl bg-[#0f172a] ring-1 ring-white/10">
                      <img
                        src={artist.image}
                        alt={artist.imageAlt}
                        className="h-full w-full object-cover select-none"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <h3 className="font-medium text-white">{artist.name}</h3>
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
                  <Button variant="primary" className="h-13 rounded-full px-8 text-base cursor-pointer">
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
              <Button variant="primary" className="h-13 rounded-full px-8 text-2xl cursor-pointer">
                Empieza ahora
              </Button>
            </Link>
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
