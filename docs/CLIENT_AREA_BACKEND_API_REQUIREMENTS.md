# Especificación API — dominio Cliente (backend)

Documento para **implementación en servidor**: contrato HTTP, persistencia, reglas de negocio y criterios de aceptación. El cliente web consumirá estos endpoints; los **nombres de rutas** pueden ajustarse si se documenta el estándar final (p. ej. todo bajo `/api`).

---

## 1. Contexto de negocio

**Requisito:** cualquier dato de “reservé fechas”, “mis contratos” y “notificaciones” debe vivir en **base de datos**, asociado al **usuario autenticado**. Así, el mismo usuario puede cerrar sesión, usar otro navegador o modo incógnito y seguir viendo la misma información.

**Implicación técnica:** no basta con que el navegador guarde estado local; el backend debe ser la **fuente de verdad** y las respuestas deben filtrarse siempre por el **identificador del cliente** obtenido del token (no confiar en `clientId` arbitrario en el body).

---

## 2. Convenciones transversales

### 2.1 Autenticación y autorización

| Aspecto | Requisito |
|---------|-----------|
| Header | `Authorization: Bearer <Firebase ID Token>` |
| Validación | Verificar JWT con Firebase Admin (o flujo equivalente del proyecto). |
| Identidad | Obtener `uid` del token; ese `uid` es el **cliente** en rutas “mi historial”, “mis notificaciones”, etc. |
| Autorización | Rutas de esta spec aplican a usuarios con rol **cliente** (o el criterio de negocio que definan). Otros roles → `403` si no corresponde. |
| Sin token / token inválido | `401` con cuerpo de error coherente con el resto de la API. |

### 2.2 Formato de respuesta y errores

Se recomenda unificar con el resto del backend:

- **Éxito:** `{ "success": true, "data": ... }` (o el patrón que ya usen).
- **Error:** `{ "success": false, "error": "mensaje legible" }` (y opcionalmente `code` para el cliente).

**Códigos HTTP sugeridos:**

| Código | Uso |
|--------|-----|
| `200` | GET/PATCH correctos. |
| `201` | POST que crea recurso (p. ej. contrato). |
| `400` | Body inválido, validación de negocio. |
| `401` | No autenticado. |
| `403` | Autenticado pero no autorizado (rol / recurso ajeno). |
| `404` | Recurso inexistente o no accesible para ese usuario. |
| `409` | Conflicto (p. ej. duplicado si implementan idempotencia explícita). |
| `500` | Error interno. |

### 2.3 Fechas y zona horaria

- Acordar si `eventDetails.date` es **instante UTC** o “día lógico” del evento.
- Si usan solo fecha sin hora, documentar formato (`YYYY-MM-DD`) y evitar ambigüedades en zonas horarias.
- El cliente actual envía fechas en ISO (ej. `YYYY-MM-DD` + `T12:00:00.000Z`) al crear contratos; el backend debe serializar de forma **estable** en `GET` (string ISO o timestamp con regla clara).

---

## 3. Dominio: contratos / reservas (prioridad alta)

### 3.1 Modelo lógico (persistencia)

Cada llamada de creación representa **una reserva/contrato asociado a una fecha concreta** (un servicio con un artista en un día). Si el usuario elige **3 fechas**, el cliente enviará **3 peticiones `POST`**: en BD deben existir **3 registros** (o 3 filas hijas equivalentes), todos ligados al mismo `clientUid`.

**Campos mínimos recomendados en almacenamiento:**

- `id` (generado por servidor)
- `clientUid` (del token; no editable por el cliente)
- `artistId`, `serviceId`
- `status` (ver enumeración más abajo)
- `eventDetails`: nombre, fecha, ubicación, descripción opcional
- `financials` (opcional en v1): total, pagado, estado de pago
- `contractUrl` / `riderUrl` (opcional)
- `createdAt`, `updatedAt`

**Enumeración `status` (alineada al OpenAPI actual del proyecto):**

`PENDING` | `ACCEPTED` | `REJECTED` | `COMPLETED` | `CANCELLED`

**Semántica orientada a UI (referencia para el equipo de producto):**

- “Listo” en calendario: típicamente `ACCEPTED` o `COMPLETED`.
- “Pendiente” (esperando artista / trámite): típicamente `PENDING` u otros según definan el flujo.

---

### 3.2 `POST /contracts`

| Campo | Valor |
|-------|--------|
| **Método / ruta** | `POST /contracts` (prefijo `/api` según despliegue) |
| **Auth** | Obligatoria; rol cliente. |
| **Comportamiento** | Crear **un** registro de contrato/reserva para el `clientUid` del token. Persistir en BD. Opcional: disparar creación de **notificaciones** (sección 4). |

**Cuerpo JSON (entrada):**

```json
{
  "artistId": "string",
  "serviceId": "string",
  "totalAmount": 0,
  "eventDetails": {
    "name": "string",
    "date": "2026-04-15T12:00:00.000Z",
    "location": "string",
    "description": "string (opcional)"
  }
}
```

**Reglas de negocio / validación (backend):**

- Comprobar que `artistId` y `serviceId` existen y que el servicio pertenece a ese artista (o regla de catálogo equivalente).
- **No** aceptar ciegamente `totalAmount`: recalcular desde precio oficial del servicio y/o aplicar reglas de negocio; rechazar con `400` si no cuadra (o documentar si en v1 solo se registra el valor enviado).
- Asociar siempre el registro al `uid` del token, no a un campo enviado por el cliente.

**Respuesta:** `201` + recurso creado (misma forma que en `GET` listado / detalle).

**Idempotencia (recomendado):** el cliente puede reintentar o doble-enviar al firmar. Opciones: header `Idempotency-Key`, o restricción única en BD `(clientUid, serviceId, fecha_normalizada)` y respuesta `409` o devolver el existente — documentar el criterio elegido.

---

### 3.3 `GET /contracts/my-history`

| Campo | Valor |
|-------|--------|
| **Método / ruta** | `GET /contracts/my-history` |
| **Auth** | Obligatoria; rol cliente. |
| **Comportamiento** | Devolver **solo** contratos del `clientUid` del token. No exponer datos de otros clientes. |

**Query opcional:**

- `from=YYYY-MM-DD`, `to=YYYY-MM-DD` — filtrar por fecha de evento (recomendado para rendimiento y vistas de calendario).

**Ordenación recomendada:** por fecha de evento descendente, o por `updatedAt` descendente (documentar cuál aplican).

**Cuerpo de respuesta (ejemplo):**

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "status": "PENDING",
      "eventDetails": {
        "name": "string",
        "date": "ISO-8601",
        "location": "string",
        "description": "string (opcional)"
      },
      "financials": {
        "totalAmount": 0,
        "paidAmount": 0,
        "paymentStatus": "UNPAID"
      },
      "contractUrl": "string (opcional)",
      "riderUrl": "string (opcional)",
      "artistId": "string (recomendado)",
      "serviceId": "string (recomendado)"
    }
  ]
}
```

**Nota:** incluir `artistId` y `serviceId` en la respuesta facilita enlaces y evolución de la UI sin joins adicionales en cliente.

---

### 3.4 `GET /contracts/{id}` (opcional)

| **Comportamiento** | Detalle de un contrato. Responder `404` si el id no existe o **no pertenece** al `clientUid` del token. |
| **Uso** | PDF, pagos, historial de cambios. No es estrictamente necesario para el MVP de calendario + notificaciones si `my-history` es suficientemente completo. |

---

## 4. Dominio: notificaciones (prioridad alta)

Sin persistencia en servidor, las notificaciones **no sobreviven** a otro dispositivo o sesión nueva.

### 4.1 Modelo lógico (persistencia)

Tabla/colección **por usuario destino** (`clientUid`).

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | string | Generado por servidor (UUID, etc.). |
| `kind` | string | Extensible. Valor inicial usado por producto: `contract_signed_pending_artist`. |
| `createdAt` | ISO-8601 | Para ordenación y antigüedad. |
| `read` | boolean | Default `false`. |
| `artistId` | string? | Opcional. |
| `artistDisplayName` | string | Texto para listado (denormalizar al crear si hace falta). |
| `serviceName` | string? | Opcional. |
| `lineId` | string? | Opcional; referencia a recurso de negocio (contrato, línea, etc.). |

**Índices sugeridos:** `(clientUid, createdAt desc)`, `(clientUid, read)` para filtros.

---

### 4.2 `GET /me/notifications` (nombre de ruta ajustable)

| Campo | Valor |
|-------|--------|
| **Auth** | Obligatoria; rol cliente. |
| **Comportamiento** | Listar notificaciones donde `clientUid` coincide con el token. |

**Query opcional:**

- `unreadOnly=true`
- `limit=50` (y paginación por `cursor` o `page` si el volumen lo requiere)

**Respuesta:** `{ "success": true, "data": [ /* objetos según §4.1 */ ] }`

---

### 4.3 `PATCH /me/notifications/{id}`

| Campo | Valor |
|-------|--------|
| **Auth** | Obligatoria. |
| **Comportamiento** | Actualizar notificación **solo si** `id` pertenece al `clientUid` del token; si no, `404` o `403` según política del proyecto. |

**Body:**

```json
{ "read": true }
```

**Respuesta:** `200` + recurso actualizado o `204` si prefieren sin cuerpo.

---

### 4.4 `POST /me/notifications/read-all` (opcional)

| **Comportamiento** | Marcar todas las notificaciones del usuario como `read: true`. |
| **Respuesta** | `200` o `204`. |

---

### 4.5 Efectos secundarios (lógica servidor)

| Evento | Acción sugerida |
|--------|------------------|
| Tras `POST /contracts` exitoso (cliente crea reserva) | Insertar una o más notificaciones según reglas de producto (ej. `contract_signed_pending_artist` con nombres de artista/servicio). |
| Cambio de estado del contrato | Actualizar o crear notificaciones si el producto lo requiere (ej. artista aceptó). |

La creación debe ser **transaccional** o eventualmente consistente según arquitectura; lo crítico es que al hacer `GET` notificaciones al día siguiente el usuario vea lo persistido.

---

## 5. Calendario “Mis eventos” (prioridad media)

**Opción A — Reutilizar contratos (recomendada si el volumen es bajo):**  
No hace falta un endpoint nuevo: `GET /contracts/my-history` con `from`/`to` permite al cliente armar el calendario agregando por `eventDetails.date`.

**Opción B — Vista agregada:**  
`GET /me/events?from=YYYY-MM-DD&to=YYYY-MM-DD` devuelve ítems ya preparados (fecha, título, subtítulo, estado, ids de contrato/artista). Útil si el cálculo mezcla varias fuentes o es costoso en el cliente.

Elegir **A o B** y documentar; con **una** basta.

---

## 6. Carrito (prioridad baja)

| **Propósito** | Borrador de reserva sincronizado entre dispositivos. |
| **Necesidad** | **No** es imprescindible para el escenario “ya contraté y quiero verlo mañana en incógnito” si contratos + notificaciones están en BD. |
| **Si se implementa** | CRUD típico: `GET /me/cart`, `POST /me/cart/items`, `PATCH /me/cart/items/:id`, `DELETE ...`, siempre scoped por `clientUid`. |

---

## 7. Seguridad y buenas prácticas (checklist backend)

- [ ] Nunca devolver contratos o notificaciones de otro `uid`.
- [ ] Validar pertenencia de `artistId` / `serviceId` al catálogo real.
- [ ] Rate limiting razonable en `POST /contracts` y creación de notificaciones.
- [ ] Logs sin datos sensibles del usuario; trazabilidad con `contractId` / `notificationId`.
- [ ] Paginación en listados que puedan crecer (`my-history`, notificaciones).

---

## 8. Criterios de aceptación (QA / definición de hecho)

- [ ] **N fechas** en una misma contratación desde cliente resultan en **N registros** persistidos (N llamadas `POST /contracts` o equivalente documentado).
- [ ] Mismo usuario, **nueva sesión / incógnito**: `GET /contracts/my-history` devuelve los mismos datos que la sesión anterior.
- [ ] Tras crear contrato, existe notificación en BD y `GET` notificaciones la devuelve en sesión futura.
- [ ] `PATCH` notificación persiste `read` y se refleja en el siguiente `GET`.

---

## 9. Nota para alineación con el cliente web

El frontend actual puede enviar ya `POST /contracts` y `GET /contracts/my-history` y espera envoltorios del estilo `{ success, data }`. Las notificaciones siguen en almacenamiento local hasta que existan los endpoints de la sección 4. Cualquier cambio de path o de nombres de campos debe **versionarse o documentarse** para que el equipo frontend actualice el cliente HTTP en un solo lugar.

---

*Última actualización: spec orientada a implementación backend; rutas bajo el prefijo `/api` según el despliegue del proyecto.*
