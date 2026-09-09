-- Rediseño de Propuesta: se calca la plantilla comercial ARQUIRON.
-- Se eliminan los campos de texto libre viejos y se agrega el set de
-- campos estructurados que sí varían por propuesta (el resto del
-- documento queda fijo en la plantilla del PDF).

-- DropColumns (contenido viejo, ya no usado; solo había 1 fila de prueba)
ALTER TABLE "propuestas" DROP COLUMN IF EXISTS "introduccion";
ALTER TABLE "propuestas" DROP COLUMN IF EXISTS "diagnostico";
ALTER TABLE "propuestas" DROP COLUMN IF EXISTS "alcance";
ALTER TABLE "propuestas" DROP COLUMN IF EXISTS "metodologia";
ALTER TABLE "propuestas" DROP COLUMN IF EXISTS "entregables";
ALTER TABLE "propuestas" DROP COLUMN IF EXISTS "timeline";
ALTER TABLE "propuestas" DROP COLUMN IF EXISTS "inversion";
ALTER TABLE "propuestas" DROP COLUMN IF EXISTS "terminos";

-- AddColumns
ALTER TABLE "propuestas" ADD COLUMN "subtitulo" TEXT;
ALTER TABLE "propuestas" ADD COLUMN "cargoContacto" TEXT;
ALTER TABLE "propuestas" ADD COLUMN "sectorCliente" TEXT;
ALTER TABLE "propuestas" ADD COLUMN "ciudadPais" TEXT;
ALTER TABLE "propuestas" ADD COLUMN "nitCliente" TEXT;
ALTER TABLE "propuestas" ADD COLUMN "codigoPropuesta" TEXT;
ALTER TABLE "propuestas" ADD COLUMN "fechaValidez" DATE;

ALTER TABLE "propuestas" ADD COLUMN "fraseClave" TEXT;
ALTER TABLE "propuestas" ADD COLUMN "retoDescripcion" TEXT;
ALTER TABLE "propuestas" ADD COLUMN "duracionMeses" INTEGER DEFAULT 6;

ALTER TABLE "propuestas" ADD COLUMN "contextoNegocio" TEXT;
ALTER TABLE "propuestas" ADD COLUMN "retosIdentificados" TEXT;

ALTER TABLE "propuestas" ADD COLUMN "exclusionesAdicionales" TEXT;

ALTER TABLE "propuestas" ADD COLUMN "hito1Meses" TEXT DEFAULT 'Mes 1';
ALTER TABLE "propuestas" ADD COLUMN "hito2Meses" TEXT DEFAULT 'Meses 2 y 3';
ALTER TABLE "propuestas" ADD COLUMN "hito3Meses" TEXT DEFAULT 'Mes 4';
ALTER TABLE "propuestas" ADD COLUMN "hito4Meses" TEXT DEFAULT 'Meses 5 y 6';

ALTER TABLE "propuestas" ADD COLUMN "horasSemanales" INTEGER;

ALTER TABLE "propuestas" ADD COLUMN "anticipoCOP" DECIMAL(14,2);
ALTER TABLE "propuestas" ADD COLUMN "honorarioFase1COP" DECIMAL(14,2);
ALTER TABLE "propuestas" ADD COLUMN "honorarioFase2COP" DECIMAL(14,2);
ALTER TABLE "propuestas" ADD COLUMN "bonoPorHitoCOP" DECIMAL(14,2);
ALTER TABLE "propuestas" ADD COLUMN "trmValor" DECIMAL(10,2);
ALTER TABLE "propuestas" ADD COLUMN "trmFecha" DATE;

ALTER TABLE "propuestas" ADD COLUMN "notasAdicionales" TEXT;
