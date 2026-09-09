import type { Propuesta, Consultor } from "@prisma/client";
import { calcularInversion } from "@/lib/propuesta-finanzas";

type PropuestaWithRelations = Propuesta & { consultor: Consultor | null };

const dec = (v: unknown) => (v === null || v === undefined ? "" : v.toString());
const num = (v: number | null | undefined) => (v === null || v === undefined ? "" : v.toString());
const fecha = (v: Date | null) => (v ? v.toISOString().split("T")[0] : "");

export function toPropuestaJSON(p: PropuestaWithRelations) {
  const inversion = calcularInversion({
    duracionMeses: p.duracionMeses,
    anticipoCOP: dec(p.anticipoCOP),
    honorarioFase1COP: dec(p.honorarioFase1COP),
    honorarioFase2COP: dec(p.honorarioFase2COP),
    bonoPorHitoCOP: dec(p.bonoPorHitoCOP),
    trmValor: dec(p.trmValor),
  });

  return {
    id: p.id,
    titulo: p.titulo,
    subtitulo: p.subtitulo ?? "",
    idLead: p.leadId ?? "",
    emailCliente: p.emailCliente ?? "",
    empresaCliente: p.empresaCliente ?? "",
    contacto: p.contacto ?? "",
    cargoContacto: p.cargoContacto ?? "",
    sectorCliente: p.sectorCliente ?? "",
    ciudadPais: p.ciudadPais ?? "",
    nitCliente: p.nitCliente ?? "",
    consultor: p.consultor?.nombre ?? "",
    servicioForja: p.servicioForja ?? "",

    codigoPropuesta: p.codigoPropuesta ?? "",
    fechaValidez: fecha(p.fechaValidez),

    fraseClave: p.fraseClave ?? "",
    retoDescripcion: p.retoDescripcion ?? "",
    duracionMeses: num(p.duracionMeses),

    contextoNegocio: p.contextoNegocio ?? "",
    retosIdentificados: p.retosIdentificados ?? "",

    exclusionesAdicionales: p.exclusionesAdicionales ?? "",

    hito1Meses: p.hito1Meses ?? "",
    hito2Meses: p.hito2Meses ?? "",
    hito3Meses: p.hito3Meses ?? "",
    hito4Meses: p.hito4Meses ?? "",

    horasSemanales: num(p.horasSemanales),

    anticipoCOP: dec(p.anticipoCOP),
    honorarioFase1COP: dec(p.honorarioFase1COP),
    honorarioFase2COP: dec(p.honorarioFase2COP),
    bonoPorHitoCOP: dec(p.bonoPorHitoCOP),
    trmValor: dec(p.trmValor),
    trmFecha: fecha(p.trmFecha),

    notasAdicionales: p.notasAdicionales ?? "",

    // Totales calculados a partir de la Sección 11 (única fuente de verdad:
    // lib/propuesta-finanzas.ts). valorUSD se cachea aquí para poder
    // ordenar/filtrar en el listado.
    subtotalFijoCOP: String(inversion.subtotalFijoCOP),
    ivaCOP: String(inversion.ivaCOP),
    totalConIvaCOP: String(inversion.totalConIvaCOP),
    valorUSD: String(inversion.totalUSD || dec(p.valorUSD)),

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
