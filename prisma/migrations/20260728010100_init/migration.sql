-- CreateEnum
CREATE TYPE "EstadoLead" AS ENUM ('NUEVO', 'CONTACTADO', 'CALIFICADO', 'PROPUESTA', 'NEGOCIACION', 'GANADO', 'PERDIDO', 'EN_ESPERA');

-- CreateEnum
CREATE TYPE "EstadoPropuesta" AS ENUM ('Borrador', 'Lista', 'Enviada', 'Vista', 'Aceptada', 'Rechazada', 'Vencida');

-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('ACTIVO', 'EN_PAUSA', 'RETRASADO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PARCIAL', 'COMPLETO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "TipoTarea" AS ENUM ('llamada', 'email', 'reunion', 'propuesta', 'seguimiento', 'entregable', 'pago', 'otro');

-- CreateEnum
CREATE TYPE "PrioridadTarea" AS ENUM ('urgente', 'alta', 'media', 'baja');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "consultores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cargo" TEXT,
    "especialidad" TEXT,
    "pais" TEXT,
    "ciudad" TEXT,
    "fechaIngreso" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "nombreEmpresa" TEXT NOT NULL,
    "sector" TEXT,
    "tamano" TEXT,
    "pais" TEXT,
    "ciudad" TEXT,
    "retoPrincipal" TEXT,
    "anosOperacion" TEXT,
    "ingresoAnual" TEXT,
    "exporta" BOOLEAN,
    "nombreContacto" TEXT NOT NULL,
    "cargo" TEXT,
    "emailCorporativo" TEXT NOT NULL,
    "whatsapp" TEXT,
    "momentoContacto" TEXT,
    "comoNosConocio" TEXT,
    "madurezAutoevaluada" DECIMAL(5,2),
    "dim1" DECIMAL(5,2),
    "dim2" DECIMAL(5,2),
    "dim3" DECIMAL(5,2),
    "dim4" DECIMAL(5,2),
    "dim5" DECIMAL(5,2),
    "dim6" DECIMAL(5,2),
    "dim7" DECIMAL(5,2),
    "dim8" DECIMAL(5,2),
    "dim9" DECIMAL(5,2),
    "dim10" DECIMAL(5,2),
    "indiceMadurez" DECIMAL(5,2),
    "servicioSugeridoForja" TEXT,
    "estadoLead" "EstadoLead" NOT NULL DEFAULT 'NUEVO',
    "fuenteFormulario" TEXT,
    "aceptaPoliticaDatos" BOOLEAN NOT NULL DEFAULT false,
    "consultorId" TEXT,
    "fechaContacto" DATE,
    "notas" TEXT,
    "scoreLead" DECIMAL(6,2),
    "clasificacion" TEXT,
    "accionRecomendada" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propuestas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "leadId" TEXT,
    "emailCliente" TEXT,
    "empresaCliente" TEXT,
    "contacto" TEXT,
    "consultorId" TEXT,
    "servicioForja" TEXT,
    "introduccion" TEXT,
    "diagnostico" TEXT,
    "alcance" TEXT,
    "metodologia" TEXT,
    "entregables" TEXT,
    "timeline" TEXT,
    "inversion" TEXT,
    "terminos" TEXT,
    "valorUSD" DECIMAL(12,2),
    "estado" "EstadoPropuesta" NOT NULL DEFAULT 'Borrador',
    "version" TEXT,
    "plantilla" TEXT,
    "fechaCreacion" DATE,
    "fechaEnvio" DATE,
    "fechaVisto" DATE,
    "notasInternas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propuestas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "leadId" TEXT,
    "empresaCliente" TEXT,
    "contacto" TEXT,
    "emailCliente" TEXT,
    "consultorId" TEXT,
    "servicioForja" TEXT,
    "valorUSD" DECIMAL(12,2),
    "etapaForja" TEXT,
    "faseActual" TEXT,
    "igmInicial" DECIMAL(5,2),
    "igmFinal" DECIMAL(5,2),
    "fechaInicio" DATE,
    "fechaCierreEst" DATE,
    "fechaCierreReal" DATE,
    "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "porcentajeAvance" INTEGER,
    "proximaAccion" TEXT,
    "fechaProximaAccion" DATE,
    "entregablesPendientes" TEXT,
    "notas" TEXT,
    "estadoProyecto" "EstadoProyecto" NOT NULL DEFAULT 'ACTIVO',
    "npsScore" INTEGER,
    "npsDateSaved" TIMESTAMP(3),
    "npsComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tareas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoTarea",
    "prioridad" "PrioridadTarea",
    "asignadoAId" TEXT,
    "leadId" TEXT,
    "proyectoId" TEXT,
    "propuestaId" TEXT,
    "empresa" TEXT,
    "fechaVencimiento" DATE,
    "hora" TEXT,
    "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
    "completadaEn" TIMESTAMP(3),
    "creadaPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interacciones" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "emailLead" TEXT,
    "empresa" TEXT,
    "contacto" TEXT,
    "tipo" TEXT,
    "titulo" TEXT,
    "descripcion" TEXT,
    "resultado" TEXT,
    "duracion" INTEGER,
    "consultorId" TEXT,
    "fecha" DATE,
    "hora" TEXT,
    "archivos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interacciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consultores_email_key" ON "consultores"("email");

-- CreateIndex
CREATE INDEX "leads_estadoLead_idx" ON "leads"("estadoLead");

-- CreateIndex
CREATE INDEX "leads_consultorId_idx" ON "leads"("consultorId");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_consultorId_fkey" FOREIGN KEY ("consultorId") REFERENCES "consultores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propuestas" ADD CONSTRAINT "propuestas_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propuestas" ADD CONSTRAINT "propuestas_consultorId_fkey" FOREIGN KEY ("consultorId") REFERENCES "consultores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_consultorId_fkey" FOREIGN KEY ("consultorId") REFERENCES "consultores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "consultores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_propuestaId_fkey" FOREIGN KEY ("propuestaId") REFERENCES "propuestas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacciones" ADD CONSTRAINT "interacciones_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacciones" ADD CONSTRAINT "interacciones_consultorId_fkey" FOREIGN KEY ("consultorId") REFERENCES "consultores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
