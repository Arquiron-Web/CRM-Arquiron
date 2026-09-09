import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toPropuestaJSON } from "@/lib/propuestas";
import { resolveConsultorIdByNombre } from "@/lib/consultores";
import { propuestaCreateSchema, propuestaUpdateSchema, formatZodError } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { EstadoPropuesta } from "@prisma/client";
import { toDecimal, toInt } from "@/lib/decimal";

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
        subtitulo: data.subtitulo,
        leadId,
        emailCliente: data.emailCliente,
        empresaCliente: data.empresaCliente,
        contacto: data.contacto,
        cargoContacto: data.cargoContacto,
        sectorCliente: data.sectorCliente,
        ciudadPais: data.ciudadPais,
        nitCliente: data.nitCliente,
        consultorId,
        servicioForja: data.servicioForja,

        codigoPropuesta: data.codigoPropuesta,
        fechaValidez: data.fechaValidez ? new Date(data.fechaValidez) : undefined,

        fraseClave: data.fraseClave,
        retoDescripcion: data.retoDescripcion,
        duracionMeses: toInt(data.duracionMeses),

        contextoNegocio: data.contextoNegocio,
        retosIdentificados: data.retosIdentificados,

        exclusionesAdicionales: data.exclusionesAdicionales,

        hito1Meses: data.hito1Meses,
        hito2Meses: data.hito2Meses,
        hito3Meses: data.hito3Meses,
        hito4Meses: data.hito4Meses,

        horasSemanales: toInt(data.horasSemanales),

        anticipoCOP: toDecimal(data.anticipoCOP),
        honorarioFase1COP: toDecimal(data.honorarioFase1COP),
        honorarioFase2COP: toDecimal(data.honorarioFase2COP),
        bonoPorHitoCOP: toDecimal(data.bonoPorHitoCOP),
        trmValor: toDecimal(data.trmValor),
        trmFecha: data.trmFecha ? new Date(data.trmFecha) : undefined,

        notasAdicionales: data.notasAdicionales,

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
        subtitulo: campos.subtitulo,
        leadId,
        emailCliente: campos.emailCliente,
        empresaCliente: campos.empresaCliente,
        contacto: campos.contacto,
        cargoContacto: campos.cargoContacto,
        sectorCliente: campos.sectorCliente,
        ciudadPais: campos.ciudadPais,
        nitCliente: campos.nitCliente,
        consultorId,
        servicioForja: campos.servicioForja,

        codigoPropuesta: campos.codigoPropuesta,
        fechaValidez: campos.fechaValidez ? new Date(campos.fechaValidez) : undefined,

        fraseClave: campos.fraseClave,
        retoDescripcion: campos.retoDescripcion,
        duracionMeses: toInt(campos.duracionMeses),

        contextoNegocio: campos.contextoNegocio,
        retosIdentificados: campos.retosIdentificados,

        exclusionesAdicionales: campos.exclusionesAdicionales,

        hito1Meses: campos.hito1Meses,
        hito2Meses: campos.hito2Meses,
        hito3Meses: campos.hito3Meses,
        hito4Meses: campos.hito4Meses,

        horasSemanales: toInt(campos.horasSemanales),

        anticipoCOP: toDecimal(campos.anticipoCOP),
        honorarioFase1COP: toDecimal(campos.honorarioFase1COP),
        honorarioFase2COP: toDecimal(campos.honorarioFase2COP),
        bonoPorHitoCOP: toDecimal(campos.bonoPorHitoCOP),
        trmValor: toDecimal(campos.trmValor),
        trmFecha: campos.trmFecha ? new Date(campos.trmFecha) : undefined,

        notasAdicionales: campos.notasAdicionales,

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
