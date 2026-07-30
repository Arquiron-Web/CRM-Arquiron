import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toInteraccionJSON } from "@/lib/interacciones";
import { resolveConsultorIdByNombre } from "@/lib/consultores";
import { interaccionCreateSchema, formatZodError } from "@/lib/schemas";
import { NextResponse } from "next/server";

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

    const interacciones = await prisma.interaccion.findMany({
      include: { consultor: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(interacciones.map(toInteraccionJSON));
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error detallado:", err?.message || error);
    return NextResponse.json(
      { error: "Error al cargar interacciones", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesión expirada. Vuelve a iniciar sesión." },
        { status: 401 }
      );
    }

    const parsed = interaccionCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const data = parsed.data;

    const { id: consultorId } = await resolveConsultorIdByNombre(data.consultor);
    const leadId = data.idLead
      ? (await prisma.lead.findUnique({ where: { id: data.idLead } }))?.id ?? null
      : null;

    const duracion = data.duracion ? parseInt(data.duracion, 10) : undefined;

    await prisma.interaccion.create({
      data: {
        leadId,
        emailLead: data.emailLead,
        empresa: data.empresa,
        contacto: data.contacto,
        tipo: data.tipo,
        titulo: data.titulo,
        descripcion: data.descripcion,
        resultado: data.resultado,
        duracion: Number.isFinite(duracion) ? duracion : undefined,
        consultorId,
        fecha: data.fecha ? new Date(data.fecha) : undefined,
        hora: data.hora,
        archivos: data.archivos || "0",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error detallado:", err?.message || error);
    return NextResponse.json(
      { error: "Error al guardar la interacción", detail: err?.message },
      { status: 500 }
    );
  }
}
