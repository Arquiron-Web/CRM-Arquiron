/**
 * Backfill: corrige leads de la Evaluación de Madurez (EME) que quedaron
 * guardados en escala 0-100 (la que manda la EME) antes de que
 * lib/leads-create.ts empezara a convertirlos a la escala 1-5 que asume el
 * resto del CRM — scoring (lib/lead-scoring.ts), benchmarks
 * (lib/benchmarks-madurez.ts), IGM manual de proyectos y los textos
 * auto-generados de propuestas. Ver docs/INTEGRACION_EVALUACION_MADUREZ.md.
 *
 * Solo toca leads con fuenteFormulario = "Evaluacion_Madurez" y algún valor
 * claramente en escala 0-100 (> 5) — un IGM real de hasta 5.0 nunca supera
 * ese umbral, así que no hay riesgo de tocar un lead ya correcto.
 *
 * Uso:
 *   npx tsx scripts/backfill-igm-scale.ts            (dry-run, no escribe nada)
 *   npx tsx scripts/backfill-igm-scale.ts --apply    (aplica los cambios)
 *
 * Requiere DATABASE_URL en el entorno (carga .env.local si no está seteada;
 * en producción, exportar la DATABASE_URL de Neon antes de correrlo).
 */
import * as fs from "fs";
import * as path from "path";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { calcularScoreLead } from "../lib/lead-scoring";

if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) {
        const key = m[1].trim();
        const val = m[2].replace(/^["']|["']$/g, "").trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

const APLICAR = process.argv.includes("--apply");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function toNum(v: Prisma.Decimal | null): number | null {
  return v === null ? null : v.toNumber();
}

function escalar(v: number | null): number | null {
  return v === null ? null : v / 20;
}

async function main() {
  const leads = await prisma.lead.findMany({
    where: { fuenteFormulario: "Evaluacion_Madurez" },
  });

  const afectados = leads.filter((l) => {
    const valores = [
      l.indiceMadurez,
      l.madurezAutoevaluada,
      l.dim1,
      l.dim2,
      l.dim3,
      l.dim4,
      l.dim5,
      l.dim6,
      l.dim7,
      l.dim8,
      l.dim9,
      l.dim10,
    ];
    return valores.some((v) => v !== null && v.toNumber() > 5);
  });

  console.log(
    `Leads Evaluacion_Madurez: ${leads.length} | con escala 0-100 a corregir: ${afectados.length}`
  );
  console.log(
    APLICAR
      ? "Modo: APLICAR cambios\n"
      : "Modo: DRY-RUN (no se escribe nada; agrega --apply para aplicar)\n"
  );

  for (const l of afectados) {
    const igmAntes = toNum(l.indiceMadurez);
    const autoAntes = toNum(l.madurezAutoevaluada);
    const dimsAntes = [
      toNum(l.dim1),
      toNum(l.dim2),
      toNum(l.dim3),
      toNum(l.dim4),
      toNum(l.dim5),
      toNum(l.dim6),
      toNum(l.dim7),
      toNum(l.dim8),
      toNum(l.dim9),
      toNum(l.dim10),
    ];

    const igmNuevo = escalar(igmAntes);
    const autoNuevo = escalar(autoAntes);
    const dimsNuevos = dimsAntes.map(escalar);

    const scoring = calcularScoreLead({
      momentoContacto: l.momentoContacto,
      comoNosConocio: l.comoNosConocio,
      fuenteFormulario: l.fuenteFormulario,
      tamano: l.tamano,
      whatsapp: l.whatsapp,
      madurezAutoevaluada: autoNuevo,
      indiceMadurez: igmNuevo,
    });

    console.log(`— ${l.nombreEmpresa || "(sin nombre)"} (${l.id})`);
    console.log(`  indiceMadurez: ${igmAntes} → ${igmNuevo}`);
    console.log(`  madurezAutoevaluada: ${autoAntes} → ${autoNuevo}`);
    console.log(`  dims: [${dimsAntes.join(", ")}] → [${dimsNuevos.join(", ")}]`);
    console.log(
      `  scoreLead/clasificación: ${l.scoreLead?.toString()} / ${l.clasificacion} → ${scoring.scoreLead} / ${scoring.clasificacion}`
    );

    if (APLICAR) {
      await prisma.lead.update({
        where: { id: l.id },
        data: {
          indiceMadurez: igmNuevo === null ? undefined : new Prisma.Decimal(igmNuevo),
          madurezAutoevaluada: autoNuevo === null ? undefined : new Prisma.Decimal(autoNuevo),
          dim1: dimsNuevos[0] === null ? undefined : new Prisma.Decimal(dimsNuevos[0]),
          dim2: dimsNuevos[1] === null ? undefined : new Prisma.Decimal(dimsNuevos[1]),
          dim3: dimsNuevos[2] === null ? undefined : new Prisma.Decimal(dimsNuevos[2]),
          dim4: dimsNuevos[3] === null ? undefined : new Prisma.Decimal(dimsNuevos[3]),
          dim5: dimsNuevos[4] === null ? undefined : new Prisma.Decimal(dimsNuevos[4]),
          dim6: dimsNuevos[5] === null ? undefined : new Prisma.Decimal(dimsNuevos[5]),
          dim7: dimsNuevos[6] === null ? undefined : new Prisma.Decimal(dimsNuevos[6]),
          dim8: dimsNuevos[7] === null ? undefined : new Prisma.Decimal(dimsNuevos[7]),
          dim9: dimsNuevos[8] === null ? undefined : new Prisma.Decimal(dimsNuevos[8]),
          dim10: dimsNuevos[9] === null ? undefined : new Prisma.Decimal(dimsNuevos[9]),
          scoreLead: new Prisma.Decimal(scoring.scoreLead),
          clasificacion: scoring.clasificacion,
          accionRecomendada: scoring.accionRecomendada,
        },
      });
      console.log("  ✅ actualizado");
    }
    console.log("");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
