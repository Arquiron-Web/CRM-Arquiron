export function generarHTMLPropuesta(p: {
  titulo?: string;
  empresaCliente?: string;
  servicioForja?: string;
  contacto?: string;
  introduccion?: string;
  diagnostico?: string;
  alcance?: string;
  metodologia?: string;
  entregables?: string;
  timeline?: string;
  inversion?: string;
  terminos?: string;
  valorUSD?: string;
  consultor?: string;
  version?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4ff;
             font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f0f4ff;padding:40px 20px;">
<tr><td align="center">
<table width="680" cellpadding="0" cellspacing="0"
       style="max-width:680px;width:100%;">

  <!-- PORTADA -->
  <tr><td style="background:linear-gradient(135deg,#1D1A70 0%,#1B3A5C 60%,#8560C0 100%);
                  border-radius:16px 16px 0 0;padding:48px 48px 40px;text-align:center;">
    <p style="margin:0 0 24px;color:#B8C5FF;font-size:12px;font-weight:700;
               text-transform:uppercase;letter-spacing:2px;">
      Propuesta Comercial
    </p>
    <h1 style="margin:0 0 12px;color:#ffffff;font-size:28px;font-weight:800;
               letter-spacing:-0.5px;line-height:1.2;">
      ${p.titulo || "Propuesta"}
    </h1>
    <p style="margin:0 0 24px;color:#B8C5FF;font-size:15px;">
      Preparada especialmente para ${p.empresaCliente || "el cliente"}
    </p>
    <div style="display:inline-block;background:rgba(255,255,255,0.1);
                border:1px solid rgba(255,255,255,0.2);border-radius:999px;
                padding:8px 24px;">
      <p style="margin:0;color:#ffffff;font-size:14px;font-weight:600;">
        ${p.servicioForja || "Servicio FORJA"}
      </p>
    </div>
  </td></tr>

  <!-- BANDA -->
  <tr><td style="height:4px;
                  background:linear-gradient(90deg,#D4881E,#8560C0,#4CCED5);">
  </td></tr>

  <!-- CUERPO -->
  <tr><td style="background:#ffffff;padding:48px;">

    <!-- Saludo -->
    <p style="margin:0 0 8px;color:#1B3A5C;font-size:17px;font-weight:700;">
      Estimado/a ${p.contacto || "cliente"},
    </p>
    <p style="margin:0 0 32px;color:#4b5563;font-size:15px;line-height:1.7;">
      Es un placer presentarle esta propuesta comercial que hemos preparado
      cuidadosamente para <strong style="color:#1B3A5C;">${p.empresaCliente || "su empresa"}</strong>.
    </p>

    ${p.introduccion ? `
    <!-- Introducción -->
    <div style="margin-bottom:32px;">
      <h2 style="margin:0 0 12px;color:#1B3A5C;font-size:16px;font-weight:700;
                  padding-bottom:8px;border-bottom:2px solid #f3f4f6;">
        Contexto y Antecedentes
      </h2>
      <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">
        ${p.introduccion.replace(/\n/g, "<br/>")}
      </p>
    </div>` : ""}

    ${p.diagnostico ? `
    <!-- Diagnóstico -->
    <div style="background:#f8faff;border:1px solid #e0e7ff;border-radius:12px;
                padding:24px;margin-bottom:32px;">
      <h2 style="margin:0 0 12px;color:#1B3A5C;font-size:16px;font-weight:700;">
        Diagnóstico de Madurez Empresarial
      </h2>
      <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">
        ${p.diagnostico.replace(/\n/g, "<br/>")}
      </p>
    </div>` : ""}

    ${p.alcance ? `
    <!-- Alcance -->
    <div style="margin-bottom:32px;">
      <h2 style="margin:0 0 12px;color:#1B3A5C;font-size:16px;font-weight:700;
                  padding-bottom:8px;border-bottom:2px solid #f3f4f6;">
        Alcance del Proyecto
      </h2>
      <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">
        ${p.alcance.replace(/\n/g, "<br/>")}
      </p>
    </div>` : ""}

    ${p.metodologia ? `
    <!-- Metodología FORJA -->
    <div style="background:linear-gradient(135deg,#1D1A70,#8560C0);
                border-radius:12px;padding:24px;margin-bottom:32px;">
      <h2 style="margin:0 0 12px;color:#ffffff;font-size:16px;font-weight:700;">
        Nuestra Metodología FORJA
      </h2>
      <p style="margin:0;color:#B8C5FF;font-size:14px;line-height:1.8;">
        ${p.metodologia.replace(/\n/g, "<br/>")}
      </p>
    </div>` : ""}

    ${p.entregables ? `
    <!-- Entregables -->
    <div style="margin-bottom:32px;">
      <h2 style="margin:0 0 12px;color:#1B3A5C;font-size:16px;font-weight:700;
                  padding-bottom:8px;border-bottom:2px solid #f3f4f6;">
        Entregables del Proyecto
      </h2>
      <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">
        ${p.entregables.replace(/\n/g, "<br/>")}
      </p>
    </div>` : ""}

    ${p.timeline ? `
    <!-- Timeline -->
    <div style="background:#f8faff;border:1px solid #e0e7ff;
                border-radius:12px;padding:24px;margin-bottom:32px;">
      <h2 style="margin:0 0 12px;color:#1B3A5C;font-size:16px;font-weight:700;">
        Cronograma de Implementación
      </h2>
      <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">
        ${p.timeline.replace(/\n/g, "<br/>")}
      </p>
    </div>` : ""}

    ${p.inversion ? `
    <!-- Inversión -->
    <div style="background:#fff7ed;border:2px solid #fed7aa;
                border-radius:12px;padding:24px;margin-bottom:32px;">
      <h2 style="margin:0 0 4px;color:#9a3412;font-size:12px;font-weight:700;
                  text-transform:uppercase;letter-spacing:1.5px;">
        Inversión
      </h2>
      ${p.valorUSD ? `
      <p style="margin:0 0 12px;color:#D4881E;font-size:28px;font-weight:800;">
        $${parseInt(String(p.valorUSD)).toLocaleString("es-CO")} USD
      </p>` : ""}
      <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">
        ${p.inversion.replace(/\n/g, "<br/>")}
      </p>
    </div>` : ""}

    ${p.terminos ? `
    <!-- Términos -->
    <div style="margin-bottom:32px;">
      <h2 style="margin:0 0 12px;color:#1B3A5C;font-size:16px;font-weight:700;
                  padding-bottom:8px;border-bottom:2px solid #f3f4f6;">
        Términos y Condiciones
      </h2>
      <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.8;">
        ${p.terminos.replace(/\n/g, "<br/>")}
      </p>
    </div>` : ""}

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:linear-gradient(135deg,#1D1A70,#8560C0);
                   border-radius:16px;margin-bottom:24px;">
      <tr><td style="padding:32px;text-align:center;">
        <p style="margin:0 0 8px;color:#B8C5FF;font-size:13px;">
          ¿Listo para dar el siguiente paso?
        </p>
        <p style="margin:0 0 18px;color:#ffffff;font-size:18px;font-weight:700;">
          Agenda tu sesión de inicio con nosotros
        </p>
        <a href="mailto:contacto@arquiron.com?subject=Acepto%20la%20propuesta%20${encodeURIComponent(p.titulo || "")}"
           style="display:inline-block;background:#D4881E;color:white;
                   padding:14px 36px;border-radius:999px;font-size:15px;
                   font-weight:700;text-decoration:none;">
          Aceptar Propuesta →
        </a>
        <p style="margin:14px 0 0;color:#B8C5FF;font-size:12px;">
          O responde este correo para coordinar una llamada
        </p>
      </td></tr>
    </table>

    <!-- Firma -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border-top:1px solid #f3f4f6;padding-top:24px;">
      <tr>
        <td>
          <p style="margin:0;color:#1B3A5C;font-size:14px;font-weight:700;">
            ${p.consultor || "Arquiron"}
          </p>
          <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">
            Arquiron
          </p>
          <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">
            contacto@arquiron.com
          </p>
        </td>
        <td style="text-align:right;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            Versión ${p.version || "v1.0"} · ${new Date().toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </td>
      </tr>
    </table>

  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#1B3A5C;border-radius:0 0 16px 16px;
                  padding:24px 48px;text-align:center;">
    <p style="margin:0 0 6px;color:#B8C5FF;font-size:13px;">
      Arquiron · Arquitectura Empresarial para PYMEs Latinoamericanas
    </p>
    <p style="margin:0;color:#6b7ab8;font-size:12px;">
      Bogotá, Colombia · Atención en toda Latinoamérica ·
      <a href="https://www.arquiron.com"
         style="color:#4CCED5;text-decoration:none;">
        www.arquiron.com
      </a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
