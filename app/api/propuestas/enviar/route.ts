import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generarHTMLPropuestaPDF } from "@/lib/pdf/propuesta-html";
import { generarPDF } from "@/lib/pdf/generar-pdf";
import { enviarPropuestaCliente } from "@/lib/email";
import { toPropuestaJSON } from "@/lib/propuestas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Envía la propuesta comercial al cliente: genera el PDF fiel a la
 * plantilla a partir del estado canónico en BD, lo adjunta a un correo
 * con Resend (lib/email.ts) y marca la propuesta como "Enviada".
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Falta el id de la propuesta" }, { status: 400 });
    }

    const propuesta = await prisma.propuesta.findUnique({
      where: { id },
      include: { consultor: true },
    });
    if (!propuesta) {
      return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 });
    }
    if (!propuesta.emailCliente) {
      return NextResponse.json({ error: "No hay email de cliente" }, { status: 400 });
    }

    // toPropuestaJSON ya normaliza todos los campos (null → "", Decimal/Date →
    // string): es el mismo shape que el formulario envía a /api/propuestas/pdf.
    const html = generarHTMLPropuestaPDF(toPropuestaJSON(propuesta));
    const pdf = await generarPDF(html);

    const resultado = await enviarPropuestaCliente(propuesta, pdf);
    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error || "Error al enviar" }, { status: 502 });
    }

    const fechaEnvio = new Date();
    await prisma.propuesta.update({
      where: { id },
      data: { estado: "Enviada", fechaEnvio },
    });

    return NextResponse.json({ success: true, fechaEnvio: fechaEnvio.toISOString() });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error POST /api/propuestas/enviar:", err?.message);
    return NextResponse.json(
      { error: "Error al enviar", detail: err?.message },
      { status: 500 }
    );
  }
}
