import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toProyectoJSON } from "@/lib/proyectos";
import { resolveConsultorIdByNombre } from "@/lib/consultores";
import { proyectoCreateSchema, proyectoUpdateSchema, formatZodError } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { EstadoPago, EstadoProyecto } from "@prisma/client";
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

const toInt = (v: string | number | undefined) => {
  if (v === undefined) return undefined;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : undefined;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const proyectos = await prisma.proyecto.findMany({
      include: { consultor: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(proyectos.map(toProyectoJSON));
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error GET /api/proyectos:", err?.message || error);
    return NextResponse.json(
      { error: "Error al cargar proyectos", detail: err?.message },
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

    const parsed = proyectoCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const data = parsed.data;

    const { id: consultorId } = await resolveConsultorIdByNombre(data.consultor);
    const leadId = await resolveLeadId(data.idLead);

    const created = await prisma.proyecto.create({
      data: {
        id: data.id || undefined,
        nombre: data.nombre || "",
        leadId,
        empresaCliente: data.empresaCliente,
        contacto: data.contacto,
        emailCliente: data.emailCliente,
        consultorId,
        servicioForja: data.servicioForja,
        valorUSD: toDecimal(data.valorUSD),
        etapaForja: data.etapaForja || "Fijar",
        faseActual: data.faseActual,
        igmInicial: toDecimal(data.igmInicial),
        igmFinal: toDecimal(data.igmFinal),
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
        fechaCierreEst: data.fechaCierreEst ? new Date(data.fechaCierreEst) : undefined,
        fechaCierreReal: data.fechaCierreReal ? new Date(data.fechaCierreReal) : undefined,
        estadoPago: parseEnum(data.estadoPago, EstadoPago) ?? "PENDIENTE",
        porcentajeAvance: toInt(data.porcentajeAvance) ?? 0,
        proximaAccion: data.proximaAccion,
        fechaProximaAccion: data.fechaProximaAccion ? new Date(data.fechaProximaAccion) : undefined,
        entregablesPendientes: data.entregablesPendientes,
        notas: data.notas,
        estadoProyecto: parseEnum(data.estadoProyecto, EstadoProyecto) ?? "ACTIVO",
      },
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error POST /api/proyectos:", err?.message || error);
    return NextResponse.json(
      { error: "Error al crear proyecto", detail: err?.message },
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

    const parsed = proyectoUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { id, soloNPS, npsScore, npsDateSaved, npsComentario, ...data } = parsed.data;

    if (soloNPS) {
      await prisma.proyecto.update({
        where: { id },
        data: {
          npsScore: toInt(npsScore),
          npsDateSaved: npsDateSaved ?? undefined,
          npsComment: npsComentario,
        },
      });
      return NextResponse.json({ success: true });
    }

    const { id: consultorId } = await resolveConsultorIdByNombre(data.consultor);
    const leadId = await resolveLeadId(data.idLead);

    await prisma.proyecto.update({
      where: { id },
      data: {
        nombre: data.nombre,
        leadId,
        empresaCliente: data.empresaCliente,
        contacto: data.contacto,
        emailCliente: data.emailCliente,
        consultorId,
        servicioForja: data.servicioForja,
        valorUSD: toDecimal(data.valorUSD),
        etapaForja: data.etapaForja,
        faseActual: data.faseActual,
        igmInicial: toDecimal(data.igmInicial),
        igmFinal: toDecimal(data.igmFinal),
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        fechaCierreEst: data.fechaCierreEst ? new Date(data.fechaCierreEst) : undefined,
        fechaCierreReal: data.fechaCierreReal ? new Date(data.fechaCierreReal) : undefined,
        estadoPago: parseEnum(data.estadoPago, EstadoPago),
        porcentajeAvance: toInt(data.porcentajeAvance),
        proximaAccion: data.proximaAccion,
        fechaProximaAccion: data.fechaProximaAccion ? new Date(data.fechaProximaAccion) : undefined,
        entregablesPendientes: data.entregablesPendientes,
        notas: data.notas,
        estadoProyecto: parseEnum(data.estadoProyecto, EstadoProyecto),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("Error PUT /api/proyectos:", err?.message || error);
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Error al actualizar", detail: err?.message },
      { status: 500 }
    );
  }
}
