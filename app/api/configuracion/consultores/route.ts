import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { toConsultorJSON } from "@/lib/consultores";
import {
  consultorCreateSchema,
  consultorUpdateSchema,
  consultorDeleteSchema,
  formatZodError,
} from "@/lib/schemas";
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

    const consultores = await prisma.consultor.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(consultores.map(toConsultorJSON));
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error GET /api/configuracion/consultores:", err?.message);
    return NextResponse.json(
      { error: "Error al cargar consultores", detail: err?.message },
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
    const adminError = requireAdmin(session);
    if (adminError) return adminError;

    const parsed = consultorCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const data = parsed.data;

    const existing = await prisma.consultor.findUnique({
      where: { email: data.email.trim().toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un consultor con ese email" },
        { status: 400 }
      );
    }

    await prisma.consultor.create({
      data: {
        nombre: data.nombre,
        email: data.email.trim().toLowerCase(),
        cargo: data.cargo,
        especialidad: data.especialidad,
        pais: data.pais,
        ciudad: data.ciudad,
        fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error("Error POST /api/configuracion/consultores:", err?.message);

    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un consultor con ese email" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear consultor", detail: err?.message },
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
    const adminError = requireAdmin(session);
    if (adminError) return adminError;

    const parsed = consultorUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { id, ...data } = parsed.data;

    await prisma.consultor.update({
      where: { id },
      data: {
        nombre: data.nombre,
        email: data.email.trim().toLowerCase(),
        cargo: data.cargo,
        especialidad: data.especialidad,
        pais: data.pais,
        ciudad: data.ciudad,
        fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error("Error PUT /api/configuracion/consultores:", err?.message);

    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Consultor no encontrado" }, { status: 404 });
    }
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un consultor con ese email" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar consultor", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesión expirada. Vuelve a iniciar sesión." },
        { status: 401 }
      );
    }
    const adminError = requireAdmin(session);
    if (adminError) return adminError;

    const parsed = consultorDeleteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { id } = parsed.data;

    await prisma.consultor.update({ where: { id }, data: { activo: false } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error("Error DELETE /api/configuracion/consultores:", err?.message);

    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Consultor no encontrado" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Error al eliminar consultor", detail: err?.message },
      { status: 500 }
    );
  }
}
