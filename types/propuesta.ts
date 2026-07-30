export interface Propuesta {
  id: string;
  titulo: string;
  idLead: string;
  emailCliente: string;
  empresaCliente: string;
  contacto: string;
  consultor: string;
  servicioForja: string;
  introduccion: string;
  diagnostico: string;
  alcance: string;
  metodologia: string;
  entregables: string;
  timeline: string;
  inversion: string;
  terminos: string;
  valorUSD: string;
  estado: string;
  version: string;
  plantilla: string;
  fechaCreacion: string;
  fechaEnvio: string;
  fechaVisto: string;
  notasInternas: string;
  timestamp: string;
}

export type EstadoPropuesta =
  | "Borrador"
  | "Lista"
  | "Enviada"
  | "Vista"
  | "Aceptada"
  | "Rechazada"
  | "Vencida";

export const ESTADOS_PROPUESTA = [
  {
    value: "Borrador",
    label: "Borrador",
    color: "#9ca3af",
    bgClass: "bg-gray-50",
    textClass: "text-gray-500",
    borderClass: "border-gray-200",
  },
  {
    value: "Lista",
    label: "Lista para enviar",
    color: "#3b82f6",
    bgClass: "bg-blue-50",
    textClass: "text-blue-600",
    borderClass: "border-blue-200",
  },
  {
    value: "Enviada",
    label: "Enviada",
    color: "#8560C0",
    bgClass: "bg-purple-50",
    textClass: "text-purple-600",
    borderClass: "border-purple-200",
  },
  {
    value: "Vista",
    label: "Vista por el cliente",
    color: "#D4881E",
    bgClass: "bg-orange-50",
    textClass: "text-orange-500",
    borderClass: "border-orange-200",
  },
  {
    value: "Aceptada",
    label: "Aceptada",
    color: "#22c55e",
    bgClass: "bg-green-50",
    textClass: "text-green-600",
    borderClass: "border-green-200",
  },
  {
    value: "Rechazada",
    label: "Rechazada",
    color: "#ef4444",
    bgClass: "bg-red-50",
    textClass: "text-red-500",
    borderClass: "border-red-200",
  },
  {
    value: "Vencida",
    label: "Vencida",
    color: "#f97316",
    bgClass: "bg-amber-50",
    textClass: "text-amber-500",
    borderClass: "border-amber-200",
  },
];
