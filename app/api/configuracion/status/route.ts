import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function maskLast4(value: string | undefined): string {
  if (!value || value.length < 4) return value ? "****" : "no configurado";
  return "****" + value.slice(-4);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    let baseDatosConectada = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      baseDatosConectada = true;
    } catch {
      baseDatosConectada = false;
    }

    const status = {
      DATABASE_URL: process.env.DATABASE_URL ? "configurado" : "no configurado",
      baseDatosConectada: baseDatosConectada ? "conectado" : "sin conexión",
      GOOGLE_CLIENT_ID: maskLast4(process.env.GOOGLE_CLIENT_ID),
      NEXTAUTH_URL: maskLast4(process.env.NEXTAUTH_URL),
      ALLOWED_DOMAIN: process.env.ALLOWED_DOMAIN ? "configurado" : "no configurado",
      NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT: process.env
        .NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT
        ? "configurado"
        : "no configurado",
    };
    return NextResponse.json(status);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error GET /api/configuracion/status:", err?.message);
    return NextResponse.json(
      { error: "Error al obtener estado", detail: err?.message },
      { status: 500 }
    );
  }
}
