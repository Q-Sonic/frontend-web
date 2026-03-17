import { Link } from 'react-router-dom';

const BAR_DATA = [40, 65, 45, 80, 55, 90, 70];

export function HomeArtistaPage() {
  return (
    <>
      <div className="flex-1 min-w-0 space-y-6">
          {/* Resumen */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white">Resumen</h1>
              <div className="flex items-center gap-2 text-muted text-sm">
                <span className="w-5 h-5 rounded flex items-center justify-center text-sm bg-card">🌐</span>
                Visitas de tu perfil <span className="font-semibold text-white">150</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Eventos card */}
              <div
                className="rounded-xl p-5 border border-white/10 bg-card"
              >
                <h2 className="text-lg font-bold text-white mb-3">Eventos</h2>
                <p className="text-2xl font-bold text-white mb-2">+25% mes</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
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
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">20</span>
                  </div>
                  <div>
                    <p className="text-green-500 text-sm font-medium">+70% Este Mes</p>
                    <p className="text-muted text-sm">50 Evt el mes pasado</p>
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

          {/* Otros */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Otros</h2>
              <span className="text-muted text-sm">Today</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl p-5 border border-white/10 relative overflow-hidden bg-card">
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-medium bg-warning/20 text-warning">Popular</span>
                <h3 className="text-lg font-bold text-white">Blindaje Prime</h3>
              </div>
              <div className="rounded-xl p-5 border border-white/10 bg-card">
                <h3 className="text-lg font-bold text-white">Seguro Prime</h3>
              </div>
              <Link to="/artist/services" className="rounded-xl p-5 border border-white/10 block hover:border-white/30 transition-colors bg-card">
                <h3 className="text-lg font-bold text-white">Servicios y precios</h3>
                <p className="text-sm mt-1 text-muted">Configura tus precios</p>
              </Link>
              <Link to="/artist/media" className="rounded-xl p-5 border border-white/10 block hover:border-white/30 transition-colors bg-card">
                <h3 className="text-lg font-bold text-white">Multimedia</h3>
                <p className="text-sm mt-1 text-muted">Subir fotos, audio, video</p>
              </Link>
            </div>
          </section>
        </div>

        {/* Right panel */}
        <aside className="w-72 shrink-0 space-y-4 hidden xl:block">
          <div
            className="rounded-xl p-5 text-white"
            style={{ background: 'linear-gradient(135deg, var(--color-accent), #0891b2)' }}
          >
            <h3 className="text-sm font-medium opacity-90">My balance</h3>
            <p className="text-2xl font-bold mt-1">$ 285,410.12</p>
            <button type="button" className="mt-3 px-4 py-2 rounded-lg border border-white/80 text-sm font-medium hover:bg-white/10">
              Retirar →
            </button>
          </div>
          <div className="rounded-xl p-5 border border-white/10 bg-card">
            <h3 className="text-lg font-bold text-white mb-3">Próximo Show</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center text-2xl">🎤</div>
              <div>
                <p className="font-semibold text-white">ANDRÉS MORA</p>
                <p className="text-muted text-sm">25 Junio • Quito</p>
              </div>
            </div>
            <Link to="/artist" className="block w-full text-center py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15">
              Ver Detalles
            </Link>
          </div>
        </aside>
    </>
  );
}
