export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  inicio: string;
  fin: string;
  todoElDia: boolean;
  tipo: TipoEvento;
  cliente: string;
  idLead: string;
  link: string;
  color: string;
  estado: string;
  htmlLink: string;
  horaInicio?: string;
  horaFin?: string;
  fecha?: string;
}

export type TipoEvento =
  | "Llamada"
  | "Reunión"
  | "Demo"
  | "Seguimiento"
  | "Propuesta"
  | "Evento";

export const TIPOS_EVENTO: {
  value: TipoEvento;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}[] = [
  {
    value: "Reunión",
    label: "Reunión",
    color: "#3b82f6",
    bgClass: "bg-blue-50",
    textClass: "text-blue-600",
    borderClass: "border-blue-200",
  },
  {
    value: "Llamada",
    label: "Llamada",
    color: "#8560C0",
    bgClass: "bg-purple-50",
    textClass: "text-purple-600",
    borderClass: "border-purple-200",
  },
  {
    value: "Demo",
    label: "Demo",
    color: "#D4881E",
    bgClass: "bg-orange-50",
    textClass: "text-orange-500",
    borderClass: "border-orange-200",
  },
  {
    value: "Seguimiento",
    label: "Seguimiento",
    color: "#22c55e",
    bgClass: "bg-green-50",
    textClass: "text-green-600",
    borderClass: "border-green-200",
  },
  {
    value: "Propuesta",
    label: "Propuesta",
    color: "#eab308",
    bgClass: "bg-yellow-50",
    textClass: "text-yellow-600",
    borderClass: "border-yellow-200",
  },
  {
    value: "Evento",
    label: "Evento",
    color: "#9ca3af",
    bgClass: "bg-gray-50",
    textClass: "text-gray-500",
    borderClass: "border-gray-200",
  },
];
