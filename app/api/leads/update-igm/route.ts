import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leadUpdateIgmSchema, formatZodError } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { toDecimal } from "@/lib/decimal";
import { calcularScoreLead } from "@/lib/lead-scoring";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesión expirada. Vuelve a iniciar sesión." },
        { status: 401 }
      );
    }

    const parsed = leadUpdateIgmSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { idLead, igm } = parsed.data;
    const igmDecimal = toDecimal(igm);
    if (igmDecimal === undefined) {
      return NextResponse.json({ error: "igm inválido" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: idLead } });
    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    const resultado = calcularScoreLead({
      momentoContacto: lead.momentoContacto,
      comoNosConocio: lead.comoNosConocio,
      fuenteFormulario: lead.fuenteFormulario,
      tamano: lead.tamano,
      whatsapp: lead.whatsapp,
      madurezAutoevaluada: lead.madurezAutoevaluada ? Number(lead.madurezAutoevaluada) : null,
      indiceMadurez: Number(igmDecimal),
    });

    await prisma.lead.update({
      where: { id: idLead },
      data: {
        indiceMadurez: igmDecimal,
        scoreLead: toDecimal(resultado.scoreLead),
        clasificacion: resultado.clasificacion,
        accionRecomendada: resultado.accionRecomendada,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("Error actualizando IGM:", err?.message || error);

    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Error al actualizar IGM", detail: err?.message },
      { status: 500 }
    );
  }
}
