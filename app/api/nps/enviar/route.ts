import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { crearTokenNPS } from "@/lib/nps-token";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session?.user as { accessToken?: string })?.accessToken;

    if (!session || !accessToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { proyecto } = await request.json();

    const token = crearTokenNPS(proyecto.id, proyecto.emailCliente);

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const scores = Array.from({ length: 11 }, (_, i) => i);

    const buildLink = (score: number) =>
      `${baseUrl}/api/nps/${token}?score=${score}`;

    const botonesHTML = scores
      .map((score) => {
        const color =
          score >= 9 ? "#22c55e" : score >= 7 ? "#eab308" : "#ef4444";
        return `<a href="${buildLink(score)}"
                   style="display:inline-block;width:36px;height:36px;
                          line-height:36px;text-align:center;
                          background:${color};color:white;
                          border-radius:8px;font-size:14px;
                          font-weight:700;text-decoration:none;
                          margin:3px;">${score}</a>`;
      })
      .join("");

    const emailHTML = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4ff;
             font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f0f4ff;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
       style="max-width:600px;width:100%;">

  <tr><td style="background:linear-gradient(135deg,#1D1A70,#1B3A5C);
                  border-radius:16px 16px 0 0;
                  padding:40px 48px;text-align:center;">
    <p style="margin:0 0 12px;color:#B8C5FF;font-size:11px;
               font-weight:700;text-transform:uppercase;letter-spacing:2px;">
      Arquiron
    </p>
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">
      ¿Cómo fue tu experiencia?
    </h1>
    <p style="margin:8px 0 0;color:#B8C5FF;font-size:14px;">
      Proyecto: ${proyecto.nombre}
    </p>
  </td></tr>

  <tr><td style="background:#ffffff;padding:40px 48px;text-align:center;">
    <p style="margin:0 0 8px;color:#1B3A5C;font-size:16px;font-weight:700;">
      Estimado/a ${proyecto.contacto || "cliente"},
    </p>
    <p style="margin:0 0 28px;color:#4b5563;font-size:14px;line-height:1.7;">
      Hemos finalizado el proyecto
      <strong>${proyecto.nombre}</strong> con
      <strong>${proyecto.empresaCliente}</strong>.
      Tu opinión es fundamental para seguir mejorando.
    </p>

    <div style="background:#f8faff;border:1px solid #e0e7ff;
                border-radius:16px;padding:28px;margin-bottom:28px;">
      <p style="margin:0 0 20px;color:#1B3A5C;font-size:15px;font-weight:700;">
        Del 0 al 10, ¿qué tan probable es que recomiendes
        Arquiron a otros empresarios?
      </p>

      <div style="margin-bottom:12px;">${botonesHTML}</div>

      <div style="display:flex;justify-content:space-between;
                  padding:0 4px;">
        <p style="margin:0;color:#9ca3af;font-size:11px;">
          Muy improbable
        </p>
        <p style="margin:0;color:#9ca3af;font-size:11px;">
          Muy probable
        </p>
      </div>
    </div>

    <p style="margin:0;color:#9ca3af;font-size:12px;">
      Solo toma 1 segundo. Haz clic en tu puntuación.
    </p>
  </td></tr>

  <tr><td style="background:#1B3A5C;border-radius:0 0 16px 16px;
                  padding:20px 48px;text-align:center;">
    <p style="margin:0;color:#B8C5FF;font-size:12px;">
      Arquiron ·
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

    const endpoint = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT;
    if (!endpoint) throw new Error("Endpoint no configurado");

    const res = await fetch(endpoint, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({
        tipo: "nps_email",
        fuenteFormulario: "CRM_NPS",
        emailCorporativo: proyecto.emailCliente,
        nombreContacto: proyecto.contacto,
        nombreEmpresa: proyecto.empresaCliente,
        htmlBody: emailHTML,
        asunto: `¿Cómo fue tu experiencia con Arquiron? — ${proyecto.nombre}`,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Apps Script NPS error:", res.status, text);
      throw new Error("El servidor de correo no respondió correctamente");
    }

    let body: { success?: boolean; error?: string };
    try {
      body = (await res.json()) as { success?: boolean; error?: string };
    } catch {
      throw new Error("Respuesta inválida del servidor de correo");
    }
    if (body && typeof body === "object" && body.success !== true) {
      throw new Error(body.error || "Error al enviar el email");
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: "Error al enviar", detail: err?.message },
      { status: 500 }
    );
  }
}
