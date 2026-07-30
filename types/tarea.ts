export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  prioridad: string;
  asignadoA: string;
  relacionadoCon: string;
  idReferencia: string;
  empresa: string;
  fechaVencimiento: string;
  hora: string;
  estado: string;
  completadaEn: string;
  creadaPor: string;
  timestamp: string;
}

export const TIPOS_TAREA = [
  { value: "llamada", label: "Llamada", icon: "phone", color: "#8560C0" },
  { value: "email", label: "Email", icon: "mail", color: "#3b82f6" },
  { value: "reunion", label: "Reunión", icon: "calendar", color: "#D4881E" },
  { value: "propuesta", label: "Enviar propuesta", icon: "file-text", color: "#1B3A5C" },
  { value: "seguimiento", label: "Seguimiento", icon: "refresh-cw", color: "#4CCED5" },
  { value: "entregable", label: "Entregable", icon: "check-square", color: "#22c55e" },
  { value: "pago", label: "Gestión de pago", icon: "dollar-sign", color: "#eab308" },
  { value: "otro", label: "Otro", icon: "more-horizontal", color: "#9ca3af" },
];

export const PRIORIDADES_TAREA = [
  { value: "urgente", label: "Urgente", color: "#ef4444", bgClass: "bg-red-50", textClass: "text-red-600" },
  { value: "alta", label: "Alta", color: "#D4881E", bgClass: "bg-orange-50", textClass: "text-orange-500" },
  { value: "media", label: "Media", color: "#eab308", bgClass: "bg-yellow-50", textClass: "text-yellow-600" },
  { value: "baja", label: "Baja", color: "#22c55e", bgClass: "bg-green-50", textClass: "text-green-600" },
];

export const ESTADOS_TAREA = [
  { value: "PENDIENTE", label: "Pendiente", color: "#9ca3af" },
  { value: "EN_PROGRESO", label: "En progreso", color: "#3b82f6" },
  { value: "COMPLETADA", label: "Completada", color: "#22c55e" },
  { value: "CANCELADA", label: "Cancelada", color: "#ef4444" },
];
