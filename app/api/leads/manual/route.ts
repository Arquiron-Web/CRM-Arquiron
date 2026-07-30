import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { mapRetoPrincipalToServicio } from "@/lib/crm-utils";
import { resolveConsultorIdByNombre } from "@/lib/consultores";
import { leadManualSchema, formatZodError } from "@/lib/schemas";
import { toDecimal } from "@/lib/decimal";

const esSi = (v: string | undefined) => (v || "").trim().toLowerCase() === "si";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesión expirada. Vuelve a iniciar sesión." },
        { status: 401 }
      );
    }

    const parsed = leadManualSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const data = parsed.data;

    const servicioSugerido =
      data.servicioSugeridoForja ??
      (data.retoPrincipal ? mapRetoPrincipalToServicio(data.retoPrincipal) : "");

    const notas = data.referidoPor
      ? `Referido por: ${data.referidoPor}${data.notas ? " | " + data.notas : ""}`
      : data.notas || "";

    const { id: consultorId } = await resolveConsultorIdByNombre(data.consultorAsignado);

    const ingresoAnual =
      data.ingresosAnuales !== undefined
        ? String(data.ingresosAnuales)
        : data.valor !== undefined
          ? String(data.valor)
          : "";

    const created = await prisma.lead.create({
      data: {
        nombreEmpresa: data.nombreEmpresa,
        sector: data.sector,
        tamano: data.tamano,
        pais: data.pais,
        ciudad: data.ciudad,
        retoPrincipal: data.retoPrincipal,
        anosOperacion: data.anosOperacion,
        ingresoAnual,
        exporta: data.exporta !== undefined ? esSi(data.exporta) : undefined,
        nombreContacto: data.nombreContacto,
        cargo: data.cargo,
        emailCorporativo: data.emailCorporativo,
        whatsapp: data.whatsapp,
        momentoContacto: data.momentoContacto,
        comoNosConocio: data.comoNosConocio,
        servicioSugeridoForja: servicioSugerido || undefined,
        estadoLead: "NUEVO",
        fuenteFormulario: data.fuenteFormulario || "CRM_Manual",
        aceptaPoliticaDatos: data.aceptaPolitica !== undefined ? esSi(data.aceptaPolitica) : true,
        consultorId,
        notas,
        scoreLead: toDecimal(data.scoreLead),
      },
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error("=== ERROR en /api/leads/manual ===", err?.message);

    return NextResponse.json(
      { error: "Error al guardar el lead", detail: err?.message },
      { status: 500 }
    );
  }
}
