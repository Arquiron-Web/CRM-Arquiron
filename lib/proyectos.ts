import type { Proyecto, Consultor } from "@prisma/client";

type ProyectoWithRelations = Proyecto & { consultor: Consultor | null };

const dec = (v: unknown) => (v === null || v === undefined ? "" : v.toString());
const fecha = (v: Date | null) => (v ? v.toISOString().split("T")[0] : "");

export function toProyectoJSON(p: ProyectoWithRelations) {
  return {
    id: p.id,
    nombre: p.nombre,
    idLead: p.leadId ?? "",
    empresaCliente: p.empresaCliente ?? "",
    contacto: p.contacto ?? "",
    emailCliente: p.emailCliente ?? "",
    consultor: p.consultor?.nombre ?? "",
    servicioForja: p.servicioForja ?? "",
    valorUSD: dec(p.valorUSD),
    etapaForja: p.etapaForja || "Fijar",
    faseActual: p.faseActual ?? "",
    igmInicial: dec(p.igmInicial),
    igmFinal: dec(p.igmFinal),
    fechaInicio: fecha(p.fechaInicio),
    fechaCierreEst: fecha(p.fechaCierreEst),
    fechaCierreReal: fecha(p.fechaCierreReal),
    estadoPago: p.estadoPago,
    porcentajeAvance: p.porcentajeAvance !== null ? p.porcentajeAvance.toString() : "0",
    proximaAccion: p.proximaAccion ?? "",
    fechaProximaAccion: fecha(p.fechaProximaAccion),
    entregablesPendientes: p.entregablesPendientes ?? "",
    notas: p.notas ?? "",
    estadoProyecto: p.estadoProyecto,
    timestamp: p.createdAt.toISOString(),
    npsScore: p.npsScore !== null ? p.npsScore.toString() : "",
    npsDateSaved: p.npsDateSaved ?? "",
    npsComment: p.npsComment ?? "",
  };
}
