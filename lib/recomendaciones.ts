export interface Recomendacion {
  id: string;
  prioridad: "critica" | "alta" | "media" | "info";
  bloque: string;
  titulo: string;
  problema: string;
  accion: string;
  impacto: string;
}

export function generarRecomendaciones(datos: {
  bloque1?: {
    leadsUrgentes?: number;
    tasaConversionLP?: number;
    totalLeads?: number;
    propuestasEnviadas?: number;
    crecimientoMoM?: number;
    leadsEvaluacion?: number;
    leadsPortal?: number;
  };
  bloque2?: {
    leadsEvaluados?: number;
    dimMasDebil?: { nombre: string; promedio: number };
    brechaPromedio?: number;
  };
  bloque3?: {
    valorPipelineTotal?: number;
    propuestasPorEstado?: { estado: string; cantidad: number }[];
    ticketPromedio?: number;
    totalPropuestas?: number;
  };
  bloque4?: {
    tasaExitoInteracciones?: number;
    totalInteracciones?: number;
  };
  bloque5?: {
    distribucionPaises?: { pais: string; cantidad: number }[];
  };
}): Recomendacion[] {
  const recs: Recomendacion[] = [];
  const b1 = datos.bloque1;
  const b2 = datos.bloque2;
  const b3 = datos.bloque3;
  const b4 = datos.bloque4;
  const b5 = datos.bloque5;

  if (!b1 && !b2 && !b3 && !b4 && !b5) return recs;

  if (b1 && (b1.leadsUrgentes ?? 0) > 0) {
    recs.push({
      id: "leads-urgentes",
      prioridad: "critica",
      bloque: "Embudo Comercial",
      titulo: `${b1.leadsUrgentes} lead${(b1.leadsUrgentes ?? 0) > 1 ? "s" : ""} sin contactar en más de 48h`,
      problema:
        "Cada hora de demora reduce la probabilidad de conversión en un 10%. Los leads urgentes se enfrían rápidamente.",
      accion:
        "Ir al Pipeline ahora → filtrar por 'NUEVO' → asignar consultor y registrar primer contacto hoy.",
      impacto:
        "Alto — Recuperar estos leads puede representar hasta $" +
        ((b1.leadsUrgentes ?? 0) * 1500).toLocaleString() +
        " USD en pipeline.",
    });
  }

  if (b1 && (b1.tasaConversionLP ?? 100) < 30) {
    recs.push({
      id: "conversion-baja",
      prioridad: "alta",
      bloque: "Embudo Comercial",
      titulo: "Tasa de conversión Lead→Propuesta por debajo del mínimo",
      problema: `Tu tasa actual es ${b1.tasaConversionLP}% vs meta de 40%. Los leads llegan pero no avanzan al siguiente paso.`,
      accion:
        "Implementa una secuencia de 3 contactos en los primeros 5 días: Día 1 llamada, Día 3 email con evaluación, Día 5 WhatsApp con caso de éxito.",
      impacto:
        "Subir del " +
        b1.tasaConversionLP +
        "% al 40% con " +
        (b1.totalLeads ?? 0) +
        " leads actuales = " +
        Math.round((b1.totalLeads ?? 0) * 0.4 - (b1.propuestasEnviadas ?? 0)) +
        " propuestas adicionales.",
    });
  }

  if (b1 && (b1.crecimientoMoM ?? 100) < 10) {
    recs.push({
      id: "crecimiento-bajo",
      prioridad: "alta",
      bloque: "Embudo Comercial",
      titulo: "Ritmo de captación de leads por debajo de la meta",
      problema: `Crecimiento actual ${b1.crecimientoMoM}% vs meta 15-20% mensual del Plan de Lanzamiento.`,
      accion:
        "Activa el canal LinkedIn con 3 publicaciones semanales sobre el benchmarking LATAM. Ofrece la Evaluación de Madurez gratuita como lead magnet en cada post.",
      impacto:
        "LinkedIn genera el 40% de los leads B2B en LATAM para consultoras. 500 seguidores activos pueden generar 8-12 leads/mes adicionales.",
    });
  }

  if (
    b1 &&
    (b1.leadsEvaluacion ?? 0) < (b1.leadsPortal ?? 0) &&
    (b1.leadsPortal ?? 0) > 0
  ) {
    recs.push({
      id: "evaluacion-subutilizada",
      prioridad: "media",
      bloque: "Embudo Comercial",
      titulo: "La herramienta de evaluación está siendo subutilizada",
      problema: `Más leads vienen del portal (${b1.leadsPortal}) que de la evaluación (${b1.leadsEvaluacion}). Los leads de evaluación son más calificados.`,
      accion:
        "Agrega el botón 'Evaluación Gratuita' como CTA principal en el portal web y en todos los mensajes de LinkedIn. Los leads de evaluación convierten 2x más.",
      impacto:
        "Duplicar los leads de evaluación puede mejorar la tasa de conversión general en 15-20 puntos porcentuales.",
    });
  }

  if (b2 && (b2.leadsEvaluados ?? 0) > 3 && b2.dimMasDebil) {
    const dimDebilMap: Record<string, string> = {
      "Estrategia y Dirección": "ADN Estratégico — Estrategia",
      "Gobierno Empresarial": "ADN Estratégico — Gobierno",
      "Sostenibilidad": "ADN Estratégico — Sostenibilidad",
      "Finanzas y Rentabilidad": "Motor Operativo — Finanzas",
      "Talento y Cultura": "Motor Operativo — Talento",
      "Operaciones": "Motor Operativo — Operaciones",
      "Innovación y Agilidad": "Inteligencia Digital — Innovación",
      "Estrategia Tecnológica": "Inteligencia Digital — Estrategia Tecnológica",
      "Inteligencia de Datos": "Inteligencia Digital — Datos",
      "Experiencia del Cliente": "Enfoque al Cliente — CX",
    };
    const servicio =
      dimDebilMap[b2.dimMasDebil.nombre] || b2.dimMasDebil.nombre;
    recs.push({
      id: "dim-debil",
      prioridad: "media",
      bloque: "Madurez del Mercado",
      titulo: `"${b2.dimMasDebil.nombre}" es la dimensión más débil de tu mercado (${b2.dimMasDebil.promedio}/5)`,
      problema:
        "Esta dimensión tiene el promedio más bajo entre tus leads evaluados, indicando una brecha masiva sin resolver en el mercado.",
      accion: `Posiciona el servicio "${servicio}" como tu oferta de entrada. Crea contenido específico sobre esta brecha para LinkedIn y el blog.`,
      impacto:
        "Alta demanda = menor resistencia comercial. Considera una oferta de diagnóstico express ($300-500 USD) para entrar por esta brecha.",
    });
  }

  if (b2 && (b2.brechaPromedio ?? 0) > 1) {
    recs.push({
      id: "brecha-percepcion",
      prioridad: "alta",
      bloque: "Madurez del Mercado",
      titulo: `Alta brecha de percepción: los empresarios se sobrevaloran ${(b2.brechaPromedio ?? 0).toFixed(1)} puntos`,
      problema: `Los leads se autoevalúan ${(b2.brechaPromedio ?? 0).toFixed(1)} puntos por encima de su IGM real. Esto significa que no saben lo que no saben.`,
      accion:
        "Usa este dato como argumento de venta. Muéstrales el gap entre su autopercepción y la realidad en la primera sesión de diagnóstico. Es el momento de mayor apertura al cambio.",
      impacto:
        "Los leads con mayor brecha de percepción tienen 3x más probabilidad de contratar consultoría después de ver su IGM real.",
    });
  }

  if (
    b3 &&
    (b3.valorPipelineTotal ?? 0) > 0 &&
    b3.propuestasPorEstado?.length
  ) {
    const propBorrador =
      b3.propuestasPorEstado.find((p) => p.estado === "Borrador")?.cantidad ||
      0;
    if (propBorrador > 2) {
      recs.push({
        id: "propuestas-borrador",
        prioridad: "alta",
        bloque: "Rendimiento Comercial",
        titulo: `${propBorrador} propuestas en borrador sin enviar`,
        problema:
          "Tienes propuestas preparadas pero no enviadas. Cada día de demora reduce las probabilidades de cierre.",
        accion:
          "Ir a Propuestas → filtrar por 'Borrador' → revisar y enviar hoy. El mejor momento para enviar una propuesta es siempre ahora.",
        impacto:
          "Si cada propuesta vale ~$" +
          (b3.ticketPromedio || 1500).toLocaleString() +
          " USD, tienes $" +
          (
            propBorrador * (b3.ticketPromedio || 1500)
          ).toLocaleString() +
          " USD en pipeline bloqueado.",
      });
    }
  }

  if (
    b3 &&
    (b3.ticketPromedio ?? 0) > 0 &&
    (b3.ticketPromedio ?? 1500) < 1000
  ) {
    recs.push({
      id: "ticket-bajo",
      prioridad: "media",
      bloque: "Rendimiento Comercial",
      titulo: `Ticket promedio ($${b3.ticketPromedio} USD) por debajo de la meta ($1,500 USD)`,
      problema:
        "El ticket promedio actual está por debajo de la meta del Plan de Lanzamiento para la Fase 2.",
      accion:
        "Revisa la estructura de propuestas. Asegúrate de incluir siempre el retainer de acompañamiento mensual ($500-1,200 USD/mes) como componente opcional pero recomendado.",
      impacto:
        "Agregar retainer a 30% de los clientes actuales elevaría el MRR en $" +
        Math.round((b3.totalPropuestas ?? 3) * 0.3 * 850).toLocaleString() +
        " USD/mes.",
    });
  }

  if (b4 && (b4.tasaExitoInteracciones ?? 100) < 50) {
    recs.push({
      id: "tasa-exito-baja",
      prioridad: "alta",
      bloque: "Actividad y Seguimiento",
      titulo: `Solo ${b4.tasaExitoInteracciones}% de interacciones con resultado positivo`,
      problema:
        "Más de la mitad de las comunicaciones con prospectos no está generando tracción comercial.",
      accion:
        "Revisa el script de acercamiento. El gancho más efectivo para Arquiron es ofrecer primero el reporte de evaluación gratuito, no el servicio de consultoría directamente.",
      impacto:
        "Mejorar del " +
        b4.tasaExitoInteracciones +
        "% al 65%+ de interacciones positivas puede duplicar la tasa de conversión general.",
    });
  }

  if (
    b4 &&
    (b4.totalInteracciones ?? 0) === 0 &&
    (b1?.totalLeads ?? 0) > 0
  ) {
    recs.push({
      id: "sin-actividad",
      prioridad: "critica",
      bloque: "Actividad y Seguimiento",
      titulo: "Sin interacciones registradas en el período seleccionado",
      problema: `Tienes ${b1?.totalLeads ?? 0} leads pero no hay registro de contacto en el período. El pipeline se está enfriando.`,
      accion:
        "Regresa a Interacciones y registra todas las comunicaciones que hayas tenido. Un CRM sin actividad no puede darte inteligencia comercial útil.",
      impacto:
        "Datos de actividad correctos = recomendaciones más precisas = decisiones más acertadas.",
    });
  }

  if (
    b5?.distribucionPaises &&
    b5.distribucionPaises.length === 1
  ) {
    recs.push({
      id: "un-solo-pais",
      prioridad: "info",
      bloque: "Crecimiento",
      titulo: "100% de leads concentrados en un solo país",
      problema:
        "La concentración geográfica es un riesgo del Plan de Lanzamiento. La Fase 4 requiere presencia en Ecuador y Perú.",
      accion:
        "Comienza a conectar con cámaras de comercio de Ecuador y Perú en LinkedIn. El modelo de evaluación online es 100% replicable sin presencia física.",
      impacto:
        "Ecuador y Perú tienen 1.4M y 2.1M de PYMEs respectivamente. Son mercados con IGM promedio de 2.2-2.4 (alta brecha = alta oportunidad).",
    });
  }

  const orden: Record<string, number> = {
    critica: 0,
    alta: 1,
    media: 2,
    info: 3,
  };
  return recs.sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);
}
