/*
  Warnings:

  - You are about to drop the column `propuestaId` on the `tareas` table. All the data in the column will be lost.
  - You are about to drop the column `proyectoId` on the `tareas` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tareas" DROP CONSTRAINT "tareas_propuestaId_fkey";

-- DropForeignKey
ALTER TABLE "tareas" DROP CONSTRAINT "tareas_proyectoId_fkey";

-- AlterTable
ALTER TABLE "tareas" DROP COLUMN "propuestaId",
DROP COLUMN "proyectoId",
ADD COLUMN     "idReferencia" TEXT,
ADD COLUMN     "relacionadoCon" TEXT;
