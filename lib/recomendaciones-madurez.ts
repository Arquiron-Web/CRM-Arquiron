/**
 * Acciones recomendadas por dimensión de la Evaluación de Madurez.
 *
 * Son las mismas que la EME le muestra al lead en su informe (sección
 * "Recomendaciones priorizadas"), así el consultor llega a la reunión
 * sabiendo qué le dijo ya la herramienta. La clave es el `nombre` de cada
 * dimensión en DIMENSIONES (lib/benchmarks-madurez.ts).
 *
 * Si la EME cambia estos textos, hay que actualizarlos aquí también: el CRM
 * no los recibe en el payload, solo las puntuaciones.
 */
export const RECOMENDACIONES_POR_DIMENSION: Record<string, string[]> = {
  "Estrategia y Dirección": [
    "Define y comunica la visión, misión y valores de la empresa a todo el equipo",
    "Establece un plan estratégico con objetivos SMART a 1, 3 y 5 años",
    "Implementa reuniones mensuales de revisión estratégica con KPIs claros",
    "Realiza un análisis FODA del entorno competitivo trimestralmente",
  ],
  "Gobierno Empresarial": [
    "Documenta las políticas de gobierno corporativo y compártelas con el equipo",
    "Define un organigrama claro con roles, responsabilidades y niveles de autoridad",
    "Considera establecer un consejo consultivo con expertos externos",
    "Implementa un sistema de gestión de riesgos con evaluación periódica",
  ],
  Sostenibilidad: [
    "Realiza un diagnóstico de impacto ambiental de tus operaciones",
    "Implementa al menos 3 prácticas de sostenibilidad medibles",
    "Establece criterios de sostenibilidad para la selección de proveedores",
    "Comunica tus iniciativas de responsabilidad social a stakeholders",
  ],
  "Finanzas y Rentabilidad": [
    "Asegura que los estados financieros se actualicen y analicen mensualmente",
    "Crea un presupuesto anual detallado con seguimiento mensual de desviaciones",
    "Identifica y optimiza los márgenes de rentabilidad por producto/servicio",
    "Desarrolla modelos de proyección financiera con escenarios optimista, base y pesimista",
  ],
  "Talento y Cultura": [
    "Formaliza los procesos de reclutamiento con perfiles y competencias definidos",
    "Crea un plan de capacitación anual alineado con la estrategia del negocio",
    "Implementa evaluaciones de desempeño semestrales con planes de desarrollo",
    "Mide el engagement del equipo con encuestas periódicas y actúa en los resultados",
  ],
  Operaciones: [
    "Documenta y estandariza los procesos operativos críticos",
    "Implementa KPIs operativos: tiempos de entrega, productividad, calidad",
    "Diversifica proveedores clave y crea planes de contingencia",
    "Adopta herramientas digitales para gestión de inventarios y logística",
  ],
  "Innovación y Agilidad": [
    "Establece un proceso formal para capturar y evaluar ideas de innovación",
    "Destina al menos 5% del presupuesto a iniciativas de innovación",
    "Adopta metodologías ágiles para la gestión de proyectos",
    "Monitorea tendencias de mercado y tecnología relevantes para tu industria",
  ],
  "Estrategia Tecnológica": [
    "Desarrolla una estrategia tecnológica alineada con los objetivos del negocio",
    "Integra los sistemas core para asegurar flujo eficiente de información",
    "Implementa protocolos básicos de ciberseguridad y protección de datos",
    "Evalúa la escalabilidad de tu infraestructura tecnológica actual",
  ],
  "Inteligencia de Datos": [
    "Centraliza los datos clave del negocio en una plataforma accesible",
    "Implementa dashboards para los KPIs más importantes del negocio",
    "Establece políticas de gobernanza de datos: calidad, seguridad y privacidad",
    "Capacita al equipo en herramientas básicas de análisis de datos",
  ],
  "Experiencia del Cliente": [
    "Segmenta tu base de clientes y desarrolla propuestas de valor diferenciadas",
    "Implementa medición sistemática de satisfacción del cliente (NPS/CSAT)",
    "Mapea el customer journey e identifica puntos de fricción prioritarios",
    "Desarrolla estrategias activas de retención y programas de fidelización",
  ],
};
