import type { Tarea, Consultor } from "@prisma/client";

type TareaWithRelations = Tarea & { asignadoA: Consultor | null };

const fecha = (v: Date | null) => (v ? v.toISOString().split("T")[0] : "");

export function toTareaJSON(t: TareaWithRelations) {
  return {
    id: t.id,
    titulo: t.titulo,
    descripcion: t.descripcion ?? "",
    tipo: t.tipo ?? "",
    prioridad: t.prioridad ?? "media",
    asignadoA: t.asignadoA?.nombre ?? "",
    relacionadoCon: t.relacionadoCon ?? "",
    idReferencia: t.idReferencia ?? "",
    empresa: t.empresa ?? "",
    fechaVencimiento: fecha(t.fechaVencimiento),
    hora: t.hora ?? "",
    estado: t.estado,
    completadaEn: t.completadaEn ? t.completadaEn.toISOString() : "",
    creadaPor: t.creadaPor ?? "",
    timestamp: t.createdAt.toISOString(),
  };
}
