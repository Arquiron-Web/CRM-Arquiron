import { prisma } from "@/lib/prisma";
import { verificarTokenNPS } from "@/lib/nps-token";

function paginaRespuesta(estado: "ok" | "error", score: number): string {
  const categoria =
    score >= 9 ? "Promotor" : score >= 7 ? "Pasivo" : score >= 0 ? "Detractor" : "";
  const color =
    score >= 9 ? "#22c55e" : score >= 7 ? "#eab308" : score >= 0 ? "#ef4444" : "#9ca3af";
  const emoji =
    score >= 9 ? "🎉" : score >= 7 ? "😊" : score >= 0 ? "🤝" : "⚠️";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Gracias — Arquiron</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;
         min-height:100vh;display:flex;align-items:center;
         justify-content:center;padding:24px}
    .card{background:white;border-radius:24px;padding:48px 40px;
          max-width:480px;width:100%;text-align:center;
          box-shadow:0 4px 24px rgba(0,0,0,0.08)}
    .score{width:80px;height:80px;border-radius:50%;
           display:flex;align-items:center;justify-content:center;
           font-size:32px;font-weight:900;color:white;margin:0 auto 24px}
    h1{color:#1B3A5C;font-size:24px;font-weight:800;margin-bottom:8px}
    p{color:#6b7280;font-size:15px;line-height:1.6;margin-bottom:32px}
    .brand{background:linear-gradient(135deg,#1D1A70,#1B3A5C);
           border-radius:16px;padding:24px}
    .brand-label{color:#B8C5FF;font-size:11px;font-weight:700;
                 text-transform:uppercase;letter-spacing:2px;
                 margin-bottom:4px}
    .brand-name{color:white;font-size:14px}
    .brand-link{color:#4CCED5;text-decoration:none;font-size:13px}
  </style>
</head>
<body>
  <div class="card">
    ${estado === "ok" ? `
    <div class="score" style="background:${color}">
      ${score}
    </div>
    <h1>${emoji} ¡Gracias por tu respuesta!</h1>
    <p>
      Tu puntuación de
      <strong style="color:${color}">${score}/10</strong>
      (${categoria}) ha sido registrada exitosamente.<br/><br/>
      Tu opinión nos ayuda a seguir mejorando y a servir mejor
      a las PYMEs latinoamericanas.
    </p>
    ` : `
    <div class="score" style="background:#9ca3af">!</div>
    <h1>⚠️ Enlace no válido</h1>
    <p>Este enlace ya fue utilizado o no es válido.<br/>
       Si tienes dudas contáctanos directamente.</p>
    `}
    <div class="brand">
      <p class="brand-label">Arquiron</p>
      <p class="brand-name">Arquitectura Empresarial para PYMEs</p>
      <a class="brand-link"
         href="https://www.arquiron.com">
        www.arquiron.com
      </a>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const score = parseInt(searchParams.get("score") ?? "-1", 10);

    if (score < 0 || score > 10) {
      return new Response(paginaRespuesta("error", -1), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const payload = verificarTokenNPS(params.token);

    if (!payload?.id) {
      return new Response(paginaRespuesta("error", -1), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const fecha = new Date().toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    await prisma.proyecto.update({
      where: { id: payload.id },
      data: {
        npsScore: score,
        npsDateSaved: fecha,
        npsComment: "",
      },
    });

    return new Response(paginaRespuesta("ok", score), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error NPS público:", msg);
    return new Response(paginaRespuesta("error", -1), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
