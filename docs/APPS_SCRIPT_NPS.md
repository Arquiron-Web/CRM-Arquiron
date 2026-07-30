# Código para agregar al Google Apps Script — Email NPS

Abre **Extensiones → Apps Script** en tu Google Sheet y aplica estos cambios.

## 1. Bloque en doPost()

Dentro de la función `doPost()`, agrega este bloque **ANTES** del bloque de if/else existente (CRM_Propuesta, etc.):

```javascript
if (fuente === "CRM_NPS" && tipo === "nps_email") {
  GmailApp.sendEmail(
    data.emailCorporativo,
    data.asunto,
    "Por favor responde desde un cliente de email con HTML.",
    {
      from:     CORREO_FORJA,
      name:     NOMBRE_FORJA,
      htmlBody: data.htmlBody,
      replyTo:  CORREO_FORJA,
    }
  );
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Después guarda e implementa una nueva versión del deployment (Implementar → Implementaciones → Nueva implementación).

## 2. Variables de entorno para el endpoint público NPS

El endpoint `/api/nps/[token]` es público (sin sesión) y escribe en el Sheet usando el **refresh token del propietario**.

En `.env.local` agrega:

```
GOOGLE_OWNER_REFRESH_TOKEN=tu_refresh_token_aqui
```

**Cómo obtener el refresh token:**
- Opción A: En `lib/auth.ts` (callbacks.jwt), agrega temporalmente:  
  `if (account) console.log("REFRESH TOKEN:", account.refresh_token);`  
  Reinicia el servidor, inicia sesión en el CRM, copia el valor de la consola.
- Opción B: Ejecutar `npx ts-node scripts/get-refresh-token.ts` y seguir las instrucciones.
