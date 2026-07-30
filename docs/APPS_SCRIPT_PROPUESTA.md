# Código para agregar al Google Apps Script

Abre **Extensiones → Apps Script** en tu Google Sheet y aplica estos cambios.

## 1. Bloque en doPost()

Dentro de la función `doPost()`, agrega este bloque al final del if/else de fuentes:

```javascript
if (fuente === "CRM_Propuesta" && tipo === "propuesta") {
  enviarCorreoPropuesta(data);
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 2. Nueva función enviarCorreoPropuesta()

Agrega esta función **ANTES** de las funciones auxiliares `generarID` y `testCorreos`:

```javascript
function enviarCorreoPropuesta(data) {
  var contacto  = data.nombreContacto  || "estimado/a";
  var empresa   = data.nombreEmpresa   || "tu empresa";
  var titulo    = data.tituloPropuesta || "Propuesta Comercial";
  var servicio  = data.servicioForja   || "";
  var consultor = data.consultor       || "Equipo Arquiron";
  var version   = data.version         || "v1.0";
  var valorUSD  = data.valorUSD        || "";
  var asunto    = "Propuesta Comercial - " + titulo + " | Arquiron";

  var html =
  '<!DOCTYPE html>' +
  '<html lang="es"><head><meta charset="UTF-8"/></head>' +
  '<body style="margin:0;padding:0;background:#f0f4ff;font-family:Segoe UI,Arial,sans-serif;">' +
  '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 20px;">' +
  '<tr><td align="center">' +
  '<table width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;">' +

  // PORTADA
  '<tr><td style="background:linear-gradient(135deg,#1D1A70 0%,#1B3A5C 60%,#8560C0 100%);border-radius:16px 16px 0 0;padding:48px 48px 40px;text-align:center;">' +
  '<p style="margin:0 0 16px;color:#B8C5FF;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Propuesta Comercial</p>' +
  '<h1 style="margin:0 0 12px;color:#ffffff;font-size:26px;font-weight:800;line-height:1.2;">' + titulo + '</h1>' +
  '<p style="margin:0 0 20px;color:#B8C5FF;font-size:14px;">Preparada especialmente para ' + empresa + '</p>' +
  (servicio ? '<div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:999px;padding:7px 20px;"><p style="margin:0;color:#ffffff;font-size:13px;font-weight:600;">' + servicio + '</p></div>' : '') +
  '</td></tr>' +

  // BANDA
  '<tr><td style="height:4px;background:linear-gradient(90deg,#D4881E,#8560C0,#4CCED5);"></td></tr>' +

  // CUERPO
  '<tr><td style="background:#ffffff;padding:48px;">' +

  '<p style="margin:0 0 8px;color:#1B3A5C;font-size:17px;font-weight:700;">Estimado/a ' + contacto.split(" ")[0] + ',</p>' +
  '<p style="margin:0 0 32px;color:#4b5563;font-size:15px;line-height:1.7;">Es un placer presentarle esta propuesta comercial que hemos preparado cuidadosamente para <strong style="color:#1B3A5C;">' + empresa + '</strong>. Hemos analizado en detalle su situacion y estamos convencidos de que podemos aportarle valor real y medible.</p>' +

  (data.introduccion ? '<div style="margin-bottom:28px;"><h2 style="margin:0 0 10px;color:#1B3A5C;font-size:15px;font-weight:700;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">Contexto</h2><p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">' + data.introduccion.replace(/\n/g,"<br/>") + '</p></div>' : '') +

  (data.diagnostico ? '<div style="background:#f8faff;border:1px solid #e0e7ff;border-radius:12px;padding:22px;margin-bottom:28px;"><h2 style="margin:0 0 10px;color:#1B3A5C;font-size:15px;font-weight:700;">Diagnostico de Madurez</h2><p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">' + data.diagnostico.replace(/\n/g,"<br/>") + '</p></div>' : '') +

  (data.alcance ? '<div style="margin-bottom:28px;"><h2 style="margin:0 0 10px;color:#1B3A5C;font-size:15px;font-weight:700;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">Alcance del Proyecto</h2><p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">' + data.alcance.replace(/\n/g,"<br/>") + '</p></div>' : '') +

  (data.metodologia ? '<div style="background:linear-gradient(135deg,#1D1A70,#8560C0);border-radius:12px;padding:22px;margin-bottom:28px;"><h2 style="margin:0 0 10px;color:#ffffff;font-size:15px;font-weight:700;">Nuestra Metodologia FORJA</h2><p style="margin:0;color:#B8C5FF;font-size:14px;line-height:1.8;">' + data.metodologia.replace(/\n/g,"<br/>") + '</p></div>' : '') +

  (data.entregables ? '<div style="margin-bottom:28px;"><h2 style="margin:0 0 10px;color:#1B3A5C;font-size:15px;font-weight:700;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">Entregables</h2><p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">' + data.entregables.replace(/\n/g,"<br/>") + '</p></div>' : '') +

  (data.timeline ? '<div style="background:#f8faff;border:1px solid #e0e7ff;border-radius:12px;padding:22px;margin-bottom:28px;"><h2 style="margin:0 0 10px;color:#1B3A5C;font-size:15px;font-weight:700;">Cronograma</h2><p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">' + data.timeline.replace(/\n/g,"<br/>") + '</p></div>' : '') +

  (data.inversion || valorUSD ? '<div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:22px;margin-bottom:28px;">' +
  '<h2 style="margin:0 0 4px;color:#9a3412;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Inversion</h2>' +
  (valorUSD ? '<p style="margin:0 0 10px;color:#D4881E;font-size:26px;font-weight:800;">$' + parseInt(valorUSD).toLocaleString() + ' USD</p>' : '') +
  (data.inversion ? '<p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">' + data.inversion.replace(/\n/g,"<br/>") + '</p>' : '') +
  '</div>' : '') +

  (data.terminos ? '<div style="margin-bottom:28px;"><h2 style="margin:0 0 10px;color:#1B3A5C;font-size:15px;font-weight:700;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">Terminos y Condiciones</h2><p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">' + data.terminos.replace(/\n/g,"<br/>") + '</p></div>' : '') +

  // CTA
  '<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1D1A70,#8560C0);border-radius:16px;margin-bottom:28px;">' +
  '<tr><td style="padding:32px;text-align:center;">' +
  '<p style="margin:0 0 8px;color:#B8C5FF;font-size:13px;">Listo para dar el siguiente paso?</p>' +
  '<p style="margin:0 0 18px;color:#ffffff;font-size:18px;font-weight:700;">Agenda tu sesion de inicio con nosotros</p>' +
  '<a href="mailto:contacto@arquiron.com?subject=Acepto%20la%20propuesta%20' + encodeURIComponent(titulo) + '" style="display:inline-block;background:#D4881E;color:white;padding:14px 36px;border-radius:999px;font-size:15px;font-weight:700;text-decoration:none;">Aceptar Propuesta</a>' +
  '<p style="margin:14px 0 0;color:#B8C5FF;font-size:12px;">O responde este correo para coordinar una llamada</p>' +
  '</td></tr></table>' +

  // Firma
  '<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f3f4f6;padding-top:20px;">' +
  '<tr>' +
  '<td><p style="margin:0;color:#1B3A5C;font-size:14px;font-weight:700;">' + consultor + '</p>' +
  '<p style="margin:2px 0 0;color:#6b7280;font-size:13px;">Arquiron</p>' +
  '<p style="margin:2px 0 0;color:#6b7280;font-size:13px;">contacto@arquiron.com</p></td>' +
  '<td style="text-align:right;"><p style="margin:0;color:#9ca3af;font-size:12px;">' + version + '</p></td>' +
  '</tr></table>' +

  '</td></tr>' +

  // FOOTER
  '<tr><td style="background:#1B3A5C;border-radius:0 0 16px 16px;padding:24px 48px;text-align:center;">' +
  '<p style="margin:0 0 6px;color:#B8C5FF;font-size:13px;">Arquiron - Arquitectura Empresarial para PYMEs Latinoamericanas</p>' +
  '<p style="margin:0;color:#6b7ab8;font-size:12px;">Bogota, Colombia - Atencion en toda Latinoamerica - ' +
  '<a href="https://www.arquiron.com" style="color:#4CCED5;text-decoration:none;">www.arquiron.com</a></p>' +
  '</td></tr>' +

  '</table></td></tr></table>' +
  '</body></html>';

  GmailApp.sendEmail(
    data.emailCorporativo,
    asunto,
    "Hemos preparado una propuesta comercial para " + empresa + ". Por favor revisa el contenido adjunto.",
    {
      from:     CORREO_FORJA,
      name:     NOMBRE_FORJA,
      htmlBody: html,
      replyTo:  CORREO_FORJA,
    }
  );

  // Notificacion interna
  GmailApp.sendEmail(
    CORREO_FORJA,
    "Propuesta enviada - " + empresa + " | " + titulo,
    "Se envio la propuesta " + titulo + " a " + contacto + " (" + data.emailCorporativo + ")",
    {
      from:  CORREO_FORJA,
      name:  "CRM Arquiron",
      htmlBody:
        '<p style="font-family:sans-serif;color:#1B3A5C;">' +
        '<strong>Propuesta enviada desde el CRM</strong><br/><br/>' +
        'Titulo: ' + titulo + '<br/>' +
        'Empresa: ' + empresa + '<br/>' +
        'Contacto: ' + contacto + '<br/>' +
        'Email: ' + data.emailCorporativo + '<br/>' +
        'Version: ' + version + '<br/>' +
        (valorUSD ? 'Valor: $' + parseInt(valorUSD).toLocaleString() + ' USD<br/>' : '') +
        '<br/><a href="' + URL_SHEET + '" style="color:#4CCED5;">Ver en Google Sheets</a>' +
        '</p>',
    }
  );
}
```

**Nota:** Asegúrate de que tu Apps Script tenga definidas las constantes `CORREO_FORJA`, `NOMBRE_FORJA` y `URL_SHEET` (o ajústalas según tu script existente).

## 3. Variable de entorno en el CRM

En `.env.local` agrega:

```
NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
```

Reemplaza `TU_DEPLOYMENT_ID` por la URL de implementación de tu Apps Script (Implementar → Implementaciones → URL de la aplicación web).
