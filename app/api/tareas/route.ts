import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toTareaJSON } from "@/lib/tareas";
import { resolveConsultorIdByNombre } from "@/lib/consultores";
import { tareaCreateSchema, tareaUpdateSchema, formatZodError } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { TipoTarea, PrioridadTarea, EstadoTarea, Prisma } from "@prisma/client";

function parseEnum<T extends string>(
  value: string | undefined,
  allowed: Record<string, T>
): T | undefined {
  if (value === undefined) return undefined;
  const values = Object.values(allowed) as string[];
  return values.includes(value) ? (value as T) : undefined;
}

async function resolveLeadId(relacionadoCon: string | undefined, idReferencia: string | undefined) {
  if (relacionadoCon !== "Lead" || !idReferencia) return null;
  const lead = await prisma.lead.findUnique({ where: { id: idReferencia } });
  return lead?.id ?? null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tareas = await prisma.tarea.findMany({ include: { asignadoA: true } });

    const mapeadas = tareas.map(toTareaJSON).sort((a, b) => {
      const pendiente = ["PENDIENTE", "EN_PROGRESO"];
      const aActiva = pendiente.includes(a.estado);
      const bActiva = pendiente.includes(b.estado);
      if (aActiva && !bActiva) return -1;
      if (!aActiva && bActiva) return 1;
      const aFech = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : Infinity;
      const bFech = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : Infinity;
      return aFech - bFech;
    });

    return NextResponse.json(mapeadas);
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: "Error al cargar tareas", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const parsed = tareaCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const data = parsed.data;

    const { id: asignadoAId } = await resolveConsultorIdByNombre(data.asignadoA);
    const leadId = await resolveLeadId(data.relacionadoCon, data.idReferencia);

    const created = await prisma.tarea.create({
      data: {
        titulo: data.titulo || "",
        descripcion: data.descripcion,
        tipo: parseEnum(data.tipo, TipoTarea),
        prioridad: parseEnum(data.prioridad, PrioridadTarea) ?? "media",
        asignadoAId,
        leadId,
        relacionadoCon: data.relacionadoCon,
        idReferencia: data.idReferencia,
        empresa: data.empresa,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined,
        hora: data.hora,
        estado: parseEnum(data.estado, EstadoTarea) ?? "PENDIENTE",
        creadaPor: data.creadaPor || session.user?.name || undefined,
      },
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: "Error al crear tarea", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const parsed = tareaUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { id, ...rest } = parsed.data;

    const data: Prisma.TareaUpdateInput = {};

    if (rest.titulo !== undefined) data.titulo = rest.titulo;
    if (rest.descripcion !== undefined) data.descripcion = rest.descripcion;
    if (rest.tipo !== undefined) data.tipo = parseEnum(rest.tipo, TipoTarea) ?? null;
    if (rest.prioridad !== undefined) data.prioridad = parseEnum(rest.prioridad, PrioridadTarea) ?? null;
    if (rest.empresa !== undefined) data.empresa = rest.empresa;
    if (rest.hora !== undefined) data.hora = rest.hora;
    if (rest.creadaPor !== undefined) data.creadaPor = rest.creadaPor;
    if (rest.fechaVencimiento !== undefined) {
      data.fechaVencimiento = rest.fechaVencimiento ? new Date(rest.fechaVencimiento) : null;
    }

    if (rest.asignadoA !== undefined) {
      const { id: asignadoAId } = await resolveConsultorIdByNombre(rest.asignadoA);
      data.asignadoA = asignadoAId ? { connect: { id: asignadoAId } } : { disconnect: true };
    }

    if (rest.relacionadoCon !== undefined || rest.idReferencia !== undefined) {
      data.relacionadoCon = rest.relacionadoCon;
      data.idReferencia = rest.idReferencia;
      const leadId = await resolveLeadId(rest.relacionadoCon, rest.idReferencia);
      data.lead = leadId ? { connect: { id: leadId } } : { disconnect: true };
    }

    if (rest.estado !== undefined) {
      const estado = parseEnum(rest.estado, EstadoTarea) ?? "PENDIENTE";
      data.estado = estado;
      if (estado === "COMPLETADA") {
        data.completadaEn = new Date();
      } else if (rest.completadaEn !== undefined) {
        data.completadaEn = rest.completadaEn ? new Date(rest.completadaEn) : null;
      }
    } else if (rest.completadaEn !== undefined) {
      data.completadaEn = rest.completadaEn ? new Date(rest.completadaEn) : null;
    }

    await prisma.tarea.update({ where: { id }, data });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Error al actualizar", detail: err?.message },
      { status: 500 }
    );
  }
}
