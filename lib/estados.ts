export const ESTADOS_LEAD = [
  {
    value: "NUEVO",
    label: "Nuevo",
    descripcion: "Lead recién registrado, sin contactar",
    color: "#3b82f6",
    bgClass: "bg-blue-50",
    textClass: "text-blue-600",
    borderClass: "border-blue-200",
    kanban: "Prospección",
    orden: 1,
  },
  {
    value: "CONTACTADO",
    label: "Contactado",
    descripcion: "Se realizó el primer contacto",
    color: "#8560C0",
    bgClass: "bg-purple-50",
    textClass: "text-purple-600",
    borderClass: "border-purple-200",
    kanban: "Prospección",
    orden: 2,
  },
  {
    value: "CALIFICADO",
    label: "Calificado",
    descripcion: "Confirmó interés y tiene presupuesto",
    color: "#D4881E",
    bgClass: "bg-orange-50",
    textClass: "text-orange-500",
    borderClass: "border-orange-200",
    kanban: "Calificación",
    orden: 3,
  },
  {
    value: "PROPUESTA",
    label: "Propuesta",
    descripcion: "Se envió propuesta comercial",
    color: "#eab308",
    bgClass: "bg-yellow-50",
    textClass: "text-yellow-600",
    borderClass: "border-yellow-200",
    kanban: "Propuesta",
    orden: 4,
  },
  {
    value: "NEGOCIACION",
    label: "Negociación",
    descripcion: "En proceso de cierre",
    color: "#f97316",
    bgClass: "bg-amber-50",
    textClass: "text-amber-600",
    borderClass: "border-amber-200",
    kanban: "Negociación",
    orden: 5,
  },
  {
    value: "GANADO",
    label: "Ganado",
    descripcion: "Cliente confirmado",
    color: "#22c55e",
    bgClass: "bg-green-50",
    textClass: "text-green-600",
    borderClass: "border-green-200",
    kanban: "Ganado",
    orden: 6,
  },
  {
    value: "PERDIDO",
    label: "Perdido",
    descripcion: "No avanzó en el proceso",
    color: "#ef4444",
    bgClass: "bg-red-50",
    textClass: "text-red-500",
    borderClass: "border-red-200",
    kanban: null,
    orden: 7,
  },
  {
    value: "EN_ESPERA",
    label: "En Espera",
    descripcion: "Pausado temporalmente — retomar después",
    color: "#9ca3af",
    bgClass: "bg-gray-50",
    textClass: "text-gray-500",
    borderClass: "border-gray-200",
    kanban: "En Espera",
    orden: 8,
  },
] as const;

export function getEstado(value: string) {
  return (
    ESTADOS_LEAD.find((e) => e.value === value) || ESTADOS_LEAD[0]
  );
}

export const ESTADOS_KANBAN = ESTADOS_LEAD.filter((e) => e.kanban !== null);

export function getEstadoPorKanban(kanban: string): string {
  const mapa: Record<string, string> = {
    Prospección: "CONTACTADO",
    Calificación: "CALIFICADO",
    Propuesta: "PROPUESTA",
    Negociación: "NEGOCIACION",
    Ganado: "GANADO",
    "En Espera": "EN_ESPERA",
  };
  return mapa[kanban] || "NUEVO";
}

export type EstadoLead = (typeof ESTADOS_LEAD)[number]["value"];
