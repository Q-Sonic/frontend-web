# Requisitos de API — área Cliente (Stage Go / frontend-web)

Documento para **backend**: describe qué consume hoy el frontend real y qué **endpoints y modelos** harían falta para **reemplazar `localStorage` y mocks** del flujo cliente (carrito, contratos, eventos, notificaciones).

**Convenciones asumidas (alineadas con `src/api/client.ts`):**

- Base: `config.apiBaseUrl` (sin barra final).
- Autenticación: header `Authorization: Bearer <idToken>` en rutas de cliente autenticado.
- Respuestas de éxito: el proyecto ya acepta envoltorios tipo `{ data: T }` en varios servicios; conviene **unificar** (ej. siempre `{ data: ... }` o siempre cuerpo plano) y documentarlo.

---

## 1. Contexto: qué está en backend hoy vs qué es mock

### Ya integrado con API (referencia)

| Funcionalidad | Ejemplo de ruta usada en front |
|---------------|--------------------------------|
| Listado / filtros de artistas | `GET artist-profiles?...` |
| Perfil de artista | `GET artist-profiles/:uid` |
| Servicios del artista | Servicios por `artistId` (ver `artistServiceService.ts`) |
| Detalle servicio | `GET` servicio por id |
| Usuario (nombre público) | `GET` user por uid |
| Perfil del cliente | `GET client-profiles/me`, `PUT client-profiles` |

### Simulado solo en frontend (sustituir por API)

| Mock | Ubicación conceptual |
|------|----------------------|
| Carrito de reservas | `localStorage` `stagego_client_service_cart_v1` |
| Registros de firma / “contratos firmados” | `localStorage` `stagego_client_signed_cart_mock_v1` |
| Notificaciones (campana) | `localStorage` `stagego_client_notifications_v1` |
| Calendario “Mis eventos” | Derivado de los registros firmados mock |
| Bloqueos en calendario artista (vista cliente) | Si `blockedDates` vacío → fechas demo en código |

---

## 2. Modelo de datos que el front ya maneja (DTO de referencia)

Estos campos salen de los tipos actuales; el backend puede nombrarlos distinto si mapeamos en front, pero la **semántica** debe cubrirse.

### 2.1 Línea de carrito (`ServiceCartLine`)

Representa una línea de “servicio + fechas elegidas” antes de firmar.

```json
{
  "id": "string (id de línea; hoy generado en cliente)",
  "artistId": "string (uid artista)",
  "serviceId": "string",
  "serviceName": "string",
  "price": 0,
  "selectedDateKeys": ["2026-04-09", "2026-04-10"],
  "addedAt": "ISO-8601",
  "artistDisplayName": "string (opcional, denormalizado UI)",
  "artistPhotoUrl": "string (opcional)",
  "locationLabel": "string (opcional, ej. ciudad)",
  "serviceFeatures": ["string"] 
}
```

- `selectedDateKeys`: formato **`YYYY-MM-DD`** (zona/local acordada con backend).
- `price`: hoy es el precio mostrado; idealmente el **servidor recalcula** o valida frente al servicio vigente.

### 2.2 Registro de firma (mock `SignedCartMockRecord`)

Hoy agrupa una o varias líneas firmadas en una misma acción (firma en canvas una vez para N contratos).

```json
{
  "signedAt": "ISO-8601",
  "signatureDataUrl": "data:image/png;base64,...",
  "applyToAll": true,
  "artistSignatureComplete": false,
  "lines": [ { "...": "ServiceCartLine" } ]
}
```

- `applyToAll`: en UI indica si la misma firma aplicó a varias líneas.
- `artistSignatureComplete`: en UI → estado **“Listo”** (verde) vs **“Pendiente”** (esperando firma del artista). El backend debería exponer un **estado de contrato/reserva** equivalente.

### 2.3 Notificación (`ClientNotificationRecord`)

```json
{
  "id": "string",
  "kind": "contract_signed_pending_artist",
  "createdAt": "ISO-8601",
  "read": false,
  "artistId": "string (opcional)",
  "artistDisplayName": "string",
  "serviceName": "string (opcional)",
  "lineId": "string (opcional, id de línea de carrito / booking line)"
}
```

**Extensión esperada:** más `kind` en el futuro (`booking_confirmed`, `message_received`, etc.).

### 2.4 Evento en calendario “Mis eventos” (derivado en UI)

Por cada **día** de cada `selectedDateKeys` de cada línea firmada, el front muestra:

- Título: `serviceName`
- Subtítulo: `artistDisplayName`
- Estado visual: **pendiente** / **listo** según equivalencia de `artistSignatureComplete` (o estado server-side).
- Hora mostrada hoy: derivada de `signedAt` (placeholder); lo ideal es **`eventStartAt`** o similar por día desde backend.

---

## 3. Endpoints sugeridos (REST orientativo)

Los paths son **propuestas**. Lo crítico es cubrir operaciones y relaciones.

### 3.1 Carrito / borrador de reserva

| Método | Ruta propuesta | Descripción |
|--------|----------------|-------------|
| `GET` | `/me/cart` o `/client/cart` | Lista líneas del carrito del usuario autenticado. |
| `POST` | `/me/cart/items` | Añade línea (payload alineado con `ServiceCartLine` sin `id` o con id server-generated). |
| `PATCH` | `/me/cart/items/:itemId` | Actualiza fechas / cantidad si aplica. |
| `DELETE` | `/me/cart/items/:itemId` | Elimina línea. |
| `DELETE` | `/me/cart` | Vaciar carrito (opcional). |

**Respuesta:** array de items con los mismos campos que necesita el modal de firma por lotes.

---

### 3.2 Reservas / bookings (alternativa o complemento al carrito)

Si el flujo oficial es “booking” en servidor:

| Método | Ruta propuesta | Descripción |
|--------|----------------|-------------|
| `POST` | `/me/bookings` | Crea reserva(s) desde carrito o desde “Reservar fechas” en ficha de servicio. Body: `artistId`, `serviceId`, `dateKeys[]`, etc. |
| `GET` | `/me/bookings` | Listado con estados. |
| `GET` | `/me/bookings/:bookingId` | Detalle. |

El front necesita al menos: fechas, servicio, artista, **estado**, enlace a contrato si existe.

---

### 3.3 Contratos y firmas

| Método | Ruta propuesta | Descripción |
|--------|----------------|-------------|
| `POST` | `/me/contracts` o `/bookings/:id/contract` | Genera instancia de contrato para una o N líneas/fechas. |
| `GET` | `/me/contracts` | Lista contratos del cliente (para `/client/contracts` y sidebar). |
| `GET` | `/me/contracts/:contractId` | Detalle + estados + URLs de PDF. |
| `POST` | `/me/contracts/:contractId/signatures/client` | Cliente firma: **multipart** (`image/png`) o subida a storage + `fileUrl` + metadata. Evitar `data:` enormes en JSON si es posible. |
| `POST` | `/me/contracts/:contractId/signatures/artist` | Firma del artista (rol artista). |

**Estados sugeridos** (alinear con UI naranja/verde):

- `draft` | `awaiting_client_signature` | `awaiting_artist_signature` | `fully_signed` | `cancelled` | `expired` (según negocio)

Tras `POST` firma cliente, el backend puede **crear notificación** para el cliente y/o push al artista.

---

### 3.4 Eventos / calendario del cliente (`/client/events`)

| Método | Ruta propuesta | Descripción |
|--------|----------------|-------------|
| `GET` | `/me/events?from=YYYY-MM-DD&to=YYYY-MM-DD` | Eventos agregados por día para el calendario. |

**Ítem sugerido:**

```json
{
  "id": "string",
  "date": "2026-04-09",
  "title": "Nombre servicio",
  "subtitle": "Nombre artista",
  "status": "pending_artist_signature | confirmed",
  "startTime": "20:00",
  "bookingId": "string",
  "contractId": "string",
  "artistId": "string"
}
```

El front puede mapear `status` a colores **Pendiente / Listo** sin depender de `localStorage`.

---

### 3.5 Notificaciones

| Método | Ruta propuesta | Descripción |
|--------|----------------|-------------|
| `GET` | `/me/notifications?unreadOnly=true&limit=50` | Lista. |
| `PATCH` | `/me/notifications/:id` | Body: `{ "read": true }`. |
| `POST` | `/me/notifications/read-all` | Marcar todas leídas (opcional). |

**Ítem:** alinear con sección 2.3; incluir `kind` estable para que el front traduzca textos.

---

### 3.6 Disponibilidad del artista (calendario en perfil)

Hoy: `blockedDates[]` en `GET artist-profiles/:id`.

Opciones:

- **A)** Mantener y **garantizar** que el backend rellena `blockedDates` (y reservas confirmadas) para que el front **elimine el mock** demo.
- **B)** Añadir `GET /artists/:uid/availability?month=2026-04` que devuelva días bloqueados/ocupados.

---

### 3.7 Mensajería / chat (pendiente en UI)

Botón flotante y icono de sobre **no** llaman API hoy.

| Método | Ruta propuesta | Descripción |
|--------|----------------|-------------|
| `GET` | `/me/conversations` | … |
| `GET` | `/me/conversations/:id/messages` | … |
| `POST` | `/me/conversations/:id/messages` | … |

Definir si es chat interno o integración externa.

---

## 4. Flujos que el front debe poder reproducir con API

1. **Añadir al carrito** desde ficha de servicio → persistir en servidor; reflejar badge del carrito.
2. **Abrir modal de firma múltiple** → `GET cart` + PDFs/documentos ya cubiertos por URLs de servicio/perfil.
3. **Firmar** → subir firma + crear/actualizar contrato + devolver estado; generar notificación si aplica.
4. **Firmar desde servicio (sin carrito)** → mismo contrato/booking que una línea con `selectedDateKeys`.
5. **Mis eventos** → calendario solo desde datos de servidor.
6. **Campana** → notificaciones desde servidor; marcar leídas.
7. **Listado global de contratos** (`/client/contracts`) → `GET /me/contracts`.

---

## 5. Notas para implementación

- **Idempotencia:** doble clic en “Firmar” no debe duplicar contratos; usar idempotency key o estado en booking.
- **Precios:** validar en servidor frente a `serviceId` y fechas.
- **Zona horaria:** acordar si `YYYY-MM-DD` es “día local del evento” o UTC.
- **Tamaño de firma:** preferir **storage + URL** en lugar de guardar solo base64 en BD.
- **Paginación:** notificaciones y contratos deberían soportar `cursor`/`page` a medio plazo.

---

## 6. Referencia de código en el repo

| Concepto | Archivo |
|----------|---------|
| Tipos carrito / firmados mock | `src/helpers/clientServiceCart.ts` |
| Notificaciones mock | `src/helpers/clientNotifications.ts` |
| Eventos calendario cliente | `src/helpers/clientSignedCalendarEvents.ts`, `src/hooks/useClientSignedContractCalendar.ts` |
| Context carrito + modal firma | `src/contexts/ClientServiceCartContext.tsx` |
| API cliente existente | `src/api/clientProfileService.ts`, `src/api/artistProfileService.ts`, `src/api/artistServiceService.ts` |

---

*Última actualización: generado desde el estado del frontend; los paths exactos pueden ajustarse al estándar del backend siempre que las operaciones y campos anteriores queden cubiertos.*
