import type { Lead, Consultor } from "@prisma/client";

type LeadWithConsultor = Lead & { consultor: Consultor | null };

const dec = (v: unknown) => (v === null || v === undefined ? "" : v.toString());
const fecha = (v: Date | null) => (v ? v.toISOString().split("T")[0] : "");
const bool = (v: boolean | null) => (v ? "Si" : "No");

export function toLeadJSON(lead: LeadWithConsultor) {
  return {
    id: lead.id,
    nombreEmpresa: lead.nombreEmpresa,
    sector: lead.sector ?? "",
    tamano: lead.tamano ?? "",
    pais: lead.pais ?? "",
    ciudad: lead.ciudad ?? "",
    retoPrincipal: lead.retoPrincipal ?? "",
    anosOperacion: lead.anosOperacion ?? "",
    ingresoAnual: lead.ingresoAnual ?? "",
    exporta: bool(lead.exporta),
    nombreContacto: lead.nombreContacto,
    cargo: lead.cargo ?? "",
    emailCorporativo: lead.emailCorporativo,
    whatsapp: lead.whatsapp ?? "",
    momentoContacto: lead.momentoContacto ?? "",
    comoNosConocio: lead.comoNosConocio ?? "",
    madurezAutoevaluada: dec(lead.madurezAutoevaluada),
    dim1: dec(lead.dim1),
    dim2: dec(lead.dim2),
    dim3: dec(lead.dim3),
    dim4: dec(lead.dim4),
    dim5: dec(lead.dim5),
    dim6: dec(lead.dim6),
    dim7: dec(lead.dim7),
    dim8: dec(lead.dim8),
    dim9: dec(lead.dim9),
    dim10: dec(lead.dim10),
    indiceMadurez: dec(lead.indiceMadurez),
    timestamp: lead.createdAt.toISOString(),
    servicioSugeridoForja: lead.servicioSugeridoForja ?? "",
    estadoLead: lead.estadoLead,
    fuenteFormulario: lead.fuenteFormulario ?? "",
    aceptaPoliticaDatos: bool(lead.aceptaPoliticaDatos),
    consultorAsignado: lead.consultor?.nombre ?? "",
    fechaContacto: fecha(lead.fechaContacto),
    notas: lead.notas ?? "",
    scoreLead: dec(lead.scoreLead),
    clasificacion: lead.clasificacion ?? "",
    accionRecomendada: lead.accionRecomendada ?? "",
  };
}
