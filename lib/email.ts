import { Resend } from "resend";
import type { Lead } from "@prisma/client";
import { getPaisLabel, getRetoLabel } from "@/lib/pipeline-utils";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = "ARQUIRON <contacto@arquiron.com>";
const NOTIFICACIONES_INTERNAS = "contacto@arquiron.com";

// Paleta de marca Arquiron.
const AZUL_MARINO = "#1B3A5C";
const AZUL_MARINO_OSCURO = "#122942";
const TEAL_VIVO = "#4CCED5";
const AMBAR_QUIRON = "#D4881E";

// Logo alojado en una URL pública (no se embebe en base64: el archivo
// fuente pesa >800KB y Outlook bloquea imágenes data-URI). Configurar
// EMAIL_LOGO_URL cuando el sitio público tenga el logo disponible; sin
// ella se usa el wordmark de texto como respaldo.
const LOGO_URL = process.env.EMAIL_LOGO_URL || "";

const MOMENTO_LABELS: Record<string, string> = {
  urgente: "Lo antes posible",
  semana: "Esta semana",
  mes: "En el próximo mes",
  explorando: "Solo está explorando",
};

function humanizar(valor?: string | null): string {
  if (!valor) return "";
  return valor
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function filaTabla(etiqueta: string, valor?: string | null): string {
  if (!valor) return "";
  return `<tr>
    <td style="padding:8px 12px 8px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #eef1f8;">${etiqueta}</td>
    <td style="padding:8px 0;color:${AZUL_MARINO};font-size:13px;font-weight:600;border-bottom:1px solid #eef1f8;">${valor}</td>
  </tr>`;
}

function boton(texto: string, href: string, color: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 4px;">
    <tr><td style="background:${color};border-radius:8px;">
      <a href="${href}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">${texto}</a>
    </td></tr>
  </table>`;
}

function envoltura(contenidoHTML: string): string {
  const marca = LOGO_URL
    ? `<img src="${LOGO_URL}" alt="Arquiron" height="34" style="display:block;height:34px;" />`
    : `<p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:1px;">ARQUIRON</p>`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#eef1f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(27,58,92,0.12);">
  <tr><td style="background:linear-gradient(135deg,${AZUL_MARINO_OSCURO},${AZUL_MARINO});padding:36px 40px 28px;text-align:center;">
    ${marca}
    <p style="margin:10px 0 0;color:#9FB4CC;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Arquitectura Empresarial para PYMEs</p>
  </td></tr>
  <tr><td style="height:4px;background:linear-gradient(90deg,${TEAL_VIVO},${AMBAR_QUIRON});line-height:0;font-size:0;">&nbsp;</td></tr>
  <tr><td style="background:#ffffff;padding:40px 40px 36px;">
    ${contenidoHTML}
  </td></tr>
  <tr><td style="background:${AZUL_MARINO_OSCURO};padding:22px 40px;text-align:center;">
    <p style="margin:0;color:#9FB4CC;font-size:12px;">Arquiron · <a href="https://www.arquiron.com" style="color:${TEAL_VIVO};text-decoration:none;font-weight:600;">www.arquiron.com</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Envía los correos de un lead nuevo: confirmación al propio lead (si dejó
 * email) y aviso interno al equipo. Se llama desde crearLead() para que
 * dispare sin importar el origen (Portal, formulario manual del CRM,
 * Evaluación de Madurez). Nunca lanza — un fallo de envío no debe tumbar
 * la creación del lead.
 */
export async function notificarNuevoLead(lead: Lead): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY no configurada — se omite el envío de correos del lead", lead.id);
    return;
  }

  const esNewsletter = lead.fuenteFormulario === "Portal_Newsletter";

  await Promise.allSettled([
    enviarConfirmacionLead(lead, esNewsletter),
    enviarAvisoInterno(lead, esNewsletter),
  ]);
}

async function enviarConfirmacionLead(lead: Lead, esNewsletter: boolean): Promise<void> {
  if (!resend || !lead.emailCorporativo) return;

  const primerNombre = (lead.nombreContacto || "").split(" ")[0] || "";

  const contenido = esNewsletter
    ? `<p style="margin:0 0 4px;color:${AMBAR_QUIRON};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">Suscripción confirmada</p>
       <p style="margin:0 0 8px;color:${AZUL_MARINO};font-size:20px;font-weight:800;">¡Gracias por suscribirte!</p>
       <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7;">
         Ya estás suscrito a los insights de ARQUIRON para líderes de PYMEs. Pronto recibirás contenido útil sobre estrategia, operaciones y transformación digital.
       </p>`
    : `<p style="margin:0 0 4px;color:${AMBAR_QUIRON};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">Registro recibido</p>
       <p style="margin:0 0 8px;color:${AZUL_MARINO};font-size:20px;font-weight:800;">¡Hola${primerNombre ? " " + primerNombre : ""}!</p>
       <p style="margin:0 0 4px;color:#4b5563;font-size:14px;line-height:1.7;">
         Recibimos tu registro. Alguien de nuestro equipo te contactará en menos de 24 horas hábiles para coordinar tu diagnóstico gratuito.
       </p>
       ${boton("Escribir por WhatsApp", "https://wa.me/573122415413", TEAL_VIVO)}
       <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
         O si prefieres, escríbenos directo al +57 312 241 5413.
       </p>`;

  try {
    await resend.emails.send({
      from: FROM,
      to: lead.emailCorporativo,
      subject: esNewsletter ? "Suscripción confirmada — Insights ARQUIRON" : "Recibimos tu registro — ARQUIRON",
      html: envoltura(contenido),
    });
  } catch (error) {
    console.error("Error enviando confirmación de lead:", lead.id, error);
  }
}

async function enviarAvisoInterno(lead: Lead, esNewsletter: boolean): Promise<void> {
  if (!resend) return;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const linkCRM = `${baseUrl}/leads?search=${encodeURIComponent(lead.emailCorporativo || lead.nombreContacto)}`;

  const filas = esNewsletter
    ? [filaTabla("Email", lead.emailCorporativo)].join("")
    : [
        filaTabla("Nombre", lead.nombreContacto),
        filaTabla("Empresa", lead.nombreEmpresa),
        filaTabla("Email", lead.emailCorporativo),
        filaTabla("WhatsApp", lead.whatsapp),
        filaTabla("Cargo", lead.cargo),
        filaTabla("Reto principal", lead.retoPrincipal ? getRetoLabel(lead.retoPrincipal) : ""),
        filaTabla("Sector", humanizar(lead.sector)),
        filaTabla("Tamaño", humanizar(lead.tamano)),
        filaTabla("País", lead.pais ? getPaisLabel(lead.pais) : ""),
        filaTabla("Ciudad", lead.ciudad),
        filaTabla("¿Cuándo contactar?", lead.momentoContacto ? MOMENTO_LABELS[lead.momentoContacto] || humanizar(lead.momentoContacto) : ""),
        filaTabla("¿Cómo nos conoció?", humanizar(lead.comoNosConocio)),
        filaTabla("Score", lead.scoreLead != null ? String(lead.scoreLead) : ""),
        filaTabla("Clasificación", lead.clasificacion),
        filaTabla("Fuente", lead.fuenteFormulario),
      ].join("");

  const contenido = `
    <p style="margin:0 0 4px;color:${AMBAR_QUIRON};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">
      ${esNewsletter ? "Nueva suscripción" : "Nuevo lead"}
    </p>
    <p style="margin:0 0 8px;color:${AZUL_MARINO};font-size:20px;font-weight:800;">
      ${esNewsletter ? "Nueva suscripción a Insights" : "Nuevo lead desde el Portal"}
    </p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.7;">
      ${esNewsletter ? "Alguien se suscribió al newsletter desde el sitio web." : "Alguien registró sus datos en el sitio web o el CRM."}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #e0e7ff;border-radius:12px;padding:4px 16px;">
      ${filas}
    </table>
    ${boton("Ver en el CRM →", linkCRM, AZUL_MARINO)}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: NOTIFICACIONES_INTERNAS,
      subject: esNewsletter
        ? `Nueva suscripción: ${lead.emailCorporativo}`
        : `Nuevo lead: ${lead.nombreContacto}${lead.nombreEmpresa ? " (" + lead.nombreEmpresa + ")" : ""}`,
      html: envoltura(contenido),
    });
  } catch (error) {
    console.error("Error enviando aviso interno de lead:", lead.id, error);
  }
}
