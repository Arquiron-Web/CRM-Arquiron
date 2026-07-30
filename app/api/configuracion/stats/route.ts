import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [totalLeads, totalPropuestas, totalInteracciones, totalConsultores] =
      await Promise.all([
        prisma.lead.count(),
        prisma.propuesta.count(),
        prisma.interaccion.count(),
        prisma.consultor.count({ where: { activo: true } }),
      ]);

    return NextResponse.json({
      totalLeads,
      totalPropuestas,
      totalInteracciones,
      totalConsultores,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error GET /api/configuracion/stats:", err?.message);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
