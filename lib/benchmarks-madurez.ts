export const BENCHMARK_POR_PAIS: Record<string, number[]> = {
  colombia: [2.8, 2.9, 2.6, 2.7, 2.8, 2.6, 2.7, 2.9, 2.4, 2.7],
  ecuador: [2.5, 2.4, 2.5, 2.3, 2.4, 2.7, 2.5, 2.4, 2.2, 2.5],
  peru: [2.6, 2.5, 3.0, 2.5, 2.6, 2.5, 2.4, 2.5, 2.3, 2.6],
  chile: [3.4, 3.3, 3.1, 3.2, 3.0, 3.3, 3.5, 3.4, 3.1, 3.3],
  mexico: [2.6, 2.5, 2.5, 2.6, 2.5, 2.6, 2.6, 2.7, 2.4, 2.6],
  latam: [2.7, 2.6, 2.7, 2.6, 2.6, 2.6, 2.7, 2.7, 2.5, 2.7],
};

export const IGM_POR_PAIS: Record<string, number> = {
  colombia: 2.71,
  ecuador: 2.44,
  peru: 2.55,
  chile: 3.26,
  mexico: 2.6,
  latam: 2.64,
};

export const DIMENSIONES = [
  { indice: 1, nombre: "Estrategia y Dirección", pilar: "ADN Estratégico", pilarColor: "#1B3A5C" },
  { indice: 2, nombre: "Gobierno Empresarial", pilar: "ADN Estratégico", pilarColor: "#1B3A5C" },
  { indice: 3, nombre: "Sostenibilidad", pilar: "ADN Estratégico", pilarColor: "#1B3A5C" },
  { indice: 4, nombre: "Finanzas y Rentabilidad", pilar: "Motor Operativo", pilarColor: "#33487A" },
  { indice: 5, nombre: "Talento y Cultura", pilar: "Motor Operativo", pilarColor: "#33487A" },
  { indice: 6, nombre: "Operaciones", pilar: "Motor Operativo", pilarColor: "#33487A" },
  { indice: 7, nombre: "Innovación y Agilidad", pilar: "Inteligencia Digital", pilarColor: "#8560C0" },
  { indice: 8, nombre: "Estrategia Tecnológica", pilar: "Inteligencia Digital", pilarColor: "#8560C0" },
  { indice: 9, nombre: "Inteligencia de Datos", pilar: "Inteligencia Digital", pilarColor: "#8560C0" },
  { indice: 10, nombre: "Experiencia del Cliente", pilar: "Enfoque al Cliente", pilarColor: "#D4881E" },
];

export const NIVELES_MADUREZ = [
  { min: 1.0, max: 1.9, nivel: 1, nombre: "Inicial", color: "#ef4444", bg: "bg-red-50", text: "text-red-600" },
  { min: 2.0, max: 2.9, nivel: 2, nombre: "Básico", color: "#D4881E", bg: "bg-orange-50", text: "text-orange-500" },
  { min: 3.0, max: 3.4, nivel: 3, nombre: "Definido", color: "#eab308", bg: "bg-yellow-50", text: "text-yellow-600" },
  { min: 3.5, max: 4.4, nivel: 4, nombre: "Gestionado", color: "#8560C0", bg: "bg-purple-50", text: "text-purple-600" },
  { min: 4.5, max: 5.0, nivel: 5, nombre: "Optimizado", color: "#22c55e", bg: "bg-green-50", text: "text-green-600" },
];

export const META_DEFINIDO_MAS = [3.5, 3.0, 2.8, 3.8, 3.0, 3.2, 2.7, 2.8, 2.5, 3.3];

export const BRECHA_A_SERVICIO: Record<string, string> = {
  "Estrategia y Dirección": "ADN Estratégico — Diagnóstico Estratégico FORJA",
  "Gobierno Empresarial": "ADN Estratégico — Gobierno Corporativo PYME",
  "Sostenibilidad": "ADN Estratégico — Hoja de Ruta ASG",
  "Finanzas y Rentabilidad": "Motor Operativo — Arquitectura Financiera",
  "Talento y Cultura": "Motor Operativo — Gestión del Talento",
  "Operaciones": "Motor Operativo — Arquitectura de Procesos",
  "Innovación y Agilidad": "Inteligencia Digital — Innovación y Agilidad",
  "Estrategia Tecnológica": "Inteligencia Digital — Estrategia Tecnológica",
  "Inteligencia de Datos": "Inteligencia Digital — Inteligencia de Datos",
  "Experiencia del Cliente": "Enfoque al Cliente — Arquitectura de CX",
};

export function getNivelMadurez(igm: number) {
  return (
    NIVELES_MADUREZ.find((n) => igm >= n.min && igm <= n.max) ||
    NIVELES_MADUREZ[0]
  );
}

export function normalizarPais(pais: string): string {
  const p = (pais || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (p.includes("colombia")) return "colombia";
  if (p.includes("ecuador")) return "ecuador";
  if (p.includes("peru")) return "peru";
  if (p.includes("chile")) return "chile";
  if (p.includes("mexico")) return "mexico";
  return "latam";
}

export function calcularBrechas(
  dims: number[],
  pais: string
): Array<{
  indice: number;
  nombre: string;
  pilar: string;
  pilarColor: string;
  score: number;
  benchmark: number;
  brecha: number;
}> {
  const bench = BENCHMARK_POR_PAIS[normalizarPais(pais)] || BENCHMARK_POR_PAIS.latam;
  return DIMENSIONES.map((dim, i) => ({
    ...dim,
    score: dims[i] || 0,
    benchmark: bench[i] ?? 2.6,
    brecha: parseFloat(((dims[i] || 0) - (bench[i] ?? 2.6)).toFixed(2)),
  })).sort((a, b) => a.brecha - b.brecha);
}
