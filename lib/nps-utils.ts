export interface NPSRegistro {
  puntuacion: number;
  fecha: string;
  comentario: string;
  categoria: "Detractor" | "Pasivo" | "Promotor";
}

export function parseNPS(notas: string): NPSRegistro | null {
  if (!notas?.trim()) return null;
  const match = notas.match(/NPS:(\d+)\|FECHA:([^|]+)\|COMENTARIO:(.*)/);
  if (!match) return null;
  const puntuacion = parseInt(match[1], 10);
  if (isNaN(puntuacion) || puntuacion < 0 || puntuacion > 10) return null;
  return {
    puntuacion,
    fecha: match[2]?.trim() || "",
    comentario: (match[3] || "").trim(),
    categoria: getCategoriaNPS(puntuacion),
  };
}

export function getCategoriaNPS(score: number): "Detractor" | "Pasivo" | "Promotor" {
  if (score <= 6) return "Detractor";
  if (score <= 8) return "Pasivo";
  return "Promotor";
}

export function buildNotasConNPS(notasActuales: string, puntuacion: number, comentario: string): string {
  const fecha = new Date().toISOString().split("T")[0];
  const comentarioLimpio = (comentario || "").replace(/\|/g, " ").replace(/\n/g, " ").trim();
  const lineaNPS = `NPS:${puntuacion}|FECHA:${fecha}|COMENTARIO:${comentarioLimpio}`;
  const sinNPS = (notasActuales || "").replace(/\n?NPS:\d+\|FECHA:[^\n]*/g, "").trim();
  return sinNPS ? `${sinNPS}\n${lineaNPS}` : lineaNPS;
}
