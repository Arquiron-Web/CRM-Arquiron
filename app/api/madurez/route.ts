import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  DIMENSIONES,
  getNivelMadurez,
  normalizarPais,
  BENCHMARK_POR_PAIS,
} from "@/lib/benchmarks-madurez";

export const dynamic = "force-dynamic";

const num = (v: unknown) => (v === null || v === undefined ? 0 : parseFloat(v.toString()));

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesión expirada. Vuelve a iniciar sesión." },
        { status: 401 }
      );
    }

    const leads = await prisma.lead.findMany({
      where: { indiceMadurez: { gt: 0 } },
    });

    const evaluados = leads
      .map((l) => {
        const dims = [
          l.dim1, l.dim2, l.dim3, l.dim4, l.dim5,
          l.dim6, l.dim7, l.dim8, l.dim9, l.dim10,
        ].map(num);
        const igm = num(l.indiceMadurez);
        const pais = normalizarPais(l.pais || "");
        const bench = BENCHMARK_POR_PAIS[pais] || BENCHMARK_POR_PAIS.latam;

        const dimensiones = DIMENSIONES.map((dim, i) => ({
          indice: dim.indice,
          nombre: dim.nombre,
          pilar: dim.pilar,
          score: dims[i],
          benchmark: bench[i] ?? 2.6,
          brecha: parseFloat((dims[i] - (bench[i] ?? 2.6)).toFixed(2)),
        }));

        const dimMasDebil = [...dimensiones].sort((a, b) => a.score - b.score)[0];
        const dimMasFuerte = [...dimensiones].sort((a, b) => b.score - a.score)[0];
        const brechaTop3 = [...dimensiones].sort((a, b) => a.brecha - b.brecha).slice(0, 3);

        const madurezAutoevaluada = num(l.madurezAutoevaluada);

        return {
          id: l.id,
          nombreEmpresa: l.nombreEmpresa,
          sector: l.sector || "",
          tamano: l.tamano || "",
          pais: l.pais || "",
          ciudad: l.ciudad || "",
          nombreContacto: l.nombreContacto,
          emailCorporativo: l.emailCorporativo,
          madurezAutoevaluada,
          dims,
          dimensiones,
          igm,
          nivel: getNivelMadurez(igm),
          dimMasDebil,
          dimMasFuerte,
          brechaTop3,
          servicioSugerido: l.servicioSugeridoForja || "",
          estadoLead: l.estadoLead,
          timestamp: l.createdAt.toISOString(),
          scoreLead: l.scoreLead?.toString() || "",
          clasificacion: l.clasificacion || "",
          brechaPercepcion: parseFloat((madurezAutoevaluada - igm).toFixed(2)),
        };
      })
      .sort((a, b) => b.igm - a.igm);

    const totalEvaluados = evaluados.length;
    const igmPromedio =
      totalEvaluados > 0
        ? evaluados.reduce((s, e) => s + e.igm, 0) / totalEvaluados
        : 0;

    const promediosDim = DIMENSIONES.map((dim, i) => ({
      ...dim,
      promedio:
        totalEvaluados > 0
          ? parseFloat(
              (
                evaluados.reduce((s, e) => s + (e.dims[i] || 0), 0) /
                totalEvaluados
              ).toFixed(2)
            )
          : 0,
    }));

    const dimMasDebilGlobal = [...promediosDim].sort((a, b) => a.promedio - b.promedio)[0];
    const dimMasFuerteGlobal = [...promediosDim].sort((a, b) => b.promedio - a.promedio)[0];

    const distribucionNiveles = {
      inicial: evaluados.filter((e) => e.igm < 2).length,
      basico: evaluados.filter((e) => e.igm >= 2 && e.igm < 3).length,
      definido: evaluados.filter((e) => e.igm >= 3 && e.igm < 3.5).length,
      gestionado: evaluados.filter((e) => e.igm >= 3.5 && e.igm < 4.5).length,
      optimizado: evaluados.filter((e) => e.igm >= 4.5).length,
    };

    const brechaPercepcionPromedio =
      totalEvaluados > 0
        ? evaluados.reduce((s, e) => s + e.brechaPercepcion, 0) / totalEvaluados
        : 0;

    return NextResponse.json({
      evaluados,
      stats: {
        totalEvaluados,
        igmPromedio: parseFloat(igmPromedio.toFixed(2)),
        promediosDim,
        dimMasDebilGlobal,
        dimMasFuerteGlobal,
        distribucionNiveles,
        brechaPercepcionPromedio: parseFloat(brechaPercepcionPromedio.toFixed(2)),
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error GET /api/madurez:", err?.message);
    return NextResponse.json(
      { error: "Error al cargar datos de madurez", detail: err?.message },
      { status: 500 }
    );
  }
}
