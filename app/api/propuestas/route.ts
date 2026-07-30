import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toPropuestaJSON } from "@/lib/propuestas";
import { resolveConsultorIdByNombre } from "@/lib/consultores";
import { propuestaCreateSchema, propuestaUpdateSchema, formatZodError } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { EstadoPropuesta } from "@prisma/client";
import { toDecimal } from "@/lib/decimal";

function parseEnum<T extends string>(
  value: string | undefined,
  allowed: Record<string, T>
): T | undefined {
  if (value === undefined) return undefined;
  const values = Object.values(allowed) as string[];
  return values.includes(value) ? (value as T) : undefined;
}

async function resolveLeadId(idLead: string | undefined) {
  if (!idLead) return null;
  const lead = await prisma.lead.findUnique({ where: { id: idLead } });
  return lead?.id ?? null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesión expirada. Vuelve a iniciar sesión." },
        { status: 401 }
      );
    }

    const propuestas = await prisma.propuesta.findMany({
      include: { consultor: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(propuestas.map(toPropuestaJSON));
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error GET /api/propuestas:", err?.message);
    return NextResponse.json(
      { error: "Error al cargar propuestas", detail: err?.message },
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
    const parsed = propuestaCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const data = parsed.data;

    const { id: consultorId } = await resolveConsultorIdByNombre(data.consultor);
    const leadId = await resolveLeadId(data.idLead);

    const created = await prisma.propuesta.create({
      data: {
        id: data.id || undefined,
        titulo: data.titulo || "",
        leadId,
        emailCliente: data.emailCliente,
        empresaCliente: data.empresaCliente,
        contacto: data.contacto,
        consultorId,
        servicioForja: data.servicioForja,
        introduccion: data.introduccion,
        diagnostico: data.diagnostico,
        alcance: data.alcance,
        metodologia: data.metodologia,
        entregables: data.entregables,
        timeline: data.timeline,
        inversion: data.inversion,
        terminos: data.terminos,
        valorUSD: toDecimal(data.valorUSD),
        estado: parseEnum(data.estado, EstadoPropuesta) ?? "Borrador",
        version: data.version || "v1.0",
        plantilla: data.plantilla || "Estándar",
        fechaCreacion: data.fechaCreacion ? new Date(data.fechaCreacion) : new Date(),
        fechaEnvio: data.fechaEnvio ? new Date(data.fechaEnvio) : undefined,
        fechaVisto: data.fechaVisto ? new Date(data.fechaVisto) : undefined,
        notasInternas: data.notasInternas,
      },
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error POST /api/propuestas:", err?.message);
    return NextResponse.json(
      { error: "Error al guardar propuesta", detail: err?.message },
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
    const parsed = propuestaUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { id, ...campos } = parsed.data;

    const { id: consultorId } = await resolveConsultorIdByNombre(campos.consultor);
    const leadId = await resolveLeadId(campos.idLead);

    await prisma.propuesta.update({
      where: { id },
      data: {
        titulo: campos.titulo,
        leadId,
        emailCliente: campos.emailCliente,
        empresaCliente: campos.empresaCliente,
        contacto: campos.contacto,
        consultorId,
        servicioForja: campos.servicioForja,
        introduccion: campos.introduccion,
        diagnostico: campos.diagnostico,
        alcance: campos.alcance,
        metodologia: campos.metodologia,
        entregables: campos.entregables,
        timeline: campos.timeline,
        inversion: campos.inversion,
        terminos: campos.terminos,
        valorUSD: toDecimal(campos.valorUSD),
        estado: parseEnum(campos.estado, EstadoPropuesta),
        version: campos.version,
        plantilla: campos.plantilla,
        fechaEnvio: campos.fechaEnvio ? new Date(campos.fechaEnvio) : undefined,
        fechaVisto: campos.fechaVisto ? new Date(campos.fechaVisto) : undefined,
        notasInternas: campos.notasInternas,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("Error PUT /api/propuestas:", err?.message);
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Error al actualizar propuesta", detail: err?.message },
      { status: 500 }
    );
  }
}
