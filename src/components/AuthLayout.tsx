import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-[#111318]">
      {/* Left panel — branded */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-10"
           style={{ background: 'linear-gradient(145deg, #0d5c4e 0%, #0e7a68 30%, #1a6b8a 60%, #1a3a6e 100%)' }}>

        {/* Decorative circles */}
        <div className="absolute bottom-0 left-0 w-[550px] h-[550px] rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, #0ff0b3 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
        <div className="absolute top-1/2 right-0 w-[350px] h-[350px] rounded-full opacity-15"
             style={{ background: 'radial-gradient(circle, #00c4ff 0%, transparent 70%)', transform: 'translate(30%, -50%)' }} />

        {/* Top logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
              <path d="M9 8h6M9 12h4M9 16h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-wide">Q-Sonic</span>
        </div>

        {/* Main headline */}
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
            Encuentra el<br />
            artista ideal<br />
            <span className="text-white/80">para tu</span><br />
            evento
          </h1>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
              <path d="M9 8h6M9 12h4M9 16h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-white/70 text-sm leading-snug">
            Shows en vivo, acústicos y<br />
            entretenimiento profesional en minutos.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}
