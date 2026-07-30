export const PAISES_LABELS: Record<string, string> = {
  latam: "LATAM",
  colombia: "Colombia",
  ecuador: "Ecuador",
  peru: "Perú",
  chile: "Chile",
  mexico: "México",
  panama: "Panamá",
  costa_rica: "Costa Rica",
  otro_latam: "Otro LATAM",
};

export const RETO_LABELS: Record<string, string> = {
  sin_estrategia: "Sin estrategia clara",
  desalineamiento: "Tecnología desalineada",
  financiero: "Problemas financieros",
  brecha_digital: "Brecha digital",
  talento: "Gestión de talento",
  clientes: "Pérdida de clientes",
  normativo: "Carga normativa",
  productividad: "Baja productividad",
  otro: "Otro reto",
};

export const DIMENSION_LABELS: Record<string, string> = {
  dim1: "Estrategia y Dirección",
  dim2: "Gobierno Empresarial",
  dim3: "Sostenibilidad",
  dim4: "Finanzas y Rentabilidad",
  dim5: "Talento y Cultura",
  dim6: "Operaciones",
  dim7: "Innovación y Agilidad",
  dim8: "Estrategia Tecnológica",
  dim9: "Inteligencia de Datos",
  dim10: "Experiencia del Cliente",
};

export { ESTADOS_LEAD, getEstado } from "@/lib/estados";

export function getRetoLabel(reto: string): string {
  const key = (reto || "").toLowerCase().trim().replace(/\s+/g, "_");
  return RETO_LABELS[key] || reto || "-";
}

export function getPaisLabel(pais: string): string {
  const key = (pais || "").toLowerCase().trim().replace(/\s+/g, "_");
  return PAISES_LABELS[key] || (key ? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Sin país");
}

export function getClasificacionColor(clasificacion: string): string {
  const c = clasificacion || "";
  if (c.includes("Oportunidad Inmediata")) return "#ef4444";
  if (c.includes("Oportunidad Alta")) return "var(--color-arquiron-orange)";
  if (c.includes("Oportunidad Media")) return "#eab308";
  if (c.includes("Oportunidad Baja")) return "#22c55e";
  if (c.includes("Sin Oportunidad")) return "#9ca3af";
  return "#9ca3af";
}

export function formatRelativeDate(timestamp: string): string {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays} días`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}
