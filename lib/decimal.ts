import { Prisma } from "@prisma/client";

/** Convierte a Prisma.Decimal solo si hay un número válido; "", null o undefined devuelven undefined (sin tocar el campo). */
export function toDecimal(v: string | number | undefined | null): Prisma.Decimal | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  if (s === "" || !Number.isFinite(Number(s))) return undefined;
  return new Prisma.Decimal(s);
}
