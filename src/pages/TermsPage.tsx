import { Link } from 'react-router-dom';

export function TermsPage() {
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
            Términos y Condiciones
          </h1>
          <p className="mt-4 text-neutral-400">
            Última actualización: 26 de Abril, 2026
          </p>
        </header>

        <div className="mt-10 space-y-10 text-neutral-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar la plataforma Stage Go, usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Descripción del Servicio</h2>
            <p>
              Stage Go es un ecosistema digital que conecta artistas con clientes para la reserva de presentaciones en vivo, gestión de contratos y pagos seguros. Nosotros actuamos como intermediarios facilitando la conexión y las herramientas de gestión.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Registro de Cuenta</h2>
            <p>
              Para utilizar ciertas funciones, debe registrarse y crear una cuenta. Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades que ocurran bajo su cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Contratos y Reservas</h2>
            <p>
              Las reservas realizadas a través de Stage Go generan un compromiso contractual entre el Artista y el Cliente. Stage Go proporciona plantillas de contratos para facilitar este proceso, pero la ejecución de las condiciones es responsabilidad de las partes involucradas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Pagos y Cancelaciones</h2>
            <p>
              Los pagos se procesan a través de pasarelas seguras. Las políticas de cancelación y reembolso están sujetas a lo estipulado en el contrato específico de cada servicio y a las normativas vigentes en la región del evento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Propiedad Intelectual</h2>
            <p>
              Todo el contenido, marcas y tecnología de la plataforma son propiedad de Stage Go o sus licenciantes. Los artistas mantienen los derechos sobre su contenido multimedia cargado, otorgando a Stage Go una licencia para mostrarlo con fines promocionales.
            </p>
          </section>

          <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-[#00d4c8] mb-2 text-center">Contacto de Soporte</h2>
            <p className="text-sm text-center">
              Si tiene dudas sobre estos términos, puede contactarnos a través de nuestro soporte oficial por WhatsApp.
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
