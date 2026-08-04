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

export interface ActualizarLeadInput {
  nombreContacto?: string;
  emailCorporativo?: string;
  whatsapp?: string;
  retoPrincipal?: string;
  nombreEmpresa?: string;
  sector?: string;
  tamano?: string;
  pais?: string;
  ciudad?: string;
  cargo?: string;
  momentoContacto?: string;
  comoNosConocio?: string;
  referidoPor?: string;
  aceptaPolitica?: string | boolean;
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

export type ActualizarLeadResultado =
  | { ok: true; lead: Awaited<ReturnType<typeof prisma.lead.update>> }
  | { ok: false; motivo: "not_found" | "forbidden" };

function numOrExistente(
  valor: string | number | undefined,
  existente: { toNumber(): number } | null
): number | null {
  if (valor !== undefined) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : null;
  }
  return existente ? existente.toNumber() : null;
}

/**
 * PATCH /api/public/leads/:id — actualización progresiva del mismo lead
 * (la Evaluación de Madurez captura el email primero y completa el
 * cuestionario/WhatsApp en pasos posteriores de la misma sesión). Solo se
 * tocan los campos presentes en `data`; el resto del lead queda intacto.
 * `fuenteEsperada` restringe la actualización al mismo origen que creó el
 * lead — la key del Portal no puede tocar un lead de la Evaluación de
 * Madurez ni viceversa, aunque conociera el id.
 */
export async function actualizarLeadPublico(
  id: string,
  fuenteEsperada: string,
  data: ActualizarLeadInput
): Promise<ActualizarLeadResultado> {
  const existente = await prisma.lead.findUnique({ where: { id } });
  if (!existente) return { ok: false, motivo: "not_found" };
  if (existente.fuenteFormulario !== fuenteEsperada) return { ok: false, motivo: "forbidden" };

  const whatsapp = data.whatsapp ?? existente.whatsapp ?? undefined;
  const tamano = data.tamano ?? existente.tamano ?? undefined;
  const momentoContacto = data.momentoContacto ?? existente.momentoContacto ?? undefined;
  const comoNosConocio = data.comoNosConocio ?? existente.comoNosConocio ?? undefined;
  const madurezAutoevaluada = numOrExistente(data.madurezAutoevaluada, existente.madurezAutoevaluada);
  const indiceMadurez = numOrExistente(data.indiceMadurez, existente.indiceMadurez);

  const servicioSugerido = data.retoPrincipal
    ? mapRetoPrincipalToServicio(data.retoPrincipal)
    : existente.servicioSugeridoForja || undefined;

  const notas = data.referidoPor && !(existente.notas || "").startsWith("Referido por:")
    ? `Referido por: ${data.referidoPor}${existente.notas ? " | " + existente.notas : ""}`
    : existente.notas || undefined;

  const computado = calcularScoreLead({
    momentoContacto,
    comoNosConocio,
    fuenteFormulario: existente.fuenteFormulario ?? fuenteEsperada,
    tamano,
    whatsapp,
    madurezAutoevaluada,
    indiceMadurez,
  });

  const actualizado = await prisma.lead.update({
    where: { id },
    data: {
      nombreContacto: data.nombreContacto ?? undefined,
      emailCorporativo: data.emailCorporativo ?? undefined,
      whatsapp,
      nombreEmpresa: data.nombreEmpresa ?? undefined,
      sector: data.sector ?? undefined,
      tamano,
      pais: data.pais ?? undefined,
      ciudad: data.ciudad ?? undefined,
      cargo: data.cargo ?? undefined,
      retoPrincipal: data.retoPrincipal ?? undefined,
      momentoContacto,
      comoNosConocio,
      servicioSugeridoForja: servicioSugerido,
      notas,
      madurezAutoevaluada: toDecimal(madurezAutoevaluada ?? undefined),
      dim1: toDecimal(numOrExistente(data.dim1, existente.dim1) ?? undefined),
      dim2: toDecimal(numOrExistente(data.dim2, existente.dim2) ?? undefined),
      dim3: toDecimal(numOrExistente(data.dim3, existente.dim3) ?? undefined),
      dim4: toDecimal(numOrExistente(data.dim4, existente.dim4) ?? undefined),
      dim5: toDecimal(numOrExistente(data.dim5, existente.dim5) ?? undefined),
      dim6: toDecimal(numOrExistente(data.dim6, existente.dim6) ?? undefined),
      dim7: toDecimal(numOrExistente(data.dim7, existente.dim7) ?? undefined),
      dim8: toDecimal(numOrExistente(data.dim8, existente.dim8) ?? undefined),
      dim9: toDecimal(numOrExistente(data.dim9, existente.dim9) ?? undefined),
      dim10: toDecimal(numOrExistente(data.dim10, existente.dim10) ?? undefined),
      indiceMadurez: toDecimal(indiceMadurez ?? undefined),
      aceptaPoliticaDatos: data.aceptaPolitica !== undefined ? esSi(data.aceptaPolitica) : undefined,
      scoreLead: toDecimal(computado.scoreLead),
      clasificacion: clasificarScore(computado.scoreLead),
      accionRecomendada: computado.accionRecomendada,
    },
  });

  return { ok: true, lead: actualizado };
}
