import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapRetoPrincipalToServicio } from "@/lib/crm-utils";
import { resolveConsultorIdByNombre } from "@/lib/consultores";
import { calcularScoreLead, clasificarScore } from "@/lib/lead-scoring";
import { toDecimal } from "@/lib/decimal";
import { notificarNuevoLead } from "@/lib/email";

const esSi = (v: string | boolean | undefined) => {
  if (typeof v === "boolean") return v;
  return (v || "").trim().toLowerCase() === "si";
};

export interface CrearLeadInput {
  nombreEmpresa?: string;
  sector?: string;
  tamano?: string;
  pais?: string;
  ciudad?: string;
  retoPrincipal?: string;
  anosOperacion?: string;
  ingresosAnuales?: string | number;
  valor?: string | number;
  exporta?: string;
  nombreContacto: string;
  cargo?: string;
  emailCorporativo?: string;
  whatsapp?: string;
  momentoContacto?: string;
  comoNosConocio?: string;
  referidoPor?: string;
  servicioSugeridoForja?: string;
  fuenteFormulario: string;
  aceptaPolitica?: string | boolean;
  consultorAsignado?: string;
  notas?: string;
  scoreLead?: string | number;
  madurezAutoevaluada?: string | number;
  dim1?: string | number;
  dim2?: string | number;
  dim3?: string | number;
  dim4?: string | number;
  dim5?: string | number;
  dim6?: string | number;
  dim7?: string | number;
  dim8?: string | number;
  dim9?: string | number;
  dim10?: string | number;
  indiceMadurez?: string | number;
}

/**
 * Crea un Lead aplicando las mismas reglas de negocio sin importar el
 * origen (formulario interno del CRM, Portal Web público, o la
 * herramienta de Evaluación de Madurez): mapeo de reto→servicio, nota de
 * "Referido por", resolución de consultor por nombre y el cálculo de
 * scoreLead/clasificacion/accionRecomendada.
 */
export async function crearLead(data: CrearLeadInput) {
  const servicioSugerido =
    data.servicioSugeridoForja ??
    (data.retoPrincipal ? mapRetoPrincipalToServicio(data.retoPrincipal) : "");

  const notas = data.referidoPor
    ? `Referido por: ${data.referidoPor}${data.notas ? " | " + data.notas : ""}`
    : data.notas || "";

  const { id: consultorId } = await resolveConsultorIdByNombre(data.consultorAsignado);

  const ingresoAnual =
    data.ingresosAnuales !== undefined
      ? String(data.ingresosAnuales)
      : data.valor !== undefined
        ? String(data.valor)
        : "";

  const indiceMadurez =
    data.indiceMadurez !== undefined ? Number(data.indiceMadurez) : null;
  const madurezAutoevaluada =
    data.madurezAutoevaluada !== undefined ? Number(data.madurezAutoevaluada) : null;

  const computado = calcularScoreLead({
    momentoContacto: data.momentoContacto,
    comoNosConocio: data.comoNosConocio,
    fuenteFormulario: data.fuenteFormulario,
    tamano: data.tamano,
    whatsapp: data.whatsapp,
    madurezAutoevaluada,
    indiceMadurez,
  });

  // Si viene un scoreLead explícito (ej. probabilidad manual de un "deal"
  // del pipeline), se respeta ese número; clasificacion/accionRecomendada
  // se recalculan sobre ese valor para que queden consistentes.
  const scoreManual = data.scoreLead !== undefined ? Number(data.scoreLead) : undefined;
  const scoreFinal =
    scoreManual !== undefined && Number.isFinite(scoreManual) ? scoreManual : computado.scoreLead;
  const clasificacion = clasificarScore(scoreFinal);
  const accionRecomendada =
    scoreManual !== undefined
      ? "Deal creado manualmente — verificar la probabilidad de cierre estimada."
      : computado.accionRecomendada;

  const created = await prisma.lead.create({
    data: {
      nombreEmpresa: data.nombreEmpresa || "",
      sector: data.sector,
      tamano: data.tamano,
      pais: data.pais,
      ciudad: data.ciudad,
      retoPrincipal: data.retoPrincipal,
      anosOperacion: data.anosOperacion,
      ingresoAnual,
      exporta: data.exporta !== undefined ? esSi(data.exporta) : undefined,
      nombreContacto: data.nombreContacto,
      cargo: data.cargo,
      emailCorporativo: data.emailCorporativo || "",
      whatsapp: data.whatsapp,
      momentoContacto: data.momentoContacto,
      comoNosConocio: data.comoNosConocio,
      madurezAutoevaluada: toDecimal(data.madurezAutoevaluada),
      dim1: toDecimal(data.dim1),
      dim2: toDecimal(data.dim2),
      dim3: toDecimal(data.dim3),
      dim4: toDecimal(data.dim4),
      dim5: toDecimal(data.dim5),
      dim6: toDecimal(data.dim6),
      dim7: toDecimal(data.dim7),
      dim8: toDecimal(data.dim8),
      dim9: toDecimal(data.dim9),
      dim10: toDecimal(data.dim10),
      indiceMadurez: toDecimal(data.indiceMadurez),
      servicioSugeridoForja: servicioSugerido || undefined,
      estadoLead: "NUEVO",
      fuenteFormulario: data.fuenteFormulario,
      aceptaPoliticaDatos: data.aceptaPolitica !== undefined ? esSi(data.aceptaPolitica) : true,
      consultorId,
      notas,
      scoreLead: toDecimal(scoreFinal),
      clasificacion,
      accionRecomendada,
    },
  });

  // after() en vez de un simple "no-await": en Vercel la función serverless
  // puede congelarse apenas se envía la respuesta, matando cualquier promesa
  // pendiente a medias. after() le pide al runtime mantener la función viva
  // hasta que esto termine, sin demorar la respuesta al creador del lead.
  after(() =>
    notificarNuevoLead(created).catch((error) =>
      console.error("Error notificando lead nuevo:", created.id, error)
    )
  );

  return created;
}
