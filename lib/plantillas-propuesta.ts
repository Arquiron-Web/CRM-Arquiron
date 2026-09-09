export const PLANTILLAS = [
  { value: "Estándar", label: "Estándar" },
  { value: "Consultoría Estratégica", label: "Consultoría Estratégica" },
  { value: "Transformación Digital", label: "Transformación Digital" },
  { value: "Diagnóstico de Madurez", label: "Diagnóstico de Madurez" },
  { value: "Implementación Operativa", label: "Implementación Operativa" },
] as const;

export type PlantillaKey = (typeof PLANTILLAS)[number]["value"];

export interface ContenidoPlantilla {
  fraseClave: string;
  retoDescripcion: string;
  contextoNegocio: string;
  retosIdentificados: string;
}

export const CONTENIDO_PLANTILLAS: Record<PlantillaKey, ContenidoPlantilla> = {
  Estándar: {
    fraseClave: "Necesitamos crecer con orden, sin perder lo que nos hace fuertes.",
    retoDescripcion:
      "{empresa} requiere estructurar su modelo operativo para escalar de manera sostenible y desarrollar nuevas líneas de crecimiento sin incrementar proporcionalmente su complejidad interna.",
    contextoNegocio:
      "Crecimiento sostenido con oportunidad de escalar a nuevos mercados\nModelo operativo dependiente de los fundadores\nNecesidad de estandarizar procesos para preservar la calidad del servicio",
    retosIdentificados:
      "Falta de procesos documentados y estandarizados\nDependencia crítica de personas clave para la operación\nAusencia de indicadores para tomar decisiones\nDificultad para escalar el equipo sin perder calidad",
  },
  "Consultoría Estratégica": {
    fraseClave: "Necesitamos definir un rumbo claro y alinear a todo el equipo directivo.",
    retoDescripcion:
      "{empresa} busca definir o redireccionar su rumbo estratégico y necesita un acompañamiento estructurado para alcanzar sus objetivos de crecimiento en los próximos años.",
    contextoNegocio:
      "Necesidad de claridad estratégica compartida por el equipo directivo\nMúltiples iniciativas en curso sin priorización clara\nPresión por resultados de corto plazo que dificulta pensar a mediano plazo",
    retosIdentificados:
      "Ausencia de un plan estratégico formal\nDesalineación entre el equipo directivo sobre las prioridades\nFalta de indicadores estratégicos de seguimiento\nDificultad para traducir la estrategia en ejecución",
  },
  "Transformación Digital": {
    fraseClave: "Queremos que la tecnología multiplique la capacidad de nuestro equipo, no que la complique.",
    retoDescripcion:
      "{empresa} requiere una hoja de ruta clara de transformación digital que integre tecnología, procesos y personas para lograr una adopción sostenible y medible.",
    contextoNegocio:
      "Procesos manuales que limitan la capacidad de respuesta\nHerramientas tecnológicas desconectadas entre sí\nOportunidad de usar IA y automatización para escalar sin más personal",
    retosIdentificados:
      "Baja madurez digital frente al mercado\nSistemas que no conversan entre sí\nEquipo con resistencia o poca experiencia en herramientas digitales\nFalta de un roadmap tecnológico priorizado",
  },
  "Diagnóstico de Madurez": {
    fraseClave: "Antes de decidir hacia dónde ir, necesitamos saber exactamente dónde estamos.",
    retoDescripcion:
      "{empresa} necesita conocer su punto de partida real y priorizar intervenciones con base en una evaluación objetiva y accionable de su madurez empresarial.",
    contextoNegocio:
      "Decisiones tomadas más por intuición que por datos\nMúltiples áreas de oportunidad sin un orden claro de prioridad\nNecesidad de un punto de partida objetivo antes de invertir en soluciones",
    retosIdentificados:
      "Falta de visibilidad sobre las brechas reales de la organización\nDificultad para priorizar en qué invertir primero\nAusencia de benchmarking frente al sector\nNecesidad de un caso de negocio claro para justificar inversión",
  },
  "Implementación Operativa": {
    fraseClave: "Tenemos claro qué hacer; necesitamos ayuda para ejecutarlo bien y rápido.",
    retoDescripcion:
      "{empresa} requiere un acompañamiento enfocado en la implementación operativa: rediseño de procesos, optimización de recursos y mejora de la productividad del equipo.",
    contextoNegocio:
      "Procesos definidos pero no siempre seguidos de forma consistente\nCapacidad operativa al límite frente al volumen actual\nNecesidad de indicadores para medir la mejora en el terreno",
    retosIdentificados:
      "Cuellos de botella operativos recurrentes\nBaja estandarización entre equipos o sedes\nFalta de indicadores de desempeño operativo\nEquipo sin tiempo para rediseñar procesos mientras opera",
  },
};

export function aplicarPlantilla(
  plantilla: PlantillaKey,
  empresa?: string
): ContenidoPlantilla {
  const base = CONTENIDO_PLANTILLAS[plantilla] || CONTENIDO_PLANTILLAS.Estándar;
  const empresaVal = empresa || "la empresa";
  return {
    fraseClave: base.fraseClave,
    retoDescripcion: base.retoDescripcion.replace(/\{empresa\}/g, empresaVal),
    contextoNegocio: base.contextoNegocio,
    retosIdentificados: base.retosIdentificados,
  };
}
