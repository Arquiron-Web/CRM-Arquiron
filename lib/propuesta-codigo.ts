/** Sugiere un código de propuesta legible (ARQ-{año}-{sufijo}), editable por el consultor. */
export function generarCodigoPropuesta(id: string, fecha: Date = new Date()): string {
  const year = fecha.getFullYear();
  const suffix =
    (id || "").replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase() || "00000";
  return `ARQ-${year}-${suffix}`;
}
