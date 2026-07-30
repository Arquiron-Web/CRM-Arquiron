import type { Session } from "next-auth";
import { NextResponse } from "next/server";

/** Devuelve una respuesta 403 si la sesión no tiene rol admin, o null si puede continuar. */
export function requireAdmin(session: Session | null): NextResponse | null {
  if (session?.user?.role !== "admin") {
    return NextResponse.json(
      { error: "Esta acción requiere permisos de administrador." },
      { status: 403 }
    );
  }
  return null;
}
