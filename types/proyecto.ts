export interface Proyecto {
  id: string; // A
  nombre: string; // B
  idLead: string; // C
  empresaCliente: string; // D
  contacto: string; // E
  emailCliente: string; // F
  consultor: string; // G
  servicioForja: string; // H
  valorUSD: string; // I
  etapaForja: string; // J
  faseActual: string; // K
  igmInicial: string; // L
  igmFinal: string; // M
  fechaInicio: string; // N
  fechaCierreEst: string; // O
  fechaCierreReal: string; // P
  estadoPago: string; // Q
  porcentajeAvance: string; // R
  proximaAccion: string; // S
  fechaProximaAccion: string; // T
  entregablesPendientes: string; // U
  notas: string; // V
  estadoProyecto: string; // W
  timestamp: string; // X
  npsScore?: string; // Y
  npsDateSaved?: string; // Z
  npsComment?: string; // AA
}

export const ETAPAS_FORJA = [
  {
    letra: "F",
    nombre: "Fijar",
    descripcion: "Diagnóstico y punto de partida",
    color: "#1B3A5C",
    bgClass: "bg-[#1B3A5C]",
    entregable: "Índice de Madurez + Benchmarking",
    orden: 1,
  },
  {
    letra: "O",
    nombre: "Orientar",
    descripcion: "Hoja de ruta estratégica",
    color: "#33487A",
    bgClass: "bg-[#33487A]",
    entregable: "Roadmap 90-180 días + Quick Wins",
    orden: 2,
  },
  {
    letra: "R",
    nombre: "Rediseñar",
    descripcion: "Intervención en procesos",
    color: "#8560C0",
    bgClass: "bg-[#8560C0]",
    entregable: "Nuevos procesos, políticas o sistemas",
    orden: 3,
  },
  {
    letra: "J",
    nombre: "Justificar",
    descripcion: "Medición de resultados",
    color: "#D4881E",
    bgClass: "bg-[#D4881E]",
    entregable: "Reporte de Impacto con KPIs",
    orden: 4,
  },
  {
    letra: "A",
    nombre: "Acompañar",
    descripcion: "Soporte post-intervención",
    color: "#22c55e",
    bgClass: "bg-green-500",
    entregable: "Sesiones de seguimiento + Mentoría",
    orden: 5,
  },
];

export const ESTADOS_PROYECTO = [
  {
    value: "ACTIVO",
    label: "Activo",
    color: "#22c55e",
    bgClass: "bg-green-50",
    textClass: "text-green-600",
  },
  {
    value: "EN_PAUSA",
    label: "En Pausa",
    color: "#D4881E",
    bgClass: "bg-orange-50",
    textClass: "text-orange-500",
  },
  {
    value: "RETRASADO",
    label: "Retrasado",
    color: "#ef4444",
    bgClass: "bg-red-50",
    textClass: "text-red-500",
  },
  {
    value: "COMPLETADO",
    label: "Completado",
    color: "#4CCED5",
    bgClass: "bg-teal-50",
    textClass: "text-teal-600",
  },
  {
    value: "CANCELADO",
    label: "Cancelado",
    color: "#9ca3af",
    bgClass: "bg-gray-50",
    textClass: "text-gray-500",
  },
];

export const ESTADOS_PAGO = [
  { value: "PENDIENTE", label: "Pendiente", color: "#D4881E" },
  { value: "PARCIAL", label: "50% recibido", color: "#eab308" },
  { value: "COMPLETO", label: "Pago completo", color: "#22c55e" },
  { value: "VENCIDO", label: "Vencido", color: "#ef4444" },
];

export const SERVICIOS_FORJA = [
  "ADN Estratégico — Diagnóstico Estratégico FORJA",
  "ADN Estratégico — Gobierno Corporativo PYME",
  "ADN Estratégico — Hoja de Ruta ASG",
  "Motor Operativo — Arquitectura Financiera",
  "Motor Operativo — Gestión del Talento",
  "Motor Operativo — Arquitectura de Procesos",
  "Inteligencia Digital — Estrategia Tecnológica",
  "Inteligencia Digital — Inteligencia de Datos",
  "Inteligencia Digital — Innovación y Agilidad",
  "Enfoque al Cliente — Arquitectura de CX",
];
