import { Link } from 'react-router-dom';

export function TermsContractPage() {
  return (
    <div className="min-h-screen bg-[#07090b] text-neutral-100">
      <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <Link
          to="/"
          className="text-sm font-medium text-[#00d4c8] transition-colors hover:text-[#00ece0]"
        >
          ← Volver al inicio
        </Link>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Términos del contrato
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-neutral-400 md:text-base">
          Esta sección explica, en lenguaje claro, qué sucede cuando una de las partes firma un
          contrato de reserva dentro de la plataforma.
        </p>

        <section className="mt-8 space-y-5 text-sm leading-relaxed text-neutral-300 md:text-base">
          <div>
            <h2 className="text-lg font-semibold text-white md:text-xl">1. Aceptación y validez</h2>
            <p className="mt-2">
              Al firmar electrónicamente, confirmas que has revisado los datos del servicio,
              fechas, ubicación y valor total. La firma queda registrada como evidencia del acuerdo.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white md:text-xl">2. Compromiso de las partes</h2>
            <p className="mt-2">
              La firma del cliente representa su intención de contratar bajo las condiciones
              mostradas. La confirmación final depende de la firma y aceptación del artista.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white md:text-xl">3. Cambios o cancelaciones</h2>
            <p className="mt-2">
              Cualquier cambio posterior (fecha, alcance, precio o cancelación) debe acordarse entre
              las partes y quedar documentado para evitar inconsistencias.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white md:text-xl">4. Responsabilidad de la información</h2>
            <p className="mt-2">
              Es responsabilidad de cada parte validar que los datos ingresados antes de firmar sean
              correctos. Firmar con información errónea puede afectar la ejecución del servicio.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white md:text-xl">5. Alcance legal</h2>
            <p className="mt-2">
              La firma electrónica en la plataforma se considera una manifestación de voluntad para
              reservar y ejecutar el servicio según lo acordado en el contrato.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
