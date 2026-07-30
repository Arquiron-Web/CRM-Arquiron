import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const num = (v: unknown) => (v === null || v === undefined ? 0 : parseFloat(v.toString()));

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || "mes";

    const [leadsRaw, propuestasRaw, interaccionesRaw, proyectosRaw] = await Promise.all([
      prisma.lead.findMany({ include: { consultor: true } }),
      prisma.propuesta.findMany({ include: { consultor: true } }),
      prisma.interaccion.findMany(),
      prisma.proyecto.findMany(),
    ]);

    const ahora = new Date();
    const filtrarPorPeriodo = (fecha: Date): boolean => {
      if (periodo === "todo") return true;
      const diffDias = (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24);
      if (periodo === "semana") return diffDias <= 7;
      if (periodo === "mes") return diffDias <= 30;
      if (periodo === "trimestre") return diffDias <= 90;
      if (periodo === "anio") return diffDias <= 365;
      return true;
    };

    const leads = leadsRaw.filter((l) => filtrarPorPeriodo(l.createdAt));
    const propuestas = propuestasRaw.filter((p) => filtrarPorPeriodo(p.createdAt));
    const interacciones = interaccionesRaw.filter((i) => filtrarPorPeriodo(i.createdAt));

    const totalLeads = leads.length;
    const leadsNuevos = leads.filter((l) => l.estadoLead === "NUEVO").length;
    const leadsContactados = leads.filter((l) => l.estadoLead === "CONTACTADO").length;
    const leadsCalificados = leads.filter((l) => l.estadoLead === "CALIFICADO").length;
    const propuestasEnv = propuestas.filter((p) =>
      ["Enviada", "Vista", "Aceptada", "Lista"].includes(p.estado)
    ).length;
    const propuestasGanadas = propuestas.filter((p) => p.estado === "Aceptada").length;
    const tasaConvLP = totalLeads > 0 ? propuestasEnv / totalLeads : 0;
    const tasaConvPG = propuestasEnv > 0 ? propuestasGanadas / propuestasEnv : 0;

    const leadsUrgentes = leads.filter((l) => {
      if (l.estadoLead !== "NUEVO") return false;
      const diffHoras = (ahora.getTime() - l.createdAt.getTime()) / 3600000;
      return diffHoras > 48;
    }).length;

    const embudoData = [
      { etapa: "Leads", cantidad: totalLeads, color: "#1B3A5C" },
      { etapa: "Contactados", cantidad: leadsContactados, color: "#33487A" },
      { etapa: "Calificados", cantidad: leadsCalificados, color: "#8560C0" },
      { etapa: "Propuestas", cantidad: propuestasEnv, color: "#D4881E" },
      { etapa: "Ganados", cantidad: propuestasGanadas, color: "#22c55e" },
    ];

    const leadsPortal = leadsRaw.filter((l) => l.fuenteFormulario === "Portal_Empresarial").length;
    const leadsEvaluacion = leadsRaw.filter((l) => l.fuenteFormulario === "Evaluacion_Madurez").length;
    const leadsManual = leadsRaw.filter((l) => l.fuenteFormulario === "CRM_Manual").length;

    const leadsPorMes: Record<string, number> = {};
    leadsRaw.forEach((l) => {
      const fecha = l.createdAt;
      const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
      leadsPorMes[clave] = (leadsPorMes[clave] || 0) + 1;
    });
    const tendenciaLeads = Object.entries(leadsPorMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([mes, cantidad]) => ({
        mes: new Date(mes + "-01").toLocaleDateString("es-CO", {
          month: "short",
          year: "2-digit",
        }),
        cantidad,
      }));

    const meses = tendenciaLeads;
    const mesActual = meses[meses.length - 1]?.cantidad || 0;
    const mesAnterior = meses[meses.length - 2]?.cantidad || 1;
    const crecimientoMoM = mesAnterior > 0 ? ((mesActual - mesAnterior) / mesAnterior) * 100 : 0;

    const leadsConIGM = leads.filter((l) => num(l.indiceMadurez) > 0);
    const igmPromedio =
      leadsConIGM.length > 0
        ? leadsConIGM.reduce((sum, l) => sum + num(l.indiceMadurez), 0) / leadsConIGM.length
        : 0;

    const BENCHMARK_LATAM: Record<string, number> = {
      "Estrategia y Dirección": 2.7,
      "Gobierno Empresarial": 2.6,
      "Sostenibilidad": 2.7,
      "Finanzas y Rentabilidad": 2.6,
      "Talento y Cultura": 2.6,
      "Operaciones": 2.6,
      "Innovación y Agilidad": 2.7,
      "Estrategia Tecnológica": 2.7,
      "Inteligencia de Datos": 2.5,
      "Experiencia del Cliente": 2.7,
    };

    const BENCHMARK_META: Record<string, number> = {
      "Estrategia y Dirección": 3.5,
      "Gobierno Empresarial": 3.0,
      "Sostenibilidad": 2.8,
      "Finanzas y Rentabilidad": 3.8,
      "Operaciones": 3.2,
      "Talento y Cultura": 3.0,
      "Innovación y Agilidad": 2.7,
      "Inteligencia de Datos": 2.5,
      "Estrategia Tecnológica": 2.8,
      "Experiencia del Cliente": 3.3,
    };

    const dimNames = [
      "Estrategia y Dirección",
      "Gobierno Empresarial",
      "Sostenibilidad",
      "Finanzas y Rentabilidad",
      "Talento y Cultura",
      "Operaciones",
      "Innovación y Agilidad",
      "Estrategia Tecnológica",
      "Inteligencia de Datos",
      "Experiencia del Cliente",
    ];
    const dimKeys = [
      "dim1", "dim2", "dim3", "dim4", "dim5",
      "dim6", "dim7", "dim8", "dim9", "dim10",
    ] as const;
    const promediosDim = dimNames.map((nombre, i) => {
      const key = dimKeys[i];
      const vals = leadsConIGM.filter((l) => num(l[key]) > 0);
      const prom =
        vals.length > 0
          ? vals.reduce((s, l) => s + num(l[key]), 0) / vals.length
          : 0;
      return {
        nombre,
        promedio: parseFloat(prom.toFixed(2)),
        benchmarkLATAM: BENCHMARK_LATAM[nombre] ?? 2.6,
        benchmarkMeta: BENCHMARK_META[nombre] ?? 3.0,
        indice: i + 1,
      };
    });

    const dimMasDebil = [...promediosDim].sort((a, b) => a.promedio - b.promedio)[0];
    const dimMasFuerte = [...promediosDim].sort((a, b) => b.promedio - a.promedio)[0];

    const distribucionMadurez = {
      inicial: leadsConIGM.filter((l) => num(l.indiceMadurez) < 2).length,
      basico: leadsConIGM.filter((l) => num(l.indiceMadurez) >= 2 && num(l.indiceMadurez) < 3).length,
      definido: leadsConIGM.filter((l) => num(l.indiceMadurez) >= 3 && num(l.indiceMadurez) < 4).length,
      gestionado: leadsConIGM.filter((l) => num(l.indiceMadurez) >= 4 && num(l.indiceMadurez) < 4.5).length,
      optimizado: leadsConIGM.filter((l) => num(l.indiceMadurez) >= 4.5).length,
    };

    const leadsConBrecha = leads.filter(
      (l) => num(l.madurezAutoevaluada) > 0 && num(l.indiceMadurez) > 0
    );
    const brechaPromedio =
      leadsConBrecha.length > 0
        ? leadsConBrecha.reduce((s, l) => s + (num(l.madurezAutoevaluada) - num(l.indiceMadurez)), 0) /
          leadsConBrecha.length
        : 0;

    const retoCount: Record<string, number> = {};
    leads.forEach((l) => {
      if (l.retoPrincipal) retoCount[l.retoPrincipal] = (retoCount[l.retoPrincipal] || 0) + 1;
    });
    const topRetos = Object.entries(retoCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([reto, count]) => ({ reto, count }));

    const servicioCount: Record<string, number> = {};
    leads.forEach((l) => {
      if (l.servicioSugeridoForja)
        servicioCount[l.servicioSugeridoForja] = (servicioCount[l.servicioSugeridoForja] || 0) + 1;
    });
    const topServicios = Object.entries(servicioCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([servicio, count]) => ({ servicio, count }));

    const valorPipelineTotal = propuestasRaw
      .filter((p) => ["Enviada", "Vista", "Lista"].includes(p.estado))
      .reduce((s, p) => s + num(p.valorUSD), 0);

    const propGanadas = propuestasRaw.filter((p) => p.estado === "Aceptada");
    const ticketPromedio =
      propGanadas.length > 0
        ? propGanadas.reduce((s, p) => s + num(p.valorUSD), 0) / propGanadas.length
        : 0;

    const propuestasPorEstado = [
      "Borrador",
      "Lista",
      "Enviada",
      "Vista",
      "Aceptada",
      "Rechazada",
      "Vencida",
    ]
      .map((estado) => ({
        estado,
        cantidad: propuestasRaw.filter((p) => p.estado === estado).length,
      }))
      .filter((e) => e.cantidad > 0);

    const porConsultor: Record<string, { leads: number; propuestas: number; ganadas: number }> = {};
    leadsRaw.forEach((l) => {
      const c = l.consultor?.nombre || "Sin asignar";
      if (!porConsultor[c]) porConsultor[c] = { leads: 0, propuestas: 0, ganadas: 0 };
      porConsultor[c].leads++;
    });
    propuestasRaw.forEach((p) => {
      const c = p.consultor?.nombre || "Sin asignar";
      if (!porConsultor[c]) porConsultor[c] = { leads: 0, propuestas: 0, ganadas: 0 };
      porConsultor[c].propuestas++;
      if (p.estado === "Aceptada") porConsultor[c].ganadas++;
    });
    const rendimientoConsultores = Object.entries(porConsultor).map(([nombre, data]) => ({
      nombre,
      ...data,
    }));

    const totalInteracciones = interacciones.length;
    const interaccionesPositivas = interacciones.filter((i) =>
      ["Positivo", "Excelente"].includes(i.resultado || "")
    ).length;
    const tasaExitoInteracciones =
      totalInteracciones > 0 ? (interaccionesPositivas / totalInteracciones) * 100 : 0;

    const tiposInteraccion = ["Llamada", "Email", "Reunión", "WhatsApp", "Visita", "Demo"]
      .map((tipo) => ({
        tipo,
        cantidad: interacciones.filter((i) => i.tipo === tipo).length,
      }))
      .filter((t) => t.cantidad > 0);

    const interaccionesPorSemana: Record<string, number> = {};
    interaccionesRaw.forEach((i) => {
      const fecha = i.createdAt;
      const inicio = new Date(fecha);
      inicio.setDate(fecha.getDate() - fecha.getDay());
      const clave = inicio.toISOString().split("T")[0];
      interaccionesPorSemana[clave] = (interaccionesPorSemana[clave] || 0) + 1;
    });
    const actividadSemanal = Object.entries(interaccionesPorSemana)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([semana, cantidad]) => ({
        semana: new Date(semana).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
        cantidad,
      }));

    const resultadoPorSemanaData: Record<string, { positivo: number; neutral: number; negativo: number }> = {};
    interaccionesRaw.forEach((i) => {
      const fecha = i.createdAt;
      const inicio = new Date(fecha);
      inicio.setDate(fecha.getDate() - fecha.getDay());
      const clave = inicio.toISOString().split("T")[0];
      if (!resultadoPorSemanaData[clave]) {
        resultadoPorSemanaData[clave] = { positivo: 0, neutral: 0, negativo: 0 };
      }
      const res = (i.resultado || "").toLowerCase();
      if (["positivo", "excelente"].includes(res)) {
        resultadoPorSemanaData[clave].positivo++;
      } else if (res === "neutral") {
        resultadoPorSemanaData[clave].neutral++;
      } else {
        resultadoPorSemanaData[clave].negativo++;
      }
    });
    const resultadoPorSemana = Object.entries(resultadoPorSemanaData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([semana, data]) => ({
        semana: new Date(semana).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
        ...data,
      }));

    const propuestasRecientes = [...propuestasRaw]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((p) => ({
        empresa: p.empresaCliente || "-",
        valor: num(p.valorUSD),
        estado: p.estado || "Borrador",
        consultor: p.consultor?.nombre || "-",
        fecha: p.createdAt.toISOString(),
      }));

    // NPS legado embebido en notas ("NPS:8|FECHA:...") — mecanismo distinto
    // al de columnas dedicadas (Proyecto.npsScore) usado por /api/nps/[token].
    // Se preserva tal cual para no perder histórico; revisar cuál es el
    // vigente en una sesión futura.
    const npsScores: number[] = [];
    proyectosRaw.forEach((p) => {
      const notas = p.notas || "";
      const match = notas.match(/NPS:(\d+)\|FECHA:/);
      if (match) {
        const score = parseInt(match[1], 10);
        if (!isNaN(score) && score >= 0 && score <= 10) npsScores.push(score);
      }
      if (p.npsScore !== null && p.npsScore >= 0 && p.npsScore <= 10) {
        npsScores.push(p.npsScore);
      }
    });
    const npsConDatos = npsScores.length;
    const npsPromedio = npsConDatos > 0 ? npsScores.reduce((a, b) => a + b, 0) / npsConDatos : 0;
    const promotoresPct =
      npsConDatos > 0 ? (npsScores.filter((s) => s >= 9).length / npsConDatos) * 100 : 0;
    const pasivosPct =
      npsConDatos > 0 ? (npsScores.filter((s) => s >= 7 && s <= 8).length / npsConDatos) * 100 : 0;
    const detractoresPct =
      npsConDatos > 0 ? (npsScores.filter((s) => s <= 6).length / npsConDatos) * 100 : 0;
    const npsScore = promotoresPct - detractoresPct;

    const leadsPorPais: Record<string, number> = {};
    leads.forEach((l) => {
      if (l.pais) leadsPorPais[l.pais] = (leadsPorPais[l.pais] || 0) + 1;
    });
    const distribucionPaises = Object.entries(leadsPorPais)
      .sort(([, a], [, b]) => b - a)
      .map(([pais, cantidad]) => ({ pais, cantidad }));

    const leadsPorSector: Record<string, number> = {};
    leads.forEach((l) => {
      if (l.sector) leadsPorSector[l.sector] = (leadsPorSector[l.sector] || 0) + 1;
    });
    const distribucionSectores = Object.entries(leadsPorSector)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([sector, cantidad]) => ({ sector, cantidad }));

    const clasificacionDist = [
      "Oportunidad Inmediata",
      "Oportunidad Alta",
      "Oportunidad Media",
      "Oportunidad Baja",
      "Sin Oportunidad",
    ]
      .map((clas) => ({
        clasificacion: clas.replace("Oportunidad ", ""),
        cantidad: leads.filter((l) => (l.clasificacion || "").includes(clas)).length,
      }))
      .filter((c) => c.cantidad > 0);

    const mrrEstimado = propuestasRaw
      .filter((p) => {
        if (p.estado !== "Aceptada") return false;
        const diffDias = (ahora.getTime() - p.createdAt.getTime()) / 86400000;
        return diffDias <= 30;
      })
      .reduce((s, p) => s + num(p.valorUSD), 0);

    const leadsReferidos = leadsRaw.filter((l) => l.comoNosConocio === "referido").length;
    const referidosConvertidos = leadsRaw.filter(
      (l) => l.comoNosConocio === "referido" && l.estadoLead === "GANADO"
    ).length;
    const tasaReferidos =
      leadsReferidos > 0 ? Math.round((referidosConvertidos / leadsReferidos) * 100) : 0;

    return NextResponse.json({
      periodo,
      generadoEn: ahora.toISOString(),
      bloque1: {
        totalLeads,
        leadsNuevos,
        leadsContactados,
        leadsCalificados,
        propuestasEnviadas: propuestasEnv,
        propuestasGanadas,
        tasaConversionLP: parseFloat((tasaConvLP * 100).toFixed(1)),
        tasaConversionPG: parseFloat((tasaConvPG * 100).toFixed(1)),
        leadsUrgentes,
        crecimientoMoM: parseFloat(crecimientoMoM.toFixed(1)),
        embudoData,
        tendenciaLeads,
        leadsPortal,
        leadsEvaluacion,
        leadsManual,
      },
      bloque2: {
        igmPromedio: parseFloat(igmPromedio.toFixed(2)),
        leadsEvaluados: leadsConIGM.length,
        dimMasDebil,
        dimMasFuerte,
        promediosDim,
        distribucionMadurez,
        brechaPromedio: parseFloat(brechaPromedio.toFixed(2)),
        topRetos,
        topServicios,
      },
      bloque3: {
        valorPipelineTotal,
        ticketPromedio: parseFloat(ticketPromedio.toFixed(0)),
        propuestasPorEstado,
        rendimientoConsultores,
        totalPropuestas: propuestasRaw.length,
        mrrEstimado,
        propuestasRecientes,
        npsPromedio: parseFloat(npsPromedio.toFixed(1)),
        npsScore: parseFloat(npsScore.toFixed(0)),
        npsPromotoresPct: parseFloat(promotoresPct.toFixed(1)),
        npsPasivosPct: parseFloat(pasivosPct.toFixed(1)),
        npsDetractoresPct: parseFloat(detractoresPct.toFixed(1)),
        npsProyectosConDatos: npsConDatos,
      },
      bloque4: {
        totalInteracciones,
        interaccionesPositivas,
        tasaExitoInteracciones: parseFloat(tasaExitoInteracciones.toFixed(1)),
        tiposInteraccion,
        actividadSemanal,
        resultadoPorSemana,
      },
      bloque5: {
        distribucionPaises,
        distribucionSectores,
        clasificacionDist,
        mrrEstimado,
        crecimientoMoM: parseFloat(crecimientoMoM.toFixed(1)),
        leadsReferidos,
        referidosConvertidos,
        tasaReferidos,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error GET /api/reportes:", err?.message);
    return NextResponse.json(
      { error: "Error al generar reportes", detail: err?.message },
      { status: 500 }
    );
  }
}
