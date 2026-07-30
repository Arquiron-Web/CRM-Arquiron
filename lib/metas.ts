export const METAS_FORJA = {
  tasaConversionLeadPropuesta: 40,
  tasaConversionPropuestaGanado: 40,
  ticketPromedioUSD: 1500,
  cacMaximoUSD: 300,
  npsMinimo: 60,
  crecimientoMoMMinimo: 15,
  igmPromedioMercado: 2.0,
  leadsObjetivoFase2: 50,
  propuestasObjetivoFase2: 8,
  mrrObjetivoFase2USD: 5000,
};

// Orden dim1 a dim10: Estrategia, Gobierno, Sostenibilidad, Finanzas, Talento,
// Operaciones, Innovación, Tecnología, Datos, CX
export const BENCHMARK_POR_PAIS: Record<string, number[]> = {
  colombia: [2.8, 2.9, 2.6, 2.7, 2.8, 2.6, 2.7, 2.9, 2.4, 2.7],
  ecuador: [2.5, 2.4, 2.5, 2.3, 2.4, 2.7, 2.5, 2.4, 2.2, 2.5],
  peru: [2.6, 2.5, 3.0, 2.5, 2.6, 2.5, 2.4, 2.5, 2.3, 2.6],
  chile: [3.4, 3.3, 3.1, 3.2, 3.0, 3.3, 3.5, 3.4, 3.1, 3.3],
  latam: [2.7, 2.6, 2.7, 2.6, 2.6, 2.6, 2.7, 2.7, 2.5, 2.7],
  mexico: [2.6, 2.5, 2.5, 2.6, 2.5, 2.6, 2.6, 2.7, 2.4, 2.6],
  default: [2.7, 2.6, 2.7, 2.6, 2.6, 2.6, 2.7, 2.7, 2.5, 2.7],
};

export const IGM_POR_PAIS: Record<string, number> = {
  colombia: 2.71,
  ecuador: 2.44,
  peru: 2.55,
  chile: 3.26,
  latam: 2.64,
  mexico: 2.6,
  default: 2.64,
};

export function normalizarPais(pais: string): string {
  const p = pais
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (p.includes("colombia")) return "colombia";
  if (p.includes("ecuador")) return "ecuador";
  if (p.includes("peru") || p.includes("perú")) return "peru";
  if (p.includes("chile")) return "chile";
  if (p.includes("mexico") || p.includes("méxico")) return "mexico";
  return "latam";
}
