import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#050505] border-t border-white/5 pt-16 pb-8">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <span className="text-black font-black text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">StageGo</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-[240px]">
              La plataforma definitiva para la gestión de eventos y contratación de artistas.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Plataforma</h4>
            <ul className="space-y-4">
              <li><Link to="/discover" className="text-white/50 hover:text-accent transition-colors text-sm">Descubrir Artistas</Link></li>
              <li><Link to="/register" className="text-white/50 hover:text-accent transition-colors text-sm">Unirse como Artista</Link></li>
              <li><Link to="/login" className="text-white/50 hover:text-accent transition-colors text-sm">Iniciar Sesión</Link></li>
            </ul>
          </div>

          {/* Legal Links (Mandatory for Payment Gateways) */}
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Legal</h4>
            <ul className="space-y-4">
              <li><Link to="/terms" className="text-white/50 hover:text-accent transition-colors text-sm">Términos y Condiciones</Link></li>
              <li><Link to="/privacy" className="text-white/50 hover:text-accent transition-colors text-sm">Política de Privacidad</Link></li>
              <li><Link to="/refunds" className="text-white/50 hover:text-accent transition-colors text-sm">Política de Devolución</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Soporte</h4>
            <ul className="space-y-4">
              <li><Link to="/help" className="text-white/50 hover:text-accent transition-colors text-sm">Centro de Ayuda</Link></li>
              <li><Link to="/contact" className="text-white/50 hover:text-accent transition-colors text-sm">Contacto</Link></li>
              <li className="flex items-center gap-2 text-white/50 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Soporte en vivo 24/7
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/20 text-xs">
            © {currentYear} Q-Music-Arch. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/20 hover:text-white transition-colors">
              <span className="sr-only">Instagram</span>
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="text-white/20 hover:text-white transition-colors">
              <span className="sr-only">Twitter</span>
              <i className="fab fa-twitter"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
