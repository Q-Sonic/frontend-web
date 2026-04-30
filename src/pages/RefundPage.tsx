import React from 'react';
import { Link } from 'react-router-dom';

export function RefundPage() {
  return (
    <div className="min-h-screen bg-[#07090b] text-neutral-100 font-inter">
      <div className="mx-auto max-w-3xl px-5 py-12 md:py-20">
        <Link
          to="/"
          className="text-sm font-medium text-[#00d4c8] transition-colors hover:text-[#00ece0] flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Volver al inicio
        </Link>
        
        <header className="mt-10 border-b border-white/10 pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Política de Devolución y Cancelación
          </h1>
          <p className="mt-4 text-neutral-400">
            Última actualización: 26 de Abril, 2026
          </p>
        </header>

        <div className="mt-10 space-y-10 text-neutral-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Cancelaciones por el Cliente</h2>
            <p>
              Las cancelaciones realizadas por el cliente están sujetas a las condiciones pactadas en el contrato de prestación de servicios. Por lo general:
            </p>
            <ul className="list-disc ml-6 mt-4 space-y-2">
              <li>Cancelaciones con más de 30 días de antelación: Devolución del 100% del depósito (menos comisiones administrativas).</li>
              <li>Cancelaciones entre 15 y 30 días: Devolución del 50% del depósito.</li>
              <li>Cancelaciones con menos de 15 días: No se realizará devolución del depósito inicial.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Cancelaciones por el Artista</h2>
            <p>
              En caso de que el artista no pueda presentarse por causas de fuerza mayor, se procederá a la devolución total de los importes pagados por el cliente a través de la plataforma en un plazo de 5 a 10 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Proceso de Reembolso</h2>
            <p>
              Todos los reembolsos se procesarán a través del mismo método de pago utilizado para la transacción original. El tiempo que tarda el dinero en aparecer en su cuenta depende de las políticas de su entidad bancaria y de la pasarela de pago (Nuvei/Paymentez).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Disputas</h2>
            <p>
              Stage Go actúa como mediador en caso de disputas relacionadas con la calidad del servicio o incumplimientos parciales. Cualquier reclamación debe ser presentada en un plazo máximo de 48 horas después del evento.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-[#00d4c8] mb-2 text-center">Asistencia en Pagos</h2>
            <p className="text-sm text-center">
              Si tiene problemas con un pago o requiere un reembolso, contáctenos inmediatamente a través de nuestro soporte técnico.
            </p>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-white/10 text-center">
          <p className="text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} Stage Go. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
