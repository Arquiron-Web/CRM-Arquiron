export interface Interaccion {
  id: string; // A
  idLead: string; // B
  emailLead: string; // C
  empresa: string; // D
  contacto: string; // E
  tipo: string; // F — Llamada|Email|Reunión|WhatsApp|Visita|Demo
  titulo: string; // G
  descripcion: string; // H
  resultado: string; // I — Positivo|Neutral|Negativo|Excelente|Sin respuesta
  duracion: string; // J — en minutos
  consultor: string; // K
  fecha: string; // L — YYYY-MM-DD
  hora: string; // M — HH:MM
  archivos: string; // N — número de archivos o nombres
  timestamp: string; // O
}
