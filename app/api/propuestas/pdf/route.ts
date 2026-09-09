import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generarHTMLPropuestaPDF } from "@/lib/pdf/propuesta-html";
import { generarPropuestaPDF } from "@/lib/pdf/generar-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Genera el PDF de una propuesta a partir del payload recibido (guardada
 * o borrador aún no guardado — por eso es POST con body en vez de GET
 * por id). Lo usa tanto la Vista previa (iframe) como, internamente,
 * /api/propuestas/enviar para el adjunto del correo.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const propuesta = await request.json();
    const html = generarHTMLPropuestaPDF(propuesta);
    const pdf = await generarPropuestaPDF(html);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Propuesta-${propuesta.codigoPropuesta || propuesta.id || "arquiron"}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error POST /api/propuestas/pdf:", err?.message);
    return NextResponse.json(
      { error: "Error al generar el PDF", detail: err?.message },
      { status: 500 }
    );
  }
}
