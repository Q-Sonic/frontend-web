import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07090b] text-neutral-100">
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
            Políticas de Privacidad
          </h1>
          <p className="mt-4 text-neutral-400">
            Última actualización: 26 de Abril, 2026
          </p>
        </header>

        <div className="mt-10 space-y-10 text-neutral-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Recopilación de Información</h2>
            <p>
              En Stage Go, recopilamos información que usted nos proporciona directamente al crear una cuenta, como su nombre, dirección de correo electrónico, número de teléfono y, en el caso de los artistas, información sobre su carrera y datos bancarios para el procesamiento de pagos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Uso de los Datos</h2>
            <p>
              Utilizamos la información recopilada para facilitar las reservas entre artistas y clientes, procesar pagos de manera segura, enviar notificaciones sobre el estado de sus contratos y mejorar continuamente la experiencia en nuestra plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Intercambio de Información</h2>
            <p>
              No vendemos sus datos personales. Compartimos información con terceros solo cuando es estrictamente necesario, como con pasarelas de pago (Stripe/PayPal) o servicios de infraestructura nube para garantizar el funcionamiento técnico del ecosistema.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Seguridad de la Información</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos contra el acceso no autorizado, la alteración o la destrucción. Toda la comunicación sensible se realiza bajo protocolos de cifrado SSL.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Sus Derechos</h2>
            <p>
              Usted tiene derecho a acceder, corregir o solicitar la eliminación de su información personal en cualquier momento a través de la configuración de su cuenta o contactando a nuestro equipo de soporte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Cookies y Seguimiento</h2>
            <p>
              Utilizamos cookies esenciales para mantener su sesión activa y mejorar la navegación. También podemos utilizar herramientas de análisis anónimas para comprender cómo se utiliza la plataforma y optimizar nuestro rendimiento.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-[#00d4c8] mb-2 text-center">Consultas sobre Privacidad</h2>
            <p className="text-sm text-center">
              Si tiene preguntas sobre cómo tratamos sus datos, puede escribirnos directamente a nuestro canal de soporte por WhatsApp.
            </p>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-white/10 text-center">
          <p className="text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} Stage Go. Su privacidad es nuestra prioridad.
          </p>
        </footer>
      </div>
    </div>
  );
}
