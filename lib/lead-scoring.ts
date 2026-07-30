/**
 * Scoring de leads (0-100) + clasificación + acción recomendada.
 * No existe una fórmula original que migrar: en Google Sheets estos tres
 * campos (scoreLead/clasificacion/accionRecomendada) eran fórmulas nativas
 * de la hoja, nunca capturadas en código. Este modelo se diseñó desde cero
 * con el usuario a partir de las señales disponibles en cada Lead.
 */

export interface LeadScoringInput {
  momentoContacto?: string | null;
  comoNosConocio?: string | null;
  fuenteFormulario?: string | null;
  tamano?: string | null;
  madurezAutoevaluada?: number | null;
  indiceMadurez?: number | null;
  whatsapp?: string | null;
}

export interface LeadScoringResult {
  scoreLead: number;
  clasificacion: string;
  accionRecomendada: string;
}

type Componente = "urgencia" | "fuente" | "tamano" | "madurez" | "contacto";

/** puntos: aporte al score. activo: hay una señal real (no un valor por defecto) que respalde un mensaje. */
interface Factor {
  puntos: number;
  activo: boolean;
}

function factorUrgencia(momentoContacto?: string | null): Factor {
  switch (momentoContacto) {
    case "urgente":
      return { puntos: 30, activo: true };
    case "semana":
      return { puntos: 20, activo: true };
    case "mes":
      return { puntos: 10, activo: false }; // urgencia baja: no amerita el mensaje "contactar hoy"
    case "explorando":
      return { puntos: 0, activo: false };
    default:
      return { puntos: 10, activo: false }; // sin dato: neutral, no es una señal real
  }
}

function factorFuente(comoNosConocio?: string | null, fuenteFormulario?: string | null): Factor {
  if (comoNosConocio === "referido") return { puntos: 25, activo: true }; // 3x más probabilidad de cerrar
  if (fuenteFormulario === "Evaluacion_Madurez") return { puntos: 20, activo: true }; // 2x conversión
  if (fuenteFormulario === "Portal_Empresarial") return { puntos: 12, activo: true };
  if (fuenteFormulario === "CRM_Manual") return { puntos: 8, activo: false }; // canal por defecto, no distintivo
  return { puntos: 5, activo: false };
}

function factorTamano(tamano?: string | null): Factor {
  switch (tamano) {
    case "grande":
      return { puntos: 20, activo: true };
    case "mediana":
      return { puntos: 16, activo: true };
    case "pequena":
      return { puntos: 12, activo: false };
    case "micro":
      return { puntos: 6, activo: false };
    default:
      return { puntos: 9, activo: false }; // sin dato: neutral
  }
}

/** Mayor brecha (autoevaluación vs. realidad) = más oportunidad comercial. */
function factorMadurez(madurezAutoevaluada?: number | null, indiceMadurez?: number | null): Factor {
  const auto = madurezAutoevaluada && madurezAutoevaluada > 0 ? madurezAutoevaluada : null;
  const igm = indiceMadurez && indiceMadurez > 0 ? indiceMadurez : null;

  if (auto && igm) {
    const brecha = Math.max(0, Math.min(2, auto - igm));
    return { puntos: (brecha / 2) * 15, activo: brecha > 0.3 };
  }
  if (igm) {
    const necesidad = Math.max(0, Math.min(1, (5 - igm) / 5));
    return { puntos: necesidad * 15 * 0.7, activo: necesidad > 0.3 };
  }
  if (auto) {
    const necesidad = Math.max(0, Math.min(1, (5 - auto) / 5));
    return { puntos: necesidad * 15 * 0.4, activo: false }; // solo autoevaluación: señal débil
  }
  return { puntos: 0, activo: false }; // sin evaluación de madurez todavía (leads manuales)
}

function factorContacto(whatsapp?: string | null): Factor {
  return whatsapp && whatsapp.trim() ? { puntos: 10, activo: false } : { puntos: 4, activo: false };
}

export function clasificarScore(score: number): string {
  if (score >= 75) return "🔴 Oportunidad Inmediata";
  if (score >= 55) return "🟠 Oportunidad Alta";
  if (score >= 35) return "🟡 Oportunidad Media";
  if (score >= 15) return "🟢 Oportunidad Baja";
  return "⚪ Sin Oportunidad";
}

function generarAccion(
  factores: Record<Componente, Factor>,
  score: number,
  input: LeadScoringInput
): string {
  if (score < 15) return "Nutrir a largo plazo — sin señales fuertes de intención de compra aún.";

  const activos = (Object.entries(factores) as [Componente, Factor][])
    .filter(([, f]) => f.activo)
    .sort((a, b) => b[1].puntos - a[1].puntos);

  if (activos.length === 0) {
    return "Hacer seguimiento estándar — completa más datos del lead para priorizar mejor.";
  }

  switch (activos[0][0]) {
    case "urgencia":
      return "Contactar hoy — el lead declaró urgencia alta.";
    case "fuente":
      return input.comoNosConocio === "referido"
        ? "Priorizar — llegó por referido, alta probabilidad de cierre."
        : "Priorizar — viene de un canal de alta conversión.";
    case "madurez":
      return "Mostrar su brecha de madurez real como argumento de venta en el primer contacto.";
    case "tamano":
      return "Calificar presupuesto — empresa de un tamaño con buen fit para el ticket objetivo.";
    default:
      return "Hacer seguimiento estándar en los próximos días.";
  }
}

export function calcularScoreLead(input: LeadScoringInput): LeadScoringResult {
  const factores: Record<Componente, Factor> = {
    urgencia: factorUrgencia(input.momentoContacto),
    fuente: factorFuente(input.comoNosConocio, input.fuenteFormulario),
    tamano: factorTamano(input.tamano),
    madurez: factorMadurez(input.madurezAutoevaluada, input.indiceMadurez),
    contacto: factorContacto(input.whatsapp),
  };

  const total = Object.values(factores).reduce((s, f) => s + f.puntos, 0);
  const scoreLead = Math.max(0, Math.min(100, Math.round(total)));

  return {
    scoreLead,
    clasificacion: clasificarScore(scoreLead),
    accionRecomendada: generarAccion(factores, scoreLead, input),
  };
}
