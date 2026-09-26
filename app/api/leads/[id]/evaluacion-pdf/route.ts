import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generarHTMLEvaluacionPDF } from "@/lib/pdf/evaluacion-html";
import { generarPDF } from "@/lib/pdf/generar-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const num = (v: { toString(): string } | null | undefined) =>
  v === null || v === undefined ? 0 : parseFloat(v.toString()) || 0;

/**
 * Informe PDF de la Evaluación de Madurez de un lead, para que el consultor
 * llegue a la reunión con el detalle completo. Lee los datos guardados en el
 * CRM (no depende de la EME). Devuelve 404 si el lead no tiene evaluación.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }
    const igm = num(lead.indiceMadurez);
    if (igm <= 0) {
      return NextResponse.json(
        { error: "Este lead no ha completado la evaluación" },
        { status: 404 }
      );
    }

    const html = generarHTMLEvaluacionPDF({
      empresa: lead.nombreEmpresa,
      contacto: lead.nombreContacto,
      cargo: lead.cargo ?? undefined,
      email: lead.emailCorporativo,
      whatsapp: lead.whatsapp ?? undefined,
      sector: lead.sector ?? undefined,
      tamano: lead.tamano ?? undefined,
      pais: lead.pais ?? undefined,
      ciudad: lead.ciudad ?? undefined,
      fechaRegistro: lead.createdAt.toISOString(),
      igm,
      autoevaluacion: lead.madurezAutoevaluada ? num(lead.madurezAutoevaluada) : null,
      dims: [
        lead.dim1, lead.dim2, lead.dim3, lead.dim4, lead.dim5,
        lead.dim6, lead.dim7, lead.dim8, lead.dim9, lead.dim10,
      ].map(num),
      servicioSugeridoForja: lead.servicioSugeridoForja ?? undefined,
      scoreLead: lead.scoreLead ? num(lead.scoreLead) : null,
      clasificacion: lead.clasificacion ?? undefined,
      accionRecomendada: lead.accionRecomendada ?? undefined,
    });

    const pdf = await generarPDF(html);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Evaluacion-Madurez-${lead.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error GET /api/leads/[id]/evaluacion-pdf:", err?.message);
    return NextResponse.json(
      { error: "Error al generar el PDF", detail: err?.message },
      { status: 500 }
    );
  }
}
