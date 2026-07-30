# DIAGNÓSTICO — CRM Arquiron

## PROBLEMA 1: LEADS NO SE GUARDAN

**Causa raíz encontrada:** El callback `jwt` en `/lib/auth.ts` NO refresca el access token cuando expira. Google OAuth devuelve access tokens con vigencia de ~1 hora. Una vez expirado, todas las llamadas a la Google Sheets API fallan con 401.

**Archivo afectado:** `/lib/auth.ts`  
**Líneas:** 44-55

**Evidencia:**

```javascript
async jwt({ token, account }) {
  if (account) {
    token.accessToken = account.access_token;
    token.refreshToken = account.refresh_token;
    token.expiresAt = account.expires_at;
  }
  // Refrescar el token si expiró
  if (Date.now() < (token.expiresAt as number) * 1000) {
    return token;
  }
  return token;  // ← BUG: Siempre retorna token, NUNCA refresca
}
```

El comentario dice "Refrescar el token si expiró" pero **no existe lógica de refresh**. Cuando `Date.now() >= expiresAt`, se retorna el mismo token expirado. La Sheets API rechaza con 401.

---

## PROBLEMA 2: EMAIL NPS NO SE ENVÍA

**Causa raíz encontrada:** El Google Apps Script no tiene el bloque que maneja `tipo === "nps_email"` y `fuenteFormulario === "CRM_NPS"`. Sin ese bloque, el `doPost()` no reconoce la petición NPS y no envía el correo.

**Archivo afectado:** Apps Script (externo — script.google.com)  
**Causa secundaria:** El endpoint `/api/nps/enviar` no valida la respuesta del Apps Script; si falla, el frontend muestra "Email enviado" erróneamente.

---

## CORRECCIONES PROPUESTAS

### Fix 1 — Auth: Implementar refresh del token Google
Ver `/lib/auth.ts` — agregar lógica para refrescar cuando `Date.now() >= expiresAt`.

### Fix 2 — NPS API: Validar respuesta del Apps Script
Ver `/app/api/nps/enviar/route.ts` — comprobar `res.ok` y el body antes de retornar success.

### Fix Apps Script
Agregar en `doPost()` ANTES del bloque CRM_Propuesta:

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

Después: Implementar → Administrar implementaciones → Nueva versión.
