import type { Propuesta, Consultor } from "@prisma/client";

type PropuestaWithRelations = Propuesta & { consultor: Consultor | null };

const dec = (v: unknown) => (v === null || v === undefined ? "" : v.toString());
const fecha = (v: Date | null) => (v ? v.toISOString().split("T")[0] : "");

export function toPropuestaJSON(p: PropuestaWithRelations) {
  return {
    id: p.id,
    titulo: p.titulo,
    idLead: p.leadId ?? "",
    emailCliente: p.emailCliente ?? "",
    empresaCliente: p.empresaCliente ?? "",
    contacto: p.contacto ?? "",
    consultor: p.consultor?.nombre ?? "",
    servicioForja: p.servicioForja ?? "",
    introduccion: p.introduccion ?? "",
    diagnostico: p.diagnostico ?? "",
    alcance: p.alcance ?? "",
    metodologia: p.metodologia ?? "",
    entregables: p.entregables ?? "",
    timeline: p.timeline ?? "",
    inversion: p.inversion ?? "",
    terminos: p.terminos ?? "",
    valorUSD: dec(p.valorUSD),
    estado: p.estado,
    version: p.version || "v1.0",
    plantilla: p.plantilla || "Estándar",
    fechaCreacion: fecha(p.fechaCreacion),
    fechaEnvio: fecha(p.fechaEnvio),
    fechaVisto: fecha(p.fechaVisto),
    notasInternas: p.notasInternas ?? "",
    timestamp: p.createdAt.toISOString(),
  };
}
