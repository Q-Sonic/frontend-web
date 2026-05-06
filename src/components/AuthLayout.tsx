import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import leftBackgroundLogoUrl from '../assets/icons/Logo para fondo Izq -Login.svg';
import loginSmallLogoUrl from '../assets/icons/Logo small - Login.svg';

export interface AuthLayoutBackLink {
  to: string;
  label: string;
}

interface AuthLayoutProps {
  children: ReactNode;
  backLink?: AuthLayoutBackLink;
}

export function AuthLayout({ children, backLink }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-[#111318]">
      {/* Left panel — branded */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between mt-6 mb-6 ml-6 rounded-3xl border-none"
        style={{
          background:
            'linear-gradient(145deg, rgba(26, 58, 110, 1) 0%, rgba(26, 107, 138, 1) 51%, rgb(20, 110, 95) 78%, rgba(13, 92, 78, 1) 100%)',
        }}
      >
        {/* Left background SVG */}
        <img
          src={leftBackgroundLogoUrl}
          alt=""
          aria-hidden
          className="absolute left-0 right-0 bottom-0 w-full h-auto opacity-100 pointer-events-none select-none"
        />

        <div className="relative z-10 flex flex-col justify-between w-full h-full p-10">
          {/* Top logo */}
          <div className="flex items-center gap-2">            
            <img
              src={loginSmallLogoUrl}
              alt=""
              aria-hidden
              className="w-8 h-8 flex-shrink-0 object-contain"
            />          
            <span className="text-white font-semibold text-lg tracking-wide">Stage Go</span>
          </div>

          {/* Main headline */}
          <div>
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
              Encuentra el<br />
              artista ideal<br />
              <span className="text-white/80">para tu</span>
              <br />
              evento
            </h1>
          </div>

          {/* Bottom tagline */}
          <div>
            <p className="text-white/90 text-sm leading-snug">
              Shows en vivo, acústicos y
              <br />
              entretenimiento profesional en minutos.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 mt-6 mr-6 mb-6 ml-5 rounded-3xl bg-card/80 text-muted">
        <div className="w-full max-w-[420px]">
          {backLink ? (
            <Link
              to={backLink.to}
              className="mb-6 inline-block text-sm font-medium text-[#00d4c8] no-underline transition-colors hover:text-[#00ece0]"
            >
              {'← '}
              {backLink.label}
            </Link>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
