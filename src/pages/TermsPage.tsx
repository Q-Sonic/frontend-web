import { Link } from 'react-router-dom';

export function TermsPage() {
  const sectionClass = 'rounded-2xl border border-white/10 bg-white/3 p-6';
  const sectionTitleClass = 'mb-3 text-lg font-semibold text-white';
  const pClass = 'text-sm leading-relaxed text-neutral-300';
  const listClass = 'mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-300';

  return (
    <div className="min-h-screen bg-[#07090b] text-neutral-100">
      <div className="mx-auto max-w-5xl px-5 py-12 md:py-20">
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
            Última actualización: [Fecha de última actualización]
          </p>
        </header>

        <div className="mt-10 space-y-6">
          <section className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-6">
            <h2 className="mb-3 text-lg font-semibold text-amber-200">Resumen legal reforzado para usuarios</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-amber-100/90">
              <li>Stage Go es un intermediario tecnológico; no es el prestador artístico.</li>
              <li>La relación contractual principal existe entre cliente y artista.</li>
              <li>Los pagos de contrataciones nacidas en Stage Go deben realizarse dentro de la plataforma.</li>
              <li>Stage Go puede retener, liberar o devolver fondos según evidencia y políticas aplicables.</li>
              <li>Disputas del servicio artístico corresponden principalmente a cliente y artista.</li>
              <li>Cliente y artista asumen permisos, licencias, impuestos, logística y seguridad del evento.</li>
              <li>Stage Go puede suspender cuentas, bloquear pagos y rechazar operaciones sospechosas.</li>
              <li>El uso de Stage Go implica aceptación expresa de estos términos y políticas relacionadas.</li>
            </ol>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>1. Introducción</h2>
            <p className={pClass}>
              Estos Términos y Condiciones regulan el acceso, registro y uso de la plataforma digital Stage Go,
              operada por [Nombre legal de la empresa], con domicilio y operación principal en [País o jurisdicción].
              Stage Go conecta clientes con artistas para la contratación de servicios artísticos y facilita herramientas
              de reserva, comunicación, pago y soporte.
            </p>
            <p className={`${pClass} mt-2`}>
              Este documento constituye una versión inicial para revisión legal y debe leerse junto con la Política de
              Privacidad y demás políticas publicadas en la plataforma.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>2. Definiciones</h2>
            <ul className={listClass}>
              <li><strong>Plataforma:</strong> Sitio web, aplicaciones y herramientas de Stage Go.</li>
              <li><strong>Usuario:</strong> Toda persona que accede, navega o utiliza la plataforma.</li>
              <li><strong>Cliente:</strong> Usuario que solicita o contrata servicios artísticos.</li>
              <li><strong>Artista:</strong> Persona o grupo que ofrece servicios artísticos en la plataforma.</li>
              <li><strong>Reserva/Contratación:</strong> Solicitud y aceptación de un servicio artístico.</li>
              <li><strong>Evento:</strong> Actividad para la que se contrata el servicio artístico.</li>
              <li><strong>Fondos retenidos:</strong> Dinero pagado por el cliente y retenido temporalmente por Stage Go.</li>
              <li><strong>Disputa:</strong> Reclamación sobre incumplimiento, calidad, asistencia o condiciones del servicio.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>3. Objeto de la plataforma</h2>
            <p className={pClass}>
              Stage Go tiene por objeto actuar como intermediario tecnológico para facilitar la conexión entre clientes y
              artistas, la coordinación de reservas y la gestión de pagos vinculados a contrataciones realizadas dentro de
              la plataforma.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>4. Naturaleza de Stage Go como intermediario tecnológico</h2>
            <p className={pClass}>
              Stage Go no es el artista, no es el organizador del evento, no es representante legal de cliente ni artista,
              ni forma parte sustancial del contrato artístico específico entre ambos, salvo en su rol de intermediación
              tecnológica y administración del flujo de pago dentro de la plataforma.
            </p>
            <p className={`${pClass} mt-2`}>
              Stage Go puede facilitar herramientas de comunicación, pagos, reservas y resolución de disputas, pero no
              reemplaza la responsabilidad contractual directa entre cliente y artista.
            </p>
            <p className={`${pClass} mt-2`}>
              Stage Go no actúa como abogado, árbitro, representante ni garante del desempeño artístico; su rol se limita
              a la operación técnica de la plataforma y a la gestión del flujo de pagos conforme a sus políticas.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>5. Registro de usuarios</h2>
            <ul className={listClass}>
              <li>Para usar funcionalidades transaccionales, el usuario debe crear una cuenta válida.</li>
              <li>Los usuarios deben ser mayores de edad o tener capacidad legal para contratar.</li>
              <li>El usuario garantiza que la información proporcionada es veraz, completa y actualizada.</li>
              <li>El usuario es responsable de la seguridad de sus credenciales y de toda actividad en su cuenta.</li>
              <li>Stage Go podrá requerir validaciones adicionales de identidad y documentación.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>6. Perfil de artistas</h2>
            <p className={pClass}>
              El artista puede crear y administrar su perfil, incluyendo disponibilidad, precios, condiciones del servicio,
              ubicación, material multimedia, experiencia, tipo de presentación y demás información relevante.
            </p>
            <p className={`${pClass} mt-2`}>
              El artista es responsable exclusivo del contenido publicado y de su exactitud. Stage Go podrá moderar,
              ocultar o eliminar contenido que incumpla estos términos o normas aplicables.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>7. Obligaciones de los artistas</h2>
            <ul className={listClass}>
              <li>Cumplir las condiciones ofrecidas y aceptadas en cada contratación.</li>
              <li>Asistir al evento en fecha, hora y lugar acordados.</li>
              <li>Informar requerimientos técnicos y logísticos de forma clara y oportuna.</li>
              <li>Emitir información veraz sobre experiencia, repertorio y capacidades.</li>
              <li>Cumplir obligaciones legales, fiscales, laborales y de propiedad intelectual aplicables.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>8. Obligaciones de los clientes</h2>
            <ul className={listClass}>
              <li>Pagar en tiempo y forma los importes aplicables a través de Stage Go.</li>
              <li>Brindar información correcta sobre el evento, lugar, horarios y condiciones.</li>
              <li>Gestionar permisos, seguridad y logística bajo su responsabilidad cuando corresponda.</li>
              <li>Respetar los términos acordados con el artista y actuar de buena fe.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>9. Proceso de contratación</h2>
            <p className={pClass}>
              La contratación se inicia cuando el cliente selecciona un artista y envía/acepta una reserva dentro de la
              plataforma. Las condiciones particulares del servicio pueden incluir rider técnico, horarios, alcance,
              requisitos logísticos y políticas específicas acordadas entre cliente y artista.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>10. Pagos dentro de la plataforma</h2>
            <p className={pClass}>
              Todo pago asociado a reservas protegidas debe realizarse dentro de Stage Go. Los pagos efectuados fuera de
              la plataforma quedan fuera de protección, soporte, retención y procesos de reclamación de Stage Go.
            </p>
            <p className={`${pClass} mt-2`}>
              La realización de pagos externos, directos o paralelos, podrá implicar suspensión de cuenta, pérdida de
              cobertura operativa y demás medidas previstas en estos términos.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>11. Retención temporal de fondos</h2>
            <p className={pClass}>
              El dinero pagado por el cliente se retiene temporalmente hasta la verificación de cumplimiento del evento o
              hasta que finalice el proceso de revisión en caso de disputa.
            </p>
            <ul className={listClass}>
              <li>Retención inicial hasta confirmación de cumplimiento.</li>
              <li>Retención extendida cuando exista reclamación o riesgo de fraude.</li>
              <li>Liberación o devolución según evidencia disponible y políticas de Stage Go.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>12. Liberación del pago al artista</h2>
            <p className={pClass}>
              Una vez confirmado el cumplimiento del servicio, Stage Go liberará el pago al artista en un plazo estimado
              de [Plazo de liberación del pago], descontando comisiones, tarifas de servicio, costos de procesamiento y
              otros cargos informados al usuario.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>13. Reembolsos al cliente</h2>
            <p className={pClass}>
              Cuando corresponda conforme a estas políticas o por decisión del proceso de disputa, Stage Go gestionará el
              reembolso al cliente en un plazo estimado de [Plazo de reembolso], sujeto a validaciones operativas y del
              medio de pago.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>14. Cancelaciones por parte del artista</h2>
            <p className={pClass}>
              Si el artista cancela sin causa justificada o incumple gravemente, Stage Go podrá devolver total o
              parcialmente los fondos al cliente, aplicar restricciones al artista y tomar medidas disciplinarias.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>15. Cancelaciones por parte del cliente</h2>
            <p className={pClass}>
              Las cancelaciones del cliente podrán generar cargos, penalidades o retenciones según la anticipación,
              condiciones del servicio contratado y políticas específicas aplicables.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>16. Inasistencia del artista</h2>
            <p className={pClass}>
              La inasistencia comprobada del artista puede dar lugar a reembolso al cliente y a medidas de suspensión o
              eliminación de cuenta del artista, según la gravedad y recurrencia.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>17. Disputas entre cliente y artista</h2>
            <p className={pClass}>
              En caso de conflicto, Stage Go podrá intervenir como tercero administrador del proceso de disputa y decidir,
              con base en evidencia, si libera, retiene temporalmente o devuelve fondos.
            </p>
            <p className={`${pClass} mt-2`}>
              Las partes aceptan colaborar de buena fe, aportar evidencia dentro de plazo y reconocer que la revisión de
              Stage Go es de naturaleza operativa y no sustituye acciones judiciales entre cliente y artista.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>18. Evidencias y proceso de revisión</h2>
            <p className={pClass}>
              Cliente y artista deberán presentar evidencias dentro del plazo de [Plazo para presentar reclamaciones].
              Stage Go podrá solicitar comunicaciones, comprobantes, material audiovisual, contratos, historial de pago y
              cualquier información adicional necesaria para resolver.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>19. Comisiones y tarifas de Stage Go</h2>
            <p className={pClass}>
              Stage Go podrá cobrar comisiones y tarifas de intermediación, servicio u operación. La comisión de
              referencia podrá ser de [Porcentaje de comisión], sin perjuicio de ajustes informados al usuario antes de la
              confirmación de cada operación.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>20. Impuestos</h2>
            <p className={pClass}>
              Cada usuario es responsable de sus obligaciones fiscales y tributarias derivadas de su actividad. Stage Go
              podrá efectuar retenciones o reportes cuando la normativa aplicable lo exija.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>21. Contratos externos o contratos subidos por el artista</h2>
            <p className={pClass}>
              Stage Go puede permitir carga o uso de contratos y riders. Su validez, contenido y ejecución corresponde al
              cliente y al artista. Stage Go no garantiza la legalidad o idoneidad de documentos elaborados por usuarios.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>22. Responsabilidad sobre permisos, licencias y autorizaciones</h2>
            <p className={pClass}>
              Cliente y artista son responsables de permisos, licencias, derechos de autor, seguridad, logística,
              transporte, hospedaje, infraestructura técnica, autorizaciones públicas y demás requisitos del evento.
            </p>
            <p className={`${pClass} mt-2`}>
              Stage Go queda excluida de responsabilidad por sanciones, daños o costos derivados de incumplimientos
              regulatorios o contractuales que correspondan al cliente o al artista.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>23. Propiedad intelectual y uso de imagen</h2>
            <p className={pClass}>
              El usuario conserva titularidad sobre sus contenidos, otorgando a Stage Go una licencia no exclusiva para
              alojarlos, reproducirlos y mostrarlos dentro de la plataforma con fines operativos, promocionales y de
              prestación del servicio.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>24. Conductas prohibidas</h2>
            <ul className={listClass}>
              <li>Publicar información falsa, engañosa o suplantar identidad.</li>
              <li>Eludir pagos de Stage Go para cerrar contrataciones fuera de la plataforma.</li>
              <li>Usar la plataforma para actividades ilícitas, abusivas o discriminatorias.</li>
              <li>Manipular reseñas, métricas o procesos de disputa.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>25. Fraude y uso indebido de la plataforma</h2>
            <p className={pClass}>
              Stage Go podrá investigar actividades sospechosas, bloquear pagos, retener fondos, solicitar documentación y
              adoptar medidas preventivas o definitivas ante indicios de fraude o incumplimiento.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>26. Suspensión o eliminación de cuentas</h2>
            <p className={pClass}>
              Stage Go podrá suspender, limitar o eliminar cuentas, temporal o definitivamente, por violaciones a estos
              términos, riesgo operativo, fraude, incumplimiento o requerimiento legal.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>27. Limitación de responsabilidad de Stage Go</h2>
            <p className={pClass}>
              Stage Go no será responsable por incumplimientos directos entre cliente y artista, accidentes, daños
              materiales, lesiones, pérdidas de ingresos, cancelaciones, fallas de logística, sonido, permisos o conflictos
              personales ocurridos en el marco del evento, salvo dolo o culpa grave atribuible legalmente a Stage Go.
            </p>
            <p className={`${pClass} mt-2`}>
              En ningún caso Stage Go responderá por daños indirectos, lucro cesante, pérdida de oportunidad, daño
              reputacional o contingencias fuera de su control razonable.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>28. Exención de garantías</h2>
            <p className={pClass}>
              La plataforma se ofrece “tal cual” y según disponibilidad. Stage Go no garantiza resultados artísticos,
              asistencia de público, continuidad ininterrumpida del servicio ni ausencia absoluta de errores.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>29. Indemnidad a favor de Stage Go</h2>
            <p className={pClass}>
              El usuario acepta mantener indemne a Stage Go, sus directivos, empleados y afiliados frente a reclamaciones,
              sanciones, daños, costos y gastos (incluidos honorarios legales razonables) derivados de su conducta, uso de
              la plataforma o incumplimiento contractual con terceros.
            </p>
            <p className={`${pClass} mt-2`}>
              Esta indemnidad incluye costos de defensa, gastos judiciales y administrativos razonables relacionados con
              reclamaciones originadas en actos u omisiones del usuario.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>30. Soporte al usuario</h2>
            <p className={pClass}>
              El soporte se brinda a través de [Correo de soporte] y canales oficiales definidos por Stage Go. Los tiempos
              de respuesta son estimados y no constituyen garantía de resolución inmediata.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>31. Comunicaciones oficiales</h2>
            <p className={pClass}>
              El usuario acepta recibir notificaciones operativas, legales y comerciales por correo electrónico, mensajes
              dentro de la plataforma u otros medios declarados en su cuenta.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>32. Protección de datos y privacidad</h2>
            <p className={pClass}>
              El tratamiento de datos personales se rige por la Política de Privacidad de Stage Go y por la normativa de
              protección de datos aplicable en [País o jurisdicción].
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>33. Modificaciones de los términos</h2>
            <p className={pClass}>
              Stage Go podrá modificar estos términos en cualquier momento. Las actualizaciones se publicarán en la
              plataforma con su fecha de vigencia y, cuando corresponda, se notificarán por medios oficiales.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>34. Terminación del servicio</h2>
            <p className={pClass}>
              Stage Go puede terminar total o parcialmente el acceso a la plataforma por causas operativas, legales o de
              incumplimiento. Las obligaciones pendientes y disposiciones de responsabilidad subsistirán tras la terminación.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>35. Ley aplicable y jurisdicción</h2>
            <p className={pClass}>
              Estos términos se rigen por las leyes de [País o jurisdicción]. Cualquier controversia se someterá a los
              tribunales competentes de [País o jurisdicción], salvo norma imperativa en contrario.
            </p>
          </section>

          <section className="rounded-2xl border border-[#00d4c8]/30 bg-[#00d4c8]/10 p-6">
            <h2 className="mb-3 text-lg font-semibold text-[#8efff7]">36. Aceptación de los términos</h2>
            <p className="text-sm leading-relaxed text-neutral-200">
              El usuario reconoce y acepta expresamente estos Términos y Condiciones al crear una cuenta, usar la
              plataforma, contratar un artista, aceptar una reserva, subir un contrato o realizar un pago en Stage Go.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-200">
              Si el usuario no está de acuerdo con estos términos, debe abstenerse de utilizar Stage Go.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-200">
              La aceptación digital al registrarse, contratar, aceptar reservas, subir contratos o realizar pagos en Stage
              Go constituye consentimiento expreso y vinculante respecto de estos términos.
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
