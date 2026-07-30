import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toConsultorJSON } from "@/lib/consultores";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const consultores = await prisma.consultor.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(consultores.map(toConsultorJSON));
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error GET /api/consultores:", err?.message);
    return NextResponse.json(
      { error: "Error al cargar consultores", detail: err?.message },
      { status: 500 }
    );
  }
}
