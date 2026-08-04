import { z } from "zod";

/**
 * Esquemas de validación server-side para los endpoints de escritura.
 * Son deliberadamente permisivos con campos de texto (igual de laxos que
 * el Sheet subyacente) pero exigen el tipo correcto y un largo máximo
 * razonable, y validan formato en los campos que sí lo requieren
 * (emails, rowIndex numérico). El objetivo es defensa en profundidad,
 * no duplicar toda la UX de validación que ya vive en el cliente.
 */

const texto = (max = 500) => z.string().max(max).optional();
const rowIndex = z.coerce.number().int().min(3, "rowIndex inválido (las filas 1-2 son encabezado)");
const id = z.string().trim().min(1, "id requerido");

// ---------- Leads ----------

export const leadUpdateSchema = z.object({
  id,
  estadoLead: texto(50),
  consultorAsignado: texto(200),
  fechaContacto: texto(50),
  notas: texto(5000),
  indiceMadurez: z.union([z.string(), z.number()]).optional(),
});

export const leadManualSchema = z.object({
  nombreEmpresa: z.string().trim().min(1, "Ingresa el nombre de la empresa").max(200),
  sector: texto(100),
  tamano: texto(50),
  pais: texto(50),
  ciudad: texto(100),
  retoPrincipal: texto(100),
  anosOperacion: texto(20),
  ingresosAnuales: z.union([z.string(), z.number()]).optional(),
  valor: z.union([z.string(), z.number()]).optional(),
  exporta: texto(20),
  nombreContacto: z.string().trim().min(1, "Ingresa el nombre de contacto").max(200),
  cargo: texto(100),
  emailCorporativo: z.string().trim().email("Email inválido").max(200),
  whatsapp: texto(30),
  momentoContacto: texto(50),
  comoNosConocio: texto(50),
  referidoPor: texto(200),
  servicioSugeridoForja: texto(200),
  estadoLead: texto(50),
  fuenteFormulario: texto(50),
  aceptaPolitica: texto(10),
  consultorAsignado: texto(200),
  fechaContacto: texto(50),
  notas: texto(5000),
  scoreLead: z.union([z.string(), z.number()]).optional(),
});

/**
 * Ingesta pública de leads (Portal Web, Evaluación de Madurez). Estos
 * formularios viven en proyectos separados y llaman a /api/public/leads
 * con una API key — no hay sesión de usuario, así que esta validación es
 * la única defensa real contra datos mal formados.
 */
const leadPublicoCampos = {
  // Opcional: el formulario de contacto completo siempre lo manda; el
  // widget de newsletter (solo email) no pide nombre, se completa un
  // valor por defecto del lado del servidor.
  nombreContacto: texto(200),
  emailCorporativo: z.string().trim().email("Email inválido").max(200).optional(),
  whatsapp: texto(30),
  retoPrincipal: texto(100),
  nombreEmpresa: texto(200),
  sector: texto(100),
  tamano: texto(50),
  pais: texto(50),
  ciudad: texto(100),
  cargo: texto(100),
  momentoContacto: texto(50),
  comoNosConocio: texto(50),
  referidoPor: texto(200),
  // "contacto" (por defecto) | "newsletter" — distingue el formulario
  // completo del widget de suscripción, ambos bajo la misma API key.
  origenFormulario: texto(20),
  aceptaPolitica: z.boolean().refine((v) => v === true, {
    message: "Debes aceptar la política de tratamiento de datos",
  }),
  // Campos de la Evaluación de Madurez (opcionales; el Portal Web no los envía).
  madurezAutoevaluada: z.union([z.string(), z.number()]).optional(),
  dim1: z.union([z.string(), z.number()]).optional(),
  dim2: z.union([z.string(), z.number()]).optional(),
  dim3: z.union([z.string(), z.number()]).optional(),
  dim4: z.union([z.string(), z.number()]).optional(),
  dim5: z.union([z.string(), z.number()]).optional(),
  dim6: z.union([z.string(), z.number()]).optional(),
  dim7: z.union([z.string(), z.number()]).optional(),
  dim8: z.union([z.string(), z.number()]).optional(),
  dim9: z.union([z.string(), z.number()]).optional(),
  dim10: z.union([z.string(), z.number()]).optional(),
  indiceMadurez: z.union([z.string(), z.number()]).optional(),
};

export const leadPublicoSchema = z
  .object(leadPublicoCampos)
  .refine((d) => !!(d.emailCorporativo || d.whatsapp), {
    message: "Debes indicar al menos un email o un WhatsApp",
    path: ["emailCorporativo"],
  });

/**
 * PATCH /api/public/leads/:id — actualización progresiva del mismo lead
 * (ej. la Evaluación de Madurez captura el email primero y completa el
 * cuestionario/WhatsApp después). Todos los campos opcionales: solo se
 * actualiza lo que venga en el body, el resto del lead queda intacto.
 */
export const leadPublicoUpdateSchema = z.object(leadPublicoCampos).partial();

export const leadUpdateIgmSchema = z.object({
  idLead: z.string().trim().min(1, "idLead requerido"),
  igm: z.union([z.string(), z.number()]),
});

// ---------- Proyectos ----------

const proyectoCampos = {
  id: texto(100),
  nombre: texto(200),
  idLead: texto(100),
  empresaCliente: texto(200),
  contacto: texto(200),
  emailCliente: texto(200),
  consultor: texto(200),
  servicioForja: texto(300),
  valorUSD: z.union([z.string(), z.number()]).optional(),
  etapaForja: texto(50),
  faseActual: texto(100),
  igmInicial: z.union([z.string(), z.number()]).optional(),
  igmFinal: z.union([z.string(), z.number()]).optional(),
  fechaInicio: texto(50),
  fechaCierreEst: texto(50),
  fechaCierreReal: texto(50),
  estadoPago: texto(50),
  porcentajeAvance: z.union([z.string(), z.number()]).optional(),
  proximaAccion: texto(1000),
  fechaProximaAccion: texto(50),
  entregablesPendientes: texto(3000),
  notas: texto(5000),
  estadoProyecto: texto(50),
};

export const proyectoCreateSchema = z.object(proyectoCampos);

export const proyectoUpdateSchema = z.object({
  soloNPS: z.boolean().optional(),
  npsScore: z.union([z.string(), z.number()]).optional(),
  npsDateSaved: texto(50),
  npsComentario: texto(2000),
  ...proyectoCampos,
  id,
});

// ---------- Propuestas ----------

const propuestaCampos = {
  id: texto(100),
  titulo: texto(300),
  idLead: texto(100),
  emailCliente: texto(200),
  empresaCliente: texto(200),
  contacto: texto(200),
  consultor: texto(200),
  servicioForja: texto(300),
  introduccion: texto(5000),
  diagnostico: texto(5000),
  alcance: texto(5000),
  metodologia: texto(5000),
  entregables: texto(5000),
  timeline: texto(3000),
  inversion: texto(3000),
  terminos: texto(5000),
  valorUSD: z.union([z.string(), z.number()]).optional(),
  estado: texto(50),
  version: texto(20),
  plantilla: texto(100),
  fechaCreacion: texto(50),
  fechaEnvio: texto(50),
  fechaVisto: texto(50),
  notasInternas: texto(5000),
};

export const propuestaCreateSchema = z.object(propuestaCampos);

export const propuestaUpdateSchema = z.object({
  ...propuestaCampos,
  id,
});

// ---------- Tareas ----------

const tareaCampos = {
  id: texto(100),
  titulo: texto(300),
  descripcion: texto(3000),
  tipo: texto(50),
  prioridad: texto(20),
  asignadoA: texto(200),
  relacionadoCon: texto(50),
  idReferencia: texto(100),
  empresa: texto(200),
  fechaVencimiento: texto(50),
  hora: texto(20),
  estado: texto(50),
  completadaEn: texto(50),
  creadaPor: texto(200),
};

export const tareaCreateSchema = z.object(tareaCampos);

export const tareaUpdateSchema = z.object({
  ...tareaCampos,
  id,
});

// ---------- Interacciones ----------

export const interaccionCreateSchema = z.object({
  idLead: texto(100),
  emailLead: texto(200),
  empresa: texto(200),
  contacto: texto(200),
  tipo: texto(50),
  titulo: texto(300),
  descripcion: texto(5000),
  resultado: texto(2000),
  duracion: texto(20),
  consultor: texto(200),
  fecha: texto(50),
  hora: texto(20),
  archivos: texto(20),
});

// ---------- Calendario ----------

export const calendarioCreateSchema = z.object({
  titulo: z.string().trim().min(1, "El título es requerido").max(300),
  descripcion: texto(3000),
  ubicacion: texto(300),
  cliente: texto(200),
  idLead: texto(100),
  tipo: texto(50),
  fecha: z.string().min(1, "La fecha es requerida").max(20),
  horaInicio: texto(10),
  horaFin: texto(10),
  todoElDia: z.boolean().optional(),
});

export const calendarioUpdateSchema = calendarioCreateSchema;

// ---------- Consultores ----------

export const consultorCreateSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresa el nombre").max(200),
  email: z.string().trim().email("Email inválido").max(200),
  cargo: texto(100),
  especialidad: texto(300),
  pais: texto(50),
  ciudad: texto(100),
  fechaIngreso: texto(20),
});

export const consultorUpdateSchema = z.object({
  id,
  nombre: z.string().trim().min(1, "Ingresa el nombre").max(200),
  email: z.string().trim().email("Email inválido").max(200),
  cargo: texto(100),
  especialidad: texto(300),
  pais: texto(50),
  ciudad: texto(100),
  fechaIngreso: texto(20),
});

export const consultorDeleteSchema = z.object({ id });

/** Envuelve un safeParse en una respuesta 400 lista para retornar, o null si es válido. */
export function formatZodError(error: z.ZodError) {
  return {
    error: "Datos inválidos",
    detail: error.flatten().fieldErrors,
  };
}
