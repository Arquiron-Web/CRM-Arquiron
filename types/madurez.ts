export interface DimensionEvaluada {
  indice: number;
  nombre: string;
  pilar: string;
  pilarColor: string;
  score: number;
  benchmark: number;
  brecha: number;
}

export interface NivelMadurez {
  min: number;
  max: number;
  nivel: number;
  nombre: string;
  color: string;
  bg: string;
  text: string;
}

export interface Evaluado {
  id: string;
  nombreEmpresa: string;
  sector: string;
  tamano: string;
  pais: string;
  ciudad: string;
  nombreContacto: string;
  emailCorporativo: string;
  madurezAutoevaluada: number;
  dims: number[];
  dimensiones: DimensionEvaluada[];
  igm: number;
  nivel: NivelMadurez;
  dimMasDebil: DimensionEvaluada;
  dimMasFuerte: DimensionEvaluada;
  brechaTop3: DimensionEvaluada[];
  servicioSugerido: string;
  estadoLead: string;
  timestamp: string;
  scoreLead: string;
  clasificacion: string;
  brechaPercepcion: number;
}
