import { prisma } from "@/lib/prisma";
import type { Consultor } from "@prisma/client";

/** Resuelve un nombre de consultor (texto libre, como lo maneja hoy el frontend) al id real. */
export async function resolveConsultorIdByNombre(
  nombre: string | undefined
): Promise<{ id: string | null; found: boolean }> {
  const trimmed = (nombre || "").trim();
  if (!trimmed) return { id: null, found: true };

  const consultor = await prisma.consultor.findFirst({
    where: { nombre: { equals: trimmed, mode: "insensitive" }, activo: true },
  });

  return { id: consultor?.id ?? null, found: !!consultor };
}

export function toConsultorJSON(c: Consultor) {
  return {
    id: c.id,
    nombre: c.nombre,
    email: c.email,
    cargo: c.cargo ?? "",
    especialidad: c.especialidad ?? "",
    pais: c.pais ?? "",
    ciudad: c.ciudad ?? "",
    fechaIngreso: c.fechaIngreso ? c.fechaIngreso.toISOString().split("T")[0] : "",
  };
}
