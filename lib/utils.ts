import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calcularTiempoRelativo(timestamp: string): string {
  if (!timestamp) return "Nunca"
  const fecha = new Date(timestamp)
  const ahora = new Date()
  const diffMs = ahora.getTime() - fecha.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDias = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return "Ahora mismo"
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHrs < 24) return `Hace ${diffHrs} horas`
  if (diffDias === 1) return "Ayer"
  if (diffDias < 7) return `Hace ${diffDias} días`
  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  })
}
