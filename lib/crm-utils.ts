/**
 * Mapea el reto principal del lead al servicio sugerido de FORJA.
 */
export function mapRetoPrincipalToServicio(reto: string): string {
  const key = (reto || "").toLowerCase().trim().replace(/\s+/g, "_");
  const mapping: Record<string, string> = {
    sin_estrategia: "Estrategia y Planificación",
    desalineamiento: "Transformación Digital",
    financiero: "Finanzas y Rentabilidad",
    brecha_digital: "Digitalización",
    talento: "Gestión de Talento",
    clientes: "Experiencia del Cliente",
    normativo: "Cumplimiento Normativo",
    productividad: "Productividad Operativa",
    otro: "Consultoría General",
  };
  return mapping[key] || "Consultoría General";
}
