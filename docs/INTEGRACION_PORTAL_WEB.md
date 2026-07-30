# Integración Portal Web → CRM Arquiron

Requerimiento para llevar al proyecto del **Portal Web** (repo separado de `CRM_Arquiron`). El formulario de contacto del portal debe llamar a un endpoint nuevo del CRM para registrar cada envío como Lead en Postgres.

> ✅ Ya implementado y probado del lado del CRM (`POST /api/public/leads`). Este documento es la guía para conectar el formulario del Portal a ese endpoint.

## 1. Endpoint

```
POST http://localhost:3000/api/public/leads   (desarrollo)
POST https://<dominio-produccion-crm>/api/public/leads   (producción — pendiente de definir el dominio)
```

**Headers:**

```
Content-Type: application/json
x-api-key: <PORTAL_API_KEY>
```

El valor real de `PORTAL_API_KEY` está en `.env.local` del repo `CRM_Arquiron` (variable `PORTAL_API_KEY`) — pídeselo a Eduard, no lo copies a un repo público. En producción cada entorno debe tener su propia key (rotar si se filtra alguna vez).

⚠️ **Esta llamada debe hacerse desde el backend del Portal** (una API route / server action / función serverless del propio Portal), **nunca desde el navegador del visitante** — si el fetch se hace client-side, la API key quedaría visible en el bundle de JS y cualquiera podría usarla para insertar leads falsos.

## 2. Mapeo de campos del formulario

### Paso 1 — "Tus Datos"

| Campo del formulario | Campo a enviar | Tipo | Obligatorio |
|---|---|---|---|
| Nombre completo | `nombreContacto` | string | Sí |
| Email corporativo | `emailCorporativo` | string (email) | Solo uno de los dos* |
| WhatsApp | `whatsapp` | string | Solo uno de los dos* |
| ¿Cuál es tu mayor reto empresarial? | `retoPrincipal` | string (ver tabla abajo) | No (recomendado) |

\* El CRM exige que venga al menos `emailCorporativo` o `whatsapp` — si no llega ninguno de los dos, responde `400`.

**Valores válidos de `retoPrincipal`** (usa exactamente estas claves internas, no la etiqueta visible, para que el CRM pueda sugerir el servicio FORJA correcto):

| Clave a enviar | Reto (texto visible sugerido) |
|---|---|
| `sin_estrategia` | No tenemos una estrategia clara y ejecutable |
| `desalineamiento` | La tecnología no conecta con nuestros procesos |
| `financiero` | Flujo de caja, rentabilidad o acceso a crédito |
| `brecha_digital` | No hemos podido digitalizar nuestras operaciones |
| `talento` | Atraer, retener o desarrollar talento clave |
| `clientes` | Perdemos clientes y no sabemos cómo retenerlos |
| `normativo` | La carga regulatoria nos desborda |
| `productividad` | Operamos de forma manual, baja productividad |
| `otro` | Otro reto |

### Paso 2 — "Tu Empresa" (todo opcional salvo lo indicado)

| Campo del formulario | Campo a enviar | Tipo |
|---|---|---|
| Nombre de la empresa | `nombreEmpresa` | string |
| Sector | `sector` | string (ver tabla abajo) |
| Tamaño | `tamano` | string (ver tabla abajo) |
| País | `pais` | string (ver tabla abajo) |
| Ciudad | `ciudad` | string libre |
| Cargo | `cargo` | string libre |
| ¿Cuándo podemos contactarte? | `momentoContacto` | string (ver tabla abajo) — **obligatorio** |
| ¿Cómo llegaste a Arquiron? | `comoNosConocio` | string (ver tabla abajo) |
| Aceptación de política de datos | `aceptaPolitica` | boolean — **obligatorio, debe ser `true`** |

**Valores válidos de `sector`:** `comercio_retail`, `manufactura`, `servicios_profesionales`, `tecnologia_digital`, `salud_bienestar`, `educacion`, `construccion`, `agro`, `logistica`, `turismo`, `financiero_fintech`, `otro`.

**Valores válidos de `tamano`:** `micro`, `pequena`, `mediana`, `grande`.

**Valores válidos de `pais`:** `colombia`, `ecuador`, `peru`, `chile`, `mexico`, `panama`, `costa_rica`, `otro_latam`.

**Valores válidos de `momentoContacto`** (los 4 botones del formulario):

| Clave a enviar | Botón visible |
|---|---|
| `urgente` | ⚡ Lo antes posible |
| `semana` | 📅 Esta semana |
| `mes` | 🗓 En el próximo mes |
| `explorando` | 🔍 Solo estoy explorando |

**Valores recomendados de `comoNosConocio`** (los chips del formulario, en minúscula y sin tilde): `linkedin`, `google`, `referido`, `instagram`, `articulo`, `otro`.

> ⚠️ Importante: **solo el valor exacto `"referido"`** activa el bono de puntaje por referido en el CRM (los referidos convierten 3x más). Si el visitante marca "Referido", sería ideal agregar un campo adicional "¿Quién te refirió?" y enviarlo como `referidoPor` (string) — el CRM ya lo soporta y lo antepone a las notas del lead. Es opcional; si no lo agregan, no pasa nada, simplemente no se captura ese dato.

### Campos que el Portal NO debe enviar

`fuenteFormulario`, `estadoLead`, `consultorAsignado` y `scoreLead` se ignoran/calculan del lado del CRM — el CRM ya sabe que viene del Portal por la API key usada, y calcula el puntaje del lead automáticamente. No hace falta (ni tiene efecto) enviarlos.

## 3. Ejemplo de request

```bash
curl -X POST https://<dominio-crm>/api/public/leads \
  -H "Content-Type: application/json" \
  -H "x-api-key: <PORTAL_API_KEY>" \
  -d '{
    "nombreContacto": "Camilo Ríos",
    "emailCorporativo": "camilo@empresa.com",
    "whatsapp": "3011234567",
    "retoPrincipal": "financiero",
    "nombreEmpresa": "Empresa SAS",
    "sector": "comercio_retail",
    "tamano": "pequena",
    "pais": "colombia",
    "ciudad": "Bogotá",
    "cargo": "Gerente General",
    "momentoContacto": "urgente",
    "comoNosConocio": "referido",
    "referidoPor": "Juan Pérez",
    "aceptaPolitica": true
  }'
```

Desde el backend del Portal (ejemplo genérico, adaptar al framework que use ese proyecto):

```ts
const res = await fetch(`${process.env.CRM_URL}/api/public/leads`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.CRM_PORTAL_API_KEY!, // variable de entorno del Portal, no del CRM
  },
  body: JSON.stringify(payload),
});
```

## 3.1 Widget de newsletter ("Insights para líderes de PYMEs")

El widget de suscripción del footer (solo campo de email) **usa el mismo endpoint y la misma API key**, con un body mucho más simple:

```json
{
  "emailCorporativo": "lector@empresa.com",
  "origenFormulario": "newsletter",
  "aceptaPolitica": true
}
```

- `origenFormulario: "newsletter"` es la única diferencia — le indica al CRM que es una suscripción liviana, no el formulario de contacto completo. Sin ese campo (o con cualquier otro valor), se trata como contacto normal.
- No hace falta `nombreContacto` para este caso — el CRM completa automáticamente `"Suscriptor newsletter"` como nombre.
- `aceptaPolitica: true` se envía siempre en `true` para este widget (la página ya muestra el aviso "Sin spam · Puedes cancelar cuando quieras · Ley 1581" junto al botón — no hace falta un checkbox aparte, el clic en "Suscribirme" es el consentimiento).
- Estos leads quedan marcados con `fuenteFormulario = "Portal_Newsletter"` (distinto de `"Portal_Empresarial"`), así que el equipo de ventas puede diferenciarlos fácilmente en el CRM y no se mezclan con los contactos calificados del formulario completo.

## 4. Respuestas

| Código | Cuerpo | Cuándo |
|---|---|---|
| `200` | `{ "success": true, "id": "..." }` | Lead creado correctamente |
| `400` | `{ "error": "Datos inválidos", "detail": { ... } }` | Falta un campo obligatorio o `aceptaPolitica` no es `true` |
| `401` | `{ "error": "No autorizado" }` | Falta el header `x-api-key` o la key no es válida |
| `500` | `{ "error": "Error al registrar el lead", "detail": "..." }` | Error interno — reintentar o avisar |

Se recomienda que el Portal muestre su propio mensaje de éxito al visitante independientemente de la respuesta exacta del CRM (no exponer los detalles del error al usuario final), y que registre en sus propios logs cualquier `4xx`/`5xx` para poder diagnosticar problemas de integración.
