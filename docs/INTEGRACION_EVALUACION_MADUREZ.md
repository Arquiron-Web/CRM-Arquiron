# Integración Evaluación de Madurez (EME) → CRM Arquiron

Requerimiento para llevar al proyecto de la **Evaluación de Madurez** (repo separado de `CRM_Arquiron`). Al terminar el cuestionario, la herramienta debe llamar a un endpoint del CRM para registrar el resultado como Lead en Postgres — el mismo endpoint que ya usa el Portal Web, con su propia API key.

> ✅ Ya implementado y probado del lado del CRM (`POST /api/public/leads`). Este documento es la guía para conectar la EME a ese endpoint.

## 1. Endpoint

```
POST https://crm.arquiron.com/api/public/leads   (producción)
POST http://localhost:3000/api/public/leads       (si prueban contra un CRM en local)
```

**Headers:**

```
Content-Type: application/json
x-api-key: <EVALUACION_API_KEY>
```

El valor real de producción está en `.env.local`/Vercel del repo `CRM_Arquiron` (variable `EVALUACION_API_KEY`) — es **distinto** al que usa el Portal Web (`PORTAL_API_KEY`); cada proyecto tiene su propia key para poder rotarlas de forma independiente.

⚠️ **Esta llamada debe hacerse desde el backend de la EME** (API route / server action / función serverless), **nunca desde el navegador** del usuario final — si el fetch se hace client-side, la API key quedaría visible en el bundle de JS.

## 2. Campos del payload

Mismos campos base que el formulario de contacto del Portal Web, más los campos propios de madurez. Todos los campos son opcionales salvo los marcados como obligatorios.

### Datos de contacto

| Campo | Tipo | Obligatorio |
|---|---|---|
| `nombreContacto` | string | Recomendado |
| `emailCorporativo` | string (email) | Solo uno de los dos* |
| `whatsapp` | string | Solo uno de los dos* |
| `nombreEmpresa` | string | No |
| `sector` | string | No |
| `tamano` | string (`micro`\|`pequena`\|`mediana`\|`grande`) | No |
| `pais` | string | No |
| `ciudad` | string | No |
| `cargo` | string | No |
| `aceptaPolitica` | boolean | **Sí, debe ser `true`** |

\* El CRM exige al menos `emailCorporativo` o `whatsapp` — si no llega ninguno, responde `400`.

### Resultado de la evaluación de madurez

| Campo | Tipo | Descripción |
|---|---|---|
| `madurezAutoevaluada` | number o string numérico | Autoevaluación general (si la herramienta la captura antes del cuestionario) |
| `dim1` … `dim10` | number o string numérico | Puntaje de cada una de las 10 dimensiones evaluadas |
| `indiceMadurez` | number o string numérico | Índice general de madurez calculado por la EME |

No hace falta enviar `fuenteFormulario` — el CRM lo asigna automáticamente como `"Evaluacion_Madurez"` según la API key usada (protección anti-spoofing: no se puede sobrescribir desde el body).

## 3. Ejemplo de request

```bash
curl -X POST https://crm.arquiron.com/api/public/leads \
  -H "Content-Type: application/json" \
  -H "x-api-key: <EVALUACION_API_KEY>" \
  -d '{
    "nombreContacto": "Camilo Ríos",
    "emailCorporativo": "camilo@empresa.com",
    "whatsapp": "3011234567",
    "nombreEmpresa": "Empresa SAS",
    "sector": "comercio_retail",
    "tamano": "pequena",
    "pais": "colombia",
    "aceptaPolitica": true,
    "madurezAutoevaluada": 65,
    "dim1": 70, "dim2": 55, "dim3": 60, "dim4": 80, "dim5": 45,
    "dim6": 50, "dim7": 65, "dim8": 70, "dim9": 60, "dim10": 55,
    "indiceMadurez": 61.5
  }'
```

Desde el backend de la EME (ejemplo genérico, adaptar al framework que use ese proyecto):

```ts
const res = await fetch(`${process.env.CRM_URL}/api/public/leads`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.CRM_EVALUACION_API_KEY!, // variable de entorno de la EME, no del CRM
  },
  body: JSON.stringify(payload),
});
```

## 4. Respuestas

| Código | Cuerpo | Cuándo |
|---|---|---|
| `200` | `{ "success": true, "id": "..." }` | Lead creado correctamente |
| `400` | `{ "error": "Datos inválidos", "detail": { ... } }` | Falta un campo obligatorio o `aceptaPolitica` no es `true` |
| `401` | `{ "error": "No autorizado" }` | Falta el header `x-api-key` o la key no es válida |
| `500` | `{ "error": "Error al registrar el lead", "detail": "..." }` | Error interno — reintentar o avisar |

## 5. Correos automáticos

Al crear el lead, el CRM dispara automáticamente (vía Resend, `lib/email.ts`) un correo de confirmación al contacto (si dejó `emailCorporativo`) y un aviso interno a `contacto@arquiron.com` con los datos del lead. La EME no necesita implementar nada de esto — ya queda centralizado en el CRM.
