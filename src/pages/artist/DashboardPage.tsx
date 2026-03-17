import { Link } from 'react-router-dom';
import WorldIcon from '../../../public/icons/world';
import { IoIosArrowForward } from 'react-icons/io';
import { useEffect, useState } from 'react';
import { formatMoney } from '../../helpers/money';

const BAR_DATA = [40, 65, 45, 80, 55, 90, 70];

export function HomeArtistaPage() {
  return (
    <div className="w-full max-w-[1600px] mx-auto flex gap-6">
      <div className="flex-1 min-w-0 space-y-6 bg-card h-fit rounded-2xl p-6">
        {/* Resumen */}
        <SummaryCard />

        {/* Otros */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Otros</h2>
            <span className="text-muted text-sm">Today</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/artist/services" className="rounded-xl p-5 border border-white/10 block hover:border-white/30 transition-colors bg-card">
              <h3 className="text-lg font-bold text-white">Servicios y precios</h3>
              <p className="text-sm mt-1 text-muted">Configura tus precios</p>
            </Link>
            <Link to="/artist/media" className="rounded-xl p-5 border border-white/10 block hover:border-white/30 transition-colors bg-card">
              <h3 className="text-lg font-bold text-white">Multimedia</h3>
              <p className="text-sm mt-1 text-muted">Subir fotos, audio, video</p>
            </Link>

            <PromoCard title="Blindaje Prime" isPopular />
            <PromoCard title="Seguro Prime" />
          </div>
        </section>
      </div>

      {/* Right panel */}
      <aside className="w-72 shrink-0 space-y-4 hidden xl:block">
        <BalanceCard />

        {/* Próximo Show */}
        <div className="rounded-xl p-5 border border-white/10 bg-card">
          <h3 className="text-lg font-bold text-white mb-3">Próximo Show</h3>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="w-20 h-20 rounded-md bg-muted/20 flex items-center justify-center text-2xl">🎤</div>
            <div>
              <p className="font-semibold text-white">ANDRÉS MORA</p>
              <p className="text-muted text-sm">25 Junio • Quito</p>
            </div>
          </div>
          <Link to="/artist" className="block w-full text-center py-2 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15">
            Ver Detalles
          </Link>
        </div>
      </aside>
    </div>
  );
}

function SummaryCard() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-semibold text-white">Resumen</h1>
        <div className="flex items-center gap-2 text-muted text-sm">
          <div className="rounded-full bg-muted-card w-8 h-8 flex items-center justify-center">
            <WorldIcon color="var(--color-muted)" />
          </div>
          <div className="flex flex-col">
            <p className="text-sm">Visitas de tu perfil</p>
            <p className="text-xl font-semibold text-white">150</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-surface rounded-2xl p-6">
        {/* Eventos card */}
        <div className="rounded-xl p-5 border border-white/10 bg-card">
          <h2 className="text-lg font-bold text-white mb-3">Eventos</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-4">
              <p className="text-2xl font-bold text-white mb-2">+25% mes</p>
              <div>
                <p className="text-green-500 text-sm font-medium">+70% Este Mes</p>
                <p className="text-muted text-sm">50 Evt el mes pasado</p>
              </div>
            </div>

            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-card)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="3"
                  strokeDasharray="80 100"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-medium text-white">20</span>
            </div>
          </div>
        </div>

        {/* Visitas card */}
        <div
          className="rounded-xl p-5 border border-white/10 bg-card"
        >
          <h2 className="text-lg font-bold text-white mb-4">Visitas</h2>
          <div className="flex items-end gap-1 h-24">
            {BAR_DATA.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t min-w-0 bg-muted/30"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-muted text-xs">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BalanceCard() {

  const [balance, setBalance] = useState<string>('');

  useEffect(() => {
    setBalance(formatMoney(285410.12) ?? '');
  }, [formatMoney]);

  return (
    <div className="flex flex-col gap-2 items-center justify-center rounded-4xl p-5 text-white bg-linear-to-l from-accent to-[#3A9AF4]">
      <h3 className="font-medium opacity-90">My balance</h3>
      <p className="text-3xl font-bold">$ {balance}</p>
      <button type="button" className="mt-3 px-4 py-2 rounded-full flex items-center gap-2 font-medium bg-white/20 hover:bg-white/30 cursor-pointer">
        Retirar <IoIosArrowForward className="w-4 h-4" />
      </button>  
    </div>
  );
}

function PromoCard({ title, isPopular = false }: { title: string, isPopular?: boolean }) {
  return (
    <div className="rounded-xl p-8 pb-20 border border-white/10 relative overflow-hidden bg-black">
      {isPopular && <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-medium bg-warning/20 text-warning">Popular</span>}
      <h3 className="text-2xl font-bold text-white">{title}</h3>
    </div>
  );
}