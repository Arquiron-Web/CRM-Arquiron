export const PLANTILLAS = [
  { value: "Estándar", label: "Estándar" },
  { value: "Consultoría Estratégica", label: "Consultoría Estratégica" },
  { value: "Transformación Digital", label: "Transformación Digital" },
  { value: "Diagnóstico de Madurez", label: "Diagnóstico de Madurez" },
  { value: "Implementación Operativa", label: "Implementación Operativa" },
] as const;

export type PlantillaKey = (typeof PLANTILLAS)[number]["value"];

export interface ContenidoPlantilla {
  introduccion: string;
  diagnostico: string;
  alcance: string;
  metodologia: string;
  entregables: string;
  timeline: string;
  inversion: string;
  terminos: string;
}

const METODOLOGIA_FORJA = `Aplicaremos nuestra metodología propietaria FORJA:

F — FIJAR: Diagnóstico profundo y definición del punto de partida.
O — ORIENTAR: Diseño de la hoja de ruta estratégica con quick wins.
R — REDISEÑAR: Intervención en procesos, sistemas y capacidades.
J — JUSTIFICAR: Medición de resultados e impacto cuantificable.
A — ACOMPAÑAR: Soporte post-intervención y seguimiento del plan.`;

const TERMINOS_DEFAULT = `• Esta propuesta tiene una vigencia de 30 días calendario.
• El inicio del proyecto está sujeto a la firma del contrato.
• El 50% del valor se factura al inicio, 50% al finalizar.
• Arquiron garantiza confidencialidad total de la información.
• Cualquier modificación al alcance será acordada por escrito.`;

export const CONTENIDO_PLANTILLAS: Record<PlantillaKey, ContenidoPlantilla> = {
  Estándar: {
    introduccion:
      "En Arquiron nos especializamos en acompañar a las PYMEs latinoamericanas en su proceso de madurez empresarial. Después de conocer a {empresa}, identificamos oportunidades concretas para impulsar su competitividad y crecimiento sostenible.",
    diagnostico: "",
    alcance: "",
    metodologia: METODOLOGIA_FORJA,
    entregables:
      "• Reporte de diagnóstico con IGM y benchmarking\n• Roadmap estratégico 90-180 días\n• Talleres de co-creación con el equipo\n• Manual de procesos rediseñados\n• Sesiones de seguimiento mensuales",
    timeline:
      "Fase 1 — Diagnóstico (Semanas 1-2)\nFase 2 — Diseño de Solución (Semanas 3-4)\nFase 3 — Implementación (Semanas 5-10)\nFase 4 — Seguimiento (Semanas 11-12)",
    inversion: "",
    terminos: TERMINOS_DEFAULT,
  },
  "Consultoría Estratégica": {
    introduccion:
      "Nuestra consultoría estratégica está diseñada para empresas que buscan definir o redireccionar su rumbo. Con base en el análisis de {empresa}, proponemos un acompañamiento estructurado para alcanzar sus objetivos de crecimiento.",
    diagnostico: "",
    alcance: "",
    metodologia: METODOLOGIA_FORJA,
    entregables:
      "• Diagnóstico estratégico y análisis de brechas\n• Plan estratégico 3-5 años\n• Talleres de alineación directiva\n• Dashboard de indicadores estratégicos\n• Revisión trimestral de avance",
    timeline:
      "Fase 1 — Diagnóstico Estratégico (3 semanas)\nFase 2 — Diseño del Plan (4 semanas)\nFase 3 — Implementación y Acompañamiento (12 semanas)",
    inversion: "",
    terminos: TERMINOS_DEFAULT,
  },
  "Transformación Digital": {
    introduccion:
      "La transformación digital de {empresa} requiere una hoja de ruta clara. Nuestra propuesta integra tecnología, procesos y personas para lograr una adopción sostenible y medible.",
    diagnostico: "",
    alcance: "",
    metodologia: METODOLOGIA_FORJA,
    entregables:
      "• Mapa de madurez digital\n• Roadmap de implementación tecnológica\n• Capacitación a equipos clave\n• Documentación de procesos digitalizados\n• Soporte post-implementación",
    timeline:
      "Fase 1 — Evaluación de Madurez (2 semanas)\nFase 2 — Diseño de Solución (4 semanas)\nFase 3 — Implementación (8-12 semanas)\nFase 4 — Adopción y Soporte (4 semanas)",
    inversion: "",
    terminos: TERMINOS_DEFAULT,
  },
  "Diagnóstico de Madurez": {
    introduccion:
      "El diagnóstico de madurez empresarial permite a {empresa} conocer su punto de partida y priorizar intervenciones. Utilizamos nuestro Índice Global de Madurez (IGM) para una evaluación objetiva y accionable.",
    diagnostico: "",
    alcance: "",
    metodologia: METODOLOGIA_FORJA,
    entregables:
      "• Evaluación IGM en 10 dimensiones\n• Reporte ejecutivo con benchmarking\n• Recomendaciones priorizadas\n• Hoja de ruta de mejora\n• Sesión de presentación de resultados",
    timeline:
      "Fase 1 — Recolección de información (1 semana)\nFase 2 — Análisis y evaluación (2 semanas)\nFase 3 — Elaboración del reporte (1 semana)\nFase 4 — Presentación y entrega (1 semana)",
    inversion: "",
    terminos: TERMINOS_DEFAULT,
  },
  "Implementación Operativa": {
    introduccion:
      "Para {empresa}, proponemos un acompañamiento enfocado en la implementación operativa: rediseño de procesos, optimización de recursos y mejora de la productividad del equipo.",
    diagnostico: "",
    alcance: "",
    metodologia: METODOLOGIA_FORJA,
    entregables:
      "• Mapeo de procesos actuales\n• Procesos rediseñados y documentados\n• Capacitación operativa\n• Indicadores de desempeño\n• Acompañamiento en terreno",
    timeline:
      "Fase 1 — Mapeo y Diagnóstico (2 semanas)\nFase 2 — Rediseño (3 semanas)\nFase 3 — Implementación (6-8 semanas)\nFase 4 — Estabilización (2 semanas)",
    inversion: "",
    terminos: TERMINOS_DEFAULT,
  },
};

export function aplicarPlantilla(
  plantilla: PlantillaKey,
  empresa?: string
): ContenidoPlantilla {
  const base = CONTENIDO_PLANTILLAS[plantilla] || CONTENIDO_PLANTILLAS.Estándar;
  const empresaVal = empresa || "la empresa";
  return {
    introduccion: base.introduccion.replace(/\{empresa\}/g, empresaVal),
    diagnostico: base.diagnostico,
    alcance: base.alcance,
    metodologia: base.metodologia,
    entregables: base.entregables,
    timeline: base.timeline,
    inversion: base.inversion,
    terminos: base.terminos,
  };
}
