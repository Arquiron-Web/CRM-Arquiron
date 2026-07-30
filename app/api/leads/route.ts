import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toLeadJSON } from "@/lib/leads";
import { resolveConsultorIdByNombre } from "@/lib/consultores";
import { leadUpdateSchema, formatZodError } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { Prisma, EstadoLead } from "@prisma/client";
import { toDecimal } from "@/lib/decimal";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesión expirada. Vuelve a iniciar sesión." },
        { status: 401 }
      );
    }

    const leads = await prisma.lead.findMany({
      include: { consultor: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(leads.map(toLeadJSON));
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error detallado:", err?.message || error);
    return NextResponse.json(
      { error: "Error interno del servidor", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesión expirada. Vuelve a iniciar sesión." },
        { status: 401 }
      );
    }

    const parsed = leadUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { id, estadoLead, consultorAsignado, fechaContacto, notas, indiceMadurez } =
      parsed.data;

    const data: Prisma.LeadUpdateInput = {};

    if (estadoLead !== undefined) {
      if (!Object.values(EstadoLead).includes(estadoLead as EstadoLead)) {
        return NextResponse.json(
          { error: `estadoLead inválido: ${estadoLead}` },
          { status: 400 }
        );
      }
      data.estadoLead = estadoLead as EstadoLead;
    }

    if (consultorAsignado !== undefined) {
      const { id: consultorId, found } = await resolveConsultorIdByNombre(consultorAsignado);
      if (!found) {
        return NextResponse.json(
          { error: "Consultor no encontrado. Selecciona uno de la lista." },
          { status: 400 }
        );
      }
      data.consultor = consultorId
        ? { connect: { id: consultorId } }
        : { disconnect: true };
    }

    if (fechaContacto !== undefined) {
      data.fechaContacto = fechaContacto ? new Date(fechaContacto) : null;
    }
    if (notas !== undefined) data.notas = notas;
    const igmDecimal = toDecimal(indiceMadurez);
    if (igmDecimal !== undefined) data.indiceMadurez = igmDecimal;

    await prisma.lead.update({ where: { id }, data });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("Error detallado:", err?.message || error);

    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Error al actualizar", detail: err?.message },
      { status: 500 }
    );
  }
}
