import { DIMENSION_LABELS } from "@/lib/pipeline-utils";
import type { Lead } from "@/types/lead";

const NIVELES_IGM: Record<number, string> = {
  1: "inicial",
  2: "en desarrollo",
  3: "definido",
  4: "gestionado",
  5: "optimizado",
};

export function generarDiagnosticoDesdeLead(lead: Lead): string {
  const igm = parseFloat(lead.indiceMadurez || "0");
  const empresa = lead.nombreEmpresa || "la empresa";

  if (!igm || isNaN(igm)) {
    return "";
  }

  const nivel = NIVELES_IGM[Math.round(igm)] || "en desarrollo";

  const dims = [
    { key: "dim1", value: parseFloat(lead.dim1) || 0 },
    { key: "dim2", value: parseFloat(lead.dim2) || 0 },
    { key: "dim3", value: parseFloat(lead.dim3) || 0 },
    { key: "dim4", value: parseFloat(lead.dim4) || 0 },
    { key: "dim5", value: parseFloat(lead.dim5) || 0 },
    { key: "dim6", value: parseFloat(lead.dim6) || 0 },
    { key: "dim7", value: parseFloat(lead.dim7) || 0 },
    { key: "dim8", value: parseFloat(lead.dim8) || 0 },
    { key: "dim9", value: parseFloat(lead.dim9) || 0 },
    { key: "dim10", value: parseFloat(lead.dim10) || 0 },
  ];

  const ordenadas = [...dims].sort((a, b) => a.value - b.value);
  const brechas = ordenadas
    .slice(0, 3)
    .map(
      (d) =>
        `${DIMENSION_LABELS[d.key as keyof typeof DIMENSION_LABELS] || d.key} (${d.value}/5)`
    )
    .join(", ");

  return `El diagnóstico de madurez empresarial de ${empresa} arroja un Índice Global de Madurez (IGM) de ${igm.toFixed(1)}/5, ubicándose en el nivel ${nivel}. Las dimensiones con mayor brecha identificadas son: ${brechas}.`;
}

export function generarDiagnosticoDesdeParams(params: {
  empresa?: string;
  igm?: string | number;
  dimDebil?: string;
}): string {
  const empresa = params.empresa || "la empresa";
  const igm = typeof params.igm === "string" ? parseFloat(params.igm) : (params.igm ?? 0);
  const dimDebil = params.dimDebil || "";

  if (!igm || isNaN(igm)) return "";

  const nivel = igm < 2 ? "inicial" : igm < 3 ? "en desarrollo" : igm < 3.5 ? "definido" : igm < 4.5 ? "gestionado" : "optimizado";
  const brechas = dimDebil ? `La dimensión con mayor brecha identificada es: ${dimDebil}.` : "";

  return `El diagnóstico de madurez empresarial de ${empresa} arroja un Índice Global de Madurez (IGM) de ${igm.toFixed(1)}/5, ubicándose en el nivel ${nivel}. ${brechas}`.trim();
}
