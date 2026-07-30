import type { Interaccion, Consultor } from "@prisma/client";

type InteraccionWithConsultor = Interaccion & { consultor: Consultor | null };

const fecha = (v: Date | null) => (v ? v.toISOString().split("T")[0] : "");

export function toInteraccionJSON(i: InteraccionWithConsultor) {
  return {
    id: i.id,
    idLead: i.leadId ?? "",
    emailLead: i.emailLead ?? "",
    empresa: i.empresa ?? "",
    contacto: i.contacto ?? "",
    tipo: i.tipo ?? "",
    titulo: i.titulo ?? "",
    descripcion: i.descripcion ?? "",
    resultado: i.resultado ?? "",
    duracion: i.duracion !== null ? i.duracion.toString() : "",
    consultor: i.consultor?.nombre ?? "",
    fecha: fecha(i.fecha),
    hora: i.hora ?? "",
    archivos: i.archivos ?? "0",
    timestamp: i.createdAt.toISOString(),
  };
}
