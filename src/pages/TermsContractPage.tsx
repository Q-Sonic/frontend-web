import { Link } from 'react-router-dom';

export function TermsContractPage() {
  const sectionClass = 'rounded-2xl border border-white/10 bg-white/3 p-6';
  const sectionTitleClass = 'mb-3 text-lg font-semibold text-white';
  const pClass = 'text-sm leading-relaxed text-neutral-300';
  const listClass = 'mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-300';

  return (
    <div className="min-h-screen bg-[#07090b] text-neutral-100">
      <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <Link
          to="/"
          className="text-sm font-medium text-[#00d4c8] transition-colors hover:text-[#00ece0]"
        >
          ← Volver al inicio
        </Link>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Condiciones mínimas obligatorias para contratos entre clientes y artistas
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-neutral-400 md:text-base">
          Documento base de Stage Go para revisión legal. Establece los requisitos mínimos que debe
          cumplir cualquier contrato artístico subido por un artista para ser firmado por un cliente
          dentro de la plataforma.
        </p>

        <div className="mt-8 space-y-6">
          <section className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-6">
            <h2 className="mb-3 text-lg font-semibold text-amber-200">Cláusulas reforzadas de protección Stage Go</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-amber-100/90">
              <li>Stage Go no presta el servicio artístico; solo intermedia tecnológicamente.</li>
              <li>El artista es el prestador real y principal responsable de cumplimiento.</li>
              <li>El cliente debe leer y aceptar el contrato antes de firmar y pagar.</li>
              <li>Pagos de contrataciones nacidas en Stage Go deben realizarse dentro de la plataforma.</li>
              <li>Stage Go puede retener, liberar o devolver fondos según sus políticas y evidencia.</li>
              <li>Disputas del servicio son principalmente entre cliente y artista.</li>
              <li>Permisos, licencias, impuestos, logística y requisitos legales son de las partes.</li>
              <li>Stage Go puede bloquear cuentas, contratos o pagos ante riesgo, fraude o incumplimiento.</li>
              <li>Cliente y artista deben mantener indemne a Stage Go frente a reclamaciones de su contrato.</li>
              <li>La firma digital equivale a aceptación expresa y vinculante del contrato aplicable.</li>
            </ol>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>1. Introducción</h2>
            <p className={pClass}>
              Stage Go es una plataforma digital que conecta clientes con artistas, músicos, bandas,
              grupos musicales, DJs, animadores y otros talentos para eventos en vivo. El presente
              documento define las condiciones mínimas obligatorias que deben cumplir los contratos
              subidos por artistas para su firma dentro de la plataforma.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>2. Naturaleza del contrato artístico</h2>
            <p className={pClass}>
              El contrato de prestación artística se celebra de forma directa entre el cliente y el
              artista. Ambas partes son responsables de negociar, aceptar y cumplir las condiciones
              pactadas para cada evento.
            </p>
            <p className={`${pClass} mt-2`}>
              En consecuencia, la obligación principal de resultado o de ejecución del servicio recae
              exclusivamente en el artista frente al cliente, y no en Stage Go.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>3. Rol limitado de Stage Go</h2>
            <p className={pClass}>
              Stage Go no es parte del contrato artístico, no actúa como representante legal del
              artista, no es empleador, productor u organizador del evento, ni garante del
              cumplimiento artístico. Stage Go actúa únicamente como intermediario tecnológico,
              marketplace y canal de gestión de reservas, comunicación y pagos.
            </p>
            <p className={`${pClass} mt-2`}>
              Stage Go no reemplaza asesoría legal, arbitraje ni representación de ninguna parte. Su
              intervención en reclamaciones se limita a la administración operativa de la plataforma y
              del flujo de pagos conforme a sus políticas internas.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>4. Requisitos mínimos del contrato subido por el artista</h2>
            <ul className={listClass}>
              <li>Redacción clara, completa y legalmente válida según ley aplicable.</li>
              <li>Cláusulas específicas de obligaciones, pagos, cancelaciones e incumplimientos.</li>
              <li>Condiciones técnicas, logísticas y operativas del evento.</li>
              <li>Mecanismo de firma digital o aceptación electrónica dentro de Stage Go.</li>
              <li>No contener cláusulas abusivas, ilícitas, ambiguas o engañosas.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>5. Identificación de las partes</h2>
            <p className={pClass}>
              Todo contrato deberá identificar claramente al artista y al cliente, incluyendo nombre
              legal o comercial, documento de identidad o identificación fiscal, y datos de contacto.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>6. Datos obligatorios del evento</h2>
            <ul className={listClass}>
              <li>Descripción del evento y tipo de servicio contratado.</li>
              <li>Fecha, hora de inicio y hora estimada de finalización.</li>
              <li>Lugar exacto, ciudad y país.</li>
              <li>Duración de la presentación.</li>
              <li>Precio total y condiciones económicas aplicables.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>7. Descripción del servicio artístico</h2>
            <p className={pClass}>
              El contrato debe especificar el alcance del servicio (por ejemplo: show en vivo, set de
              DJ, animación, repertorio base, número de integrantes, pausas, pruebas de sonido y demás
              aspectos relevantes).
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>8. Fecha, hora y lugar del evento</h2>
            <p className={pClass}>
              Debe incluirse información precisa y verificable para evitar dudas sobre cumplimiento,
              llegada, montaje y ejecución del servicio.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>9. Duración de la presentación</h2>
            <p className={pClass}>
              El contrato debe establecer duración mínima, pausas y criterio para considerar cumplido
              el servicio artístico.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>10. Precio del servicio</h2>
            <p className={pClass}>
              Debe indicarse monto total, moneda, conceptos incluidos/excluidos y cualquier condición
              económica adicional.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>11. Forma de pago a través de Stage Go</h2>
            <p className={pClass}>
              El contrato debe indicar expresamente que el pago de contrataciones originadas en Stage Go
              se realiza dentro de la plataforma, salvo autorización expresa y escrita de Stage Go.
            </p>
            <p className={`${pClass} mt-2`}>
              Cualquier desvío de pago, anticipo o compensación por fuera de Stage Go podrá implicar la
              pérdida de cobertura operativa, suspensión de cuenta y restricciones de uso.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>12. Retención y liberación del pago</h2>
            <p className={pClass}>
              El pago del cliente podrá ser retenido temporalmente por Stage Go y liberado al artista
              conforme a los Términos y Condiciones de la plataforma, incluyendo confirmación de
              cumplimiento o ausencia de reclamación válida en el plazo establecido.
            </p>
            <ul className={listClass}>
              <li>Retención inicial del pago hasta verificación de ejecución del evento.</li>
              <li>Liberación al artista cuando se confirme cumplimiento o no exista disputa válida.</li>
              <li>Retención extendida en caso de reclamación, evidencia insuficiente o riesgo de fraude.</li>
              <li>Devolución total o parcial al cliente cuando corresponda por incumplimiento comprobado.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>13. Obligaciones del artista</h2>
            <ul className={listClass}>
              <li>Asistir y ejecutar el servicio según lo pactado.</li>
              <li>Cumplir horarios, calidad profesional y condiciones ofrecidas.</li>
              <li>Informar requerimientos técnicos y logísticos reales.</li>
              <li>Cumplir normativa fiscal, laboral y legal aplicable.</li>
              <li>No ofrecer términos engañosos ni condiciones imposibles de ejecutar.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>14. Obligaciones del cliente</h2>
            <ul className={listClass}>
              <li>Proveer condiciones para ejecución del servicio contratado.</li>
              <li>Facilitar accesos, horarios y entorno seguro.</li>
              <li>Cumplir pagos, permisos y obligaciones a su cargo.</li>
              <li>Revisar y aceptar el contrato antes de firmar.</li>
              <li>Verificar cláusulas de cancelación, penalidades y condiciones de reembolso antes de pagar.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>15. Requisitos técnicos y logísticos</h2>
            <p className={pClass}>
              Deben detallarse requerimientos técnicos mínimos de audio, escenario, iluminación, energía
              y personal de apoyo, así como responsabilidades de cada parte.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>16. Rider técnico, sonido, escenario e iluminación</h2>
            <p className={pClass}>
              Si aplica, el contrato debe incorporar rider técnico actualizado y asignar claramente al
              responsable del sonido, escenario e iluminación.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>17. Transporte, hospedaje y alimentación, si aplica</h2>
            <p className={pClass}>
              Estas condiciones deben estar expresamente pactadas: alcance, calidad mínima, costos y
              parte responsable.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>18. Permisos, licencias y autorizaciones</h2>
            <p className={pClass}>
              El contrato debe definir qué parte asume permisos, licencias, autorizaciones públicas y
              demás requisitos regulatorios del evento.
            </p>
            <p className={`${pClass} mt-2`}>
              Stage Go no asume responsabilidad por falta de permisos, incumplimientos tributarios,
              licencias musicales, obligaciones de seguridad o requisitos regulatorios del evento.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>19. Derechos de autor y uso de música</h2>
            <p className={pClass}>
              Cliente y artista son responsables de cumplir obligaciones sobre derechos de autor, uso de
              repertorio y licencias correspondientes.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>20. Uso de imagen, fotos y videos</h2>
            <p className={pClass}>
              Debe regularse autorización, alcance, finalidad y límites de uso de imagen de artista,
              cliente, asistentes y material del evento.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>21. Cancelaciones del artista</h2>
            <p className={pClass}>
              Deben establecerse causas, plazos, notificación y consecuencias económicas por cancelación
              imputable al artista.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>22. Cancelaciones del cliente</h2>
            <p className={pClass}>
              Deben incluirse reglas de cancelación por parte del cliente, posibles penalidades, gastos
              no reembolsables y condiciones de devolución.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>23. Cambios de fecha o lugar</h2>
            <p className={pClass}>
              Debe regularse procedimiento para cambios, plazos mínimos, aceptación por la otra parte y
              ajustes económicos que pudieran aplicar.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>24. Inasistencia del artista</h2>
            <p className={pClass}>
              Debe preverse expresamente qué ocurre si el artista no asiste al evento, incluyendo
              reembolsos, penalidades y soporte por parte de Stage Go según sus políticas.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>25. Llegada tarde o cumplimiento parcial</h2>
            <p className={pClass}>
              El contrato debe definir tolerancias, criterio de cumplimiento parcial y eventuales
              ajustes de pago o compensaciones.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>26. Fuerza mayor o caso fortuito</h2>
            <p className={pClass}>
              Debe incorporarse cláusula para eventos imprevisibles e inevitables, indicando suspensión,
              reprogramación, terminación y efectos económicos.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>27. Daños, pérdidas o incidentes durante el evento</h2>
            <p className={pClass}>
              Debe asignarse responsabilidad por daños materiales, lesiones, pérdidas económicas y
              contingencias derivadas del evento conforme a ley aplicable.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>28. Penalidades o consecuencias por incumplimiento</h2>
            <p className={pClass}>
              El contrato debe describir consecuencias por incumplimiento total o parcial de cualquier
              obligación principal.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>29. Disputas entre cliente y artista</h2>
            <p className={pClass}>
              Toda disputa contractual derivada del servicio artístico corresponde principalmente al
              cliente y al artista como partes del contrato.
            </p>
            <ul className={listClass}>
              <li>Las partes deben aportar evidencia suficiente y verificable dentro del plazo pactado.</li>
              <li>La falta de respuesta o evidencia puede afectar el resultado de la revisión.</li>
              <li>Stage Go podrá cerrar el caso según la evidencia disponible y sus políticas.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>30. Participación limitada de Stage Go en reclamaciones</h2>
            <p className={pClass}>
              Stage Go puede actuar como canal de soporte, recepción de evidencia y revisión operativa
              de pagos, pero no actúa como juez, árbitro, abogado ni representante de las partes.
            </p>
            <p className={`${pClass} mt-2`}>
              Cualquier decisión interna de Stage Go sobre fondos no sustituye el derecho de las partes
              a ejercer acciones legales ante la jurisdicción competente.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>31. Exclusión de responsabilidad de Stage Go</h2>
            <p className={pClass}>
              Stage Go no asume responsabilidad por cláusulas, obligaciones o incumplimientos acordados
              directamente entre artista y cliente, salvo lo relativo al funcionamiento básico de la
              plataforma y la gestión del pago bajo sus propios Términos y Condiciones.
            </p>
            <p className={`${pClass} mt-2`}>
              En ningún caso Stage Go responderá por lucro cesante, pérdida de oportunidad, daño
              reputacional, daños indirectos o consecuencias derivadas de decisiones de cliente o
              artista fuera del control razonable de la plataforma.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>32. Indemnidad a favor de Stage Go</h2>
            <p className={pClass}>
              Cliente y artista aceptan mantener indemne a Stage Go frente a reclamaciones, demandas,
              pérdidas, daños, costos o sanciones derivados del contrato artístico o su ejecución.
            </p>
            <p className={`${pClass} mt-2`}>
              Esta obligación incluye costos de defensa legal razonables, gastos judiciales y multas
              administrativas asociadas a actos u omisiones de cliente o artista.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>33. Prohibición de pagos externos</h2>
            <p className={pClass}>
              Para contrataciones originadas en Stage Go, se prohíben pagos por fuera de la plataforma
              sin autorización expresa de Stage Go. El incumplimiento podrá conllevar sanciones de
              cuenta y pérdida de cobertura de soporte.
            </p>
            <p className={`${pClass} mt-2`}>
              Esta prohibición aplica a pagos directos, anticipos, depósitos, transferencias o acuerdos
              paralelos que busquen evadir comisiones o controles de seguridad de Stage Go.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>34. Firma digital y aceptación del contrato</h2>
            <p className={pClass}>
              El contrato debe incluir cláusula de aceptación digital, estableciendo que el cliente
              acepta al firmar electrónicamente, marcar casilla de aceptación, confirmar contratación o
              realizar el pago dentro de Stage Go.
            </p>
            <p className={`${pClass} mt-2`}>
              La aceptación digital tendrá la misma validez probatoria que una firma electrónica
              conforme a la normativa aplicable, salvo disposición imperativa en contrario.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>35. Conservación de evidencia y comunicaciones</h2>
            <p className={pClass}>
              Las partes deben conservar comunicaciones, comprobantes, archivos, contratos y evidencias
              relevantes. Stage Go podrá conservar registros técnicos de actividad conforme a su política
              de privacidad y obligaciones legales.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>36. Ley aplicable y jurisdicción</h2>
            <p className={pClass}>
              El contrato artístico debe indicar ley aplicable y jurisdicción competente para resolver
              controversias entre cliente y artista.
            </p>
          </section>

          <section className="rounded-2xl border border-[#00d4c8]/30 bg-[#00d4c8]/10 p-6">
            <h2 className="mb-3 text-lg font-semibold text-[#8efff7]">37. Declaración final de aceptación</h2>
            <p className="text-sm leading-relaxed text-neutral-200">
              Al firmar digitalmente en Stage Go, las partes declaran que leyeron, comprendieron y
              aceptaron el contrato artístico específico celebrado entre cliente y artista, así como
              estas condiciones mínimas obligatorias.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-200">
              Asimismo, reconocen expresamente que Stage Go es un intermediario tecnológico y que la
              relación contractual principal y sus efectos jurídicos recaen entre cliente y artista.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/4 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Plantilla base de contrato (editable por el artista)
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-neutral-300">
              <p><strong>Contrato de prestación de servicios artísticos</strong></p>
              <p>
                Entre, por una parte, <strong>[Nombre del artista o grupo]</strong> (en adelante, el
                “Artista”) y, por otra parte, <strong>[Nombre legal del cliente]</strong>, identificado
                con <strong>[Documento de identidad o identificación fiscal]</strong> (en adelante, el
                “Cliente”), se celebra el presente contrato de prestación de servicios artísticos.
              </p>
              <p><strong>1. Datos del evento</strong></p>
              <ul className={listClass}>
                <li>Fecha del evento: [Fecha del evento]</li>
                <li>Hora de inicio: [Hora de inicio]</li>
                <li>Hora de finalización: [Hora de finalización]</li>
                <li>Lugar del evento: [Lugar del evento]</li>
                <li>Ciudad y país: [Ciudad y país]</li>
              </ul>
              <p><strong>2. Servicio contratado</strong></p>
              <ul className={listClass}>
                <li>Descripción del servicio artístico: [Descripción del servicio artístico]</li>
                <li>Duración de la presentación: [Duración de la presentación]</li>
                <li>Requisitos técnicos: [Requisitos técnicos]</li>
              </ul>
              <p><strong>3. Precio y pago</strong></p>
              <ul className={listClass}>
                <li>Precio total: [Precio total]</li>
                <li>Comisión o cargos de plataforma, si aplica: [Comisión o cargos de plataforma, si aplica]</li>
                <li>
                  El pago se realizará dentro de Stage Go. La liberación de fondos al Artista estará
                  sujeta a las políticas de retención, validación y reclamaciones de Stage Go.
                </li>
                <li>Se prohíben pagos por fuera de Stage Go sin autorización expresa y escrita.</li>
              </ul>
              <p><strong>4. Condiciones de cancelación y reembolso</strong></p>
              <ul className={listClass}>
                <li>Condiciones de cancelación: [Condiciones de cancelación]</li>
                <li>Condiciones de reembolso: [Condiciones de reembolso]</li>
                <li>Plazo para reclamaciones: [Plazo para reclamaciones]</li>
              </ul>
              <p><strong>5. Responsabilidades técnicas y logísticas</strong></p>
              <ul className={listClass}>
                <li>Responsable del sonido: [Responsable del sonido]</li>
                <li>Responsable del escenario: [Responsable del escenario]</li>
                <li>Responsable de permisos: [Responsable de permisos]</li>
                <li>Condiciones de transporte: [Condiciones de transporte]</li>
                <li>Condiciones de hospedaje: [Condiciones de hospedaje]</li>
                <li>Condiciones de alimentación: [Condiciones de alimentación]</li>
              </ul>
              <p><strong>6. Cláusulas obligatorias de cumplimiento</strong></p>
              <ul className={listClass}>
                <li>Reglas por inasistencia del artista.</li>
                <li>Reglas por llegada tarde o cumplimiento parcial.</li>
                <li>Reglas por cambio de fecha o lugar.</li>
                <li>Reglas por fuerza mayor o caso fortuito.</li>
                <li>Penalidades por incumplimiento.</li>
              </ul>
              <p><strong>7. Disputas y rol de Stage Go</strong></p>
              <p>
                Toda disputa contractual será principalmente entre Cliente y Artista. Stage Go podrá
                servir como canal de soporte y revisión de evidencias, sin convertirse en juez, árbitro
                o representante legal de las partes.
              </p>
              <p><strong>8. Exclusión de responsabilidad e indemnidad de Stage Go</strong></p>
              <p>
                Las partes reconocen que Stage Go no es parte del contrato artístico y aceptan mantener
                indemne a Stage Go frente a reclamaciones derivadas del presente acuerdo.
              </p>
              <p>
                Stage Go no responde por incumplimientos artísticos, permisos, impuestos, logística,
                seguridad, derechos de autor, daños o pérdidas derivados de este contrato entre las partes.
              </p>
              <p><strong>9. Prohibición de pagos externos</strong></p>
              <p>
                Se prohíben pagos por fuera de Stage Go en contrataciones originadas dentro de la
                plataforma, salvo autorización expresa de Stage Go.
              </p>
              <p><strong>10. Firma digital y aceptación</strong></p>
              <p>
                El Cliente acepta este contrato al firmar digitalmente, marcar casilla de aceptación,
                confirmar contratación o realizar el pago dentro de Stage Go.
              </p>
              <p><strong>11. Soporte y jurisdicción</strong></p>
              <ul className={listClass}>
                <li>Correo de soporte de Stage Go: [Correo de soporte de Stage Go]</li>
                <li>Jurisdicción aplicable: [Jurisdicción aplicable]</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
