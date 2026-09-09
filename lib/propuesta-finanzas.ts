/**
 * Aritmética de la Sección 11 (Inversión y modelo económico) de la
 * propuesta comercial. Es la única fuente de verdad para estos cálculos:
 * la usan el PDF, el resumen del correo de envío y el guardado en BD
 * (para cachear valorUSD en el listado).
 */

export interface InversionInput {
  duracionMeses?: number | string | null;
  anticipoCOP?: number | string | null;
  honorarioFase1COP?: number | string | null;
  honorarioFase2COP?: number | string | null;
  bonoPorHitoCOP?: number | string | null;
  trmValor?: number | string | null;
}

export interface InversionCalculada {
  mesesFase1: number;
  mesesFase2: number;
  anticipoCOP: number;
  honorarioFase1COP: number;
  honorarioFase2COP: number;
  bonoPorHitoCOP: number;
  subtotalFijoCOP: number;
  ivaCOP: number;
  totalConIvaCOP: number;
  trmValor: number;
  anticipoUSD: number;
  honorarioFase1USD: number;
  honorarioFase2USD: number;
  bonoPorHitoUSD: number;
  subtotalFijoUSD: number;
  totalUSD: number;
}

const IVA_TASA = 0.19;
const NUM_HITOS = 4;

function num(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

/** Calcula todos los totales de inversión (COP/USD, IVA) a partir de los campos base de la propuesta. */
export function calcularInversion(p: InversionInput): InversionCalculada {
  const duracion = Math.max(1, Math.round(num(p.duracionMeses) || 6));
  const mesesFase1 = Math.min(duracion, Math.ceil(duracion / 2));
  const mesesFase2 = Math.max(0, duracion - mesesFase1);

  const anticipoCOP = num(p.anticipoCOP);
  const honorarioFase1COP = num(p.honorarioFase1COP);
  const honorarioFase2COP = num(p.honorarioFase2COP);
  const bonoPorHitoCOP = num(p.bonoPorHitoCOP);
  const trmValor = num(p.trmValor);

  const subtotalFijoCOP =
    anticipoCOP +
    honorarioFase1COP * mesesFase1 +
    honorarioFase2COP * mesesFase2 +
    bonoPorHitoCOP * NUM_HITOS;

  const ivaCOP = Math.round(subtotalFijoCOP * IVA_TASA);
  const totalConIvaCOP = subtotalFijoCOP + ivaCOP;

  const toUSD = (cop: number) => (trmValor > 0 ? Math.round(cop / trmValor) : 0);

  return {
    mesesFase1,
    mesesFase2,
    anticipoCOP,
    honorarioFase1COP,
    honorarioFase2COP,
    bonoPorHitoCOP,
    subtotalFijoCOP,
    ivaCOP,
    totalConIvaCOP,
    trmValor,
    anticipoUSD: toUSD(anticipoCOP),
    honorarioFase1USD: toUSD(honorarioFase1COP),
    honorarioFase2USD: toUSD(honorarioFase2COP),
    bonoPorHitoUSD: toUSD(bonoPorHitoCOP),
    subtotalFijoUSD: toUSD(subtotalFijoCOP),
    totalUSD: toUSD(totalConIvaCOP),
  };
}

export function formatCOP(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}

export function formatUSD(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
