import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07090b] text-neutral-100">
      <div className="mx-auto max-w-2xl px-5 py-12 md:py-16">
        <Link
          to="/"
          className="text-sm font-medium text-[#00d4c8] transition-colors hover:text-[#00ece0]"
        >
          ← Volver al inicio
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Términos y condiciones
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-neutral-400">
          El contenido legal de esta sección se publicará aquí próximamente.
        </p>
      </div>
    </div>
  );
}
