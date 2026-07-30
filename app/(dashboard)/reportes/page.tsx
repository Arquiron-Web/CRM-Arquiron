"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartTooltip } from "@/components/reportes/ChartTooltip";
import { generarRecomendaciones, type Recomendacion } from "@/lib/recomendaciones";
import {
  METAS_FORJA,
  BENCHMARK_POR_PAIS,
  IGM_POR_PAIS,
  normalizarPais,
} from "@/lib/metas";
import { getPaisLabel } from "@/lib/pipeline-utils";
import { cn } from "@/lib/utils";

const PERIODOS = [
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
  { value: "trimestre", label: "Trimestre" },
  { value: "anio", label: "Año" },
  { value: "todo", label: "Todo" },
];

const PRIORIDAD_STYLES: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  critica: { bg: "bg-red-50", border: "border-red-500", text: "text-red-600" },
  alta: {
    bg: "bg-orange-50",
    border: "border-orange-400",
    text: "text-orange-600",
  },
  media: {
    bg: "bg-yellow-50",
    border: "border-yellow-400",
    text: "text-yellow-600",
  },
  info: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-600" },
};

const COLORES_FUENTE = ["#1B3A5C", "#8560C0", "#4CCED5"];
const COLORES_MADUREZ = ["#ef4444", "#D4881E", "#8560C0", "#1B3A5C", "#4CCED5"];
const COLORES_INTERACCION: Record<string, string> = {
  Llamada: "#3b82f6",
  Email: "#8b5cf6",
  Reunión: "#22c55e",
  WhatsApp: "#25D366",
  Visita: "#f97316",
  Demo: "#8560C0",
};

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState("mes");
  const [datos, setDatos] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, { data: unknown; ts: number }>>({});
  const [tab, setTab] = useState("embudo");

  const fetchReportes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reportes?periodo=${periodo}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Error al cargar reportes");
      }
      const data = await res.json();
      setDatos(data);
      setCache((prev) => ({
        ...prev,
        [periodo]: { data, ts: Date.now() },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    const cached = cache[periodo];
    if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
      setDatos(cached.data as Record<string, unknown>);
      setLoading(false);
      return;
    }
    fetchReportes();
  }, [periodo, fetchReportes, cache]);

  const recomendaciones = datos ? generarRecomendaciones(datos) : [];
  const recsPrioritarias = recomendaciones.filter((r) =>
    ["critica", "alta"].includes(r.prioridad)
  );

  const ultimaActualizacion = datos?.generadoEn
    ? Math.floor(
        (Date.now() - new Date(datos.generadoEn as string).getTime()) / 60000
      )
    : null;

  if (loading && !datos) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-1 h-5 w-64" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 flex-1 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[280px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && !datos) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Reportes</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error}</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={fetchReportes}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const b1 = datos?.bloque1 as Record<string, unknown> | undefined;
  const b2 = datos?.bloque2 as Record<string, unknown> | undefined;
  const b3 = datos?.bloque3 as Record<string, unknown> | undefined;
  const b4 = datos?.bloque4 as Record<string, unknown> | undefined;
  const b5 = datos?.bloque5 as Record<string, unknown> | undefined;

  const hayDatos =
    (b1?.totalLeads as number) > 0 ||
    (b4?.totalInteracciones as number) > 0 ||
    (b3?.totalPropuestas as number) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Reportes</h1>
          <p className="text-sm text-gray-500">
            Inteligencia estratégica de tu negocio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-gray-200 bg-white p-1">
            {PERIODOS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  periodo === p.value
                    ? "bg-[#1B3A5C] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {ultimaActualizacion !== null && (
            <span className="text-xs text-gray-400">
              Actualizado hace {ultimaActualizacion} min
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReportes}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {recsPrioritarias.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-24 z-10 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <h3 className="mb-3 font-semibold text-[#1B3A5C]">
            Acciones prioritarias detectadas ({recsPrioritarias.length})
          </h3>
          <div className="space-y-2">
            <AnimatePresence mode="sync">
              {recsPrioritarias.map((rec, idx) => (
                <RecExpandible key={`rec-${rec.id || idx}`} rec={rec} index={idx} />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {!hayDatos ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-20">
          <BarChart2 className="h-16 w-16 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-600">
            Sin datos suficientes para el período seleccionado
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Cambia el filtro de período o registra más actividad
          </p>
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
            <TabsTrigger value="embudo" className="rounded-lg">
              Embudo Comercial
            </TabsTrigger>
            <TabsTrigger value="madurez" className="rounded-lg">
              Madurez del Mercado
            </TabsTrigger>
            <TabsTrigger value="rendimiento" className="rounded-lg">
              Rendimiento Comercial
            </TabsTrigger>
            <TabsTrigger value="actividad" className="rounded-lg">
              Actividad
            </TabsTrigger>
            <TabsTrigger value="crecimiento" className="rounded-lg">
              Crecimiento
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-0 space-y-6"
            >
              {tab === "embudo" && <TabEmbudo b1={b1} />}
              {tab === "madurez" && <TabMadurez b2={b2} datos={datos} />}
              {tab === "rendimiento" && <TabRendimiento b3={b3} />}
              {tab === "actividad" && <TabActividad b4={b4} />}
              {tab === "crecimiento" && <TabCrecimiento b5={b5} b1={b1} datos={datos} />}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      )}
    </div>
  );
}

function RecExpandible({ rec, index }: { rec: Recomendacion; index: number }) {
  const [open, setOpen] = useState(false);
  const style = PRIORIDAD_STYLES[rec.prioridad] || PRIORIDAD_STYLES.info;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn("rounded-xl border-l-4 p-3", style.bg, style.border)}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className={cn("font-medium", style.text)}>{rec.titulo}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
            style.bg,
            style.text
          )}
        >
          {rec.prioridad}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 space-y-2 border-t pt-3 text-sm"
        >
          <p><strong>Problema:</strong> {rec.problema}</p>
          <p><strong>Acción:</strong> {rec.accion}</p>
          <p><strong>Impacto:</strong> {rec.impacto}</p>
          <Link
            href={
              rec.bloque === "Embudo Comercial"
                ? "/pipeline"
                : rec.bloque === "Rendimiento Comercial"
                  ? "/propuestas"
                  : rec.bloque === "Actividad y Seguimiento"
                    ? "/interacciones"
                    : "/leads"
            }
          >
            <Button variant="outline" size="sm" className="mt-2">
              Ver en el módulo
            </Button>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}

function TabEmbudo({
  b1,
}: {
  b1?: Record<string, unknown>;
}) {
  if (!b1) return null;
  const totalLeads = (b1.totalLeads as number) ?? 0;
  const tasaLP = (b1.tasaConversionLP as number) ?? 0;
  const tasaPG = (b1.tasaConversionPG as number) ?? 0;
  const leadsUrgentes = (b1.leadsUrgentes as number) ?? 0;
  const crecimientoMoM = (b1.crecimientoMoM as number) ?? 0;
  const embudoData = (b1.embudoData as { etapa: string; cantidad: number; color: string }[]) ?? [];
  const tendenciaLeads = (b1.tendenciaLeads as { mes: string; cantidad: number }[]) ?? [];
  const fuenteData = [
    { name: "Portal", value: (b1.leadsPortal as number) ?? 0, color: "#1B3A5C" },
    { name: "Evaluación", value: (b1.leadsEvaluacion as number) ?? 0, color: "#8560C0" },
    { name: "Manual", value: (b1.leadsManual as number) ?? 0, color: "#4CCED5" },
  ].filter((d) => d.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "Total Leads",
            value: totalLeads,
            meta: METAS_FORJA.leadsObjetivoFase2,
            progress: totalLeads / METAS_FORJA.leadsObjetivoFase2,
            color: "#1B3A5C",
          },
          {
            label: "Tasa Lead→Propuesta",
            value: `${tasaLP}%`,
            meta: "40%",
            good: tasaLP >= 40,
            warn: tasaLP >= 25,
          },
          {
            label: "Tasa Propuesta→Ganado",
            value: `${tasaPG}%`,
            meta: "40%",
            good: tasaPG >= 40,
            warn: tasaPG >= 25,
          },
          {
            label: "Leads Urgentes",
            value: leadsUrgentes,
            urgent: leadsUrgentes > 0,
            good: leadsUrgentes === 0,
          },
          {
            label: "Crecimiento MoM",
            value: `${crecimientoMoM}%`,
            meta: "15%",
            positive: crecimientoMoM >= 0,
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1B3A5C]">
              {kpi.value}
            </p>
            {"progress" in kpi && (
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (kpi.progress ?? 0) * 100)}%`,
                    backgroundColor: kpi.color,
                  }}
                />
              </div>
            )}
            {"good" in kpi && kpi.good && (
              <span className="mt-2 inline-block text-xs text-green-600">
                ✓ Al día
              </span>
            )}
            {"urgent" in kpi && kpi.urgent && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                <AlertTriangle className="h-3 w-3" />
                Atención inmediata
              </span>
            )}
            {"positive" in kpi && (
              <span
                className={cn(
                  "mt-2 flex items-center gap-1 text-xs",
                  kpi.positive ? "text-green-600" : "text-red-600"
                )}
              >
                {kpi.positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3 rotate-180" />
                )}
                {kpi.meta}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <h4 className="mb-4 font-semibold text-[#1B3A5C]">
            Embudo de Conversión
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={embudoData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="etapa"
                width={90}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="cantidad" fill="#1B3A5C" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <h4 className="mb-4 font-semibold text-[#1B3A5C]">
            Evolución Mensual de Leads
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={tendenciaLeads}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CCED5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4CCED5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={50} stroke="#D4881E" strokeDasharray="5 5" />
              <Area
                type="monotone"
                dataKey="cantidad"
                stroke="#4CCED5"
                fillOpacity={1}
                fill="url(#colorLeads)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {fuenteData.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <h4 className="mb-4 font-semibold text-[#1B3A5C]">
            Leads por Fuente
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={fuenteData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {fuenteData.map((_, i) => (
                  <Cell key={i} fill={COLORES_FUENTE[i % 3]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

function getPilar(idx: number): string {
  const pilares = [
    "ADN Estratégico",
    "ADN Estratégico",
    "ADN Estratégico",
    "Núcleo Operativo",
    "Núcleo Operativo",
    "Motor Humano",
    "Inteligencia Digital",
    "Inteligencia Digital",
    "Inteligencia Digital",
    "Enfoque al Cliente",
  ];
  return pilares[idx] ?? "";
}

const META_DEFINIDO_MAS = [3.5, 3.0, 2.8, 3.8, 3.0, 3.2, 2.7, 2.8, 2.5, 3.3];

function TabMadurez({
  b2,
  datos,
}: {
  b2?: Record<string, unknown>;
  datos?: Record<string, unknown> | null;
}) {
  const [paisBenchmark, setPaisBenchmark] = useState("colombia");

  useEffect(() => {
    const dist = (datos?.bloque5 as Record<string, unknown>)?.distribucionPaises as { pais: string }[] | undefined;
    if (!dist?.length) return;
    const paisPrincipal = dist[0]?.pais ?? "";
    const paisNorm = normalizarPais(paisPrincipal);
    if (BENCHMARK_POR_PAIS[paisNorm]) {
      setPaisBenchmark(paisNorm);
    }
  }, [datos]);

  if (!b2) return null;
  const promediosDim = (b2.promediosDim as {
    nombre: string;
    promedio: number;
  }[]) ?? [];
  const distribucionMadurez = (b2.distribucionMadurez as Record<string, number>) ?? {};
  const topRetos = (b2.topRetos as { reto: string; count: number }[]) ?? [];
  const topServicios = (b2.topServicios as { servicio: string; count: number }[]) ?? [];
  const dimMasDebil = b2.dimMasDebil as {
    nombre: string;
    promedio: number;
  } | undefined;

  const benchmarkActual =
    BENCHMARK_POR_PAIS[paisBenchmark] ?? BENCHMARK_POR_PAIS.default;
  const radarData = promediosDim.map((dim, i) => ({
    nombre: dim.nombre,
    "Tus Leads": dim.promedio,
    Benchmark: benchmarkActual[i] ?? 2.6,
    "Meta (Definido+)": META_DEFINIDO_MAS[i] ?? 3.0,
  }));

  const paisLabel =
    paisBenchmark === "latam"
      ? "LATAM"
      : paisBenchmark.charAt(0).toUpperCase() + paisBenchmark.slice(1);
  const dimMasDebilBench =
    dimMasDebil &&
    promediosDim.findIndex((d) => d.nombre === dimMasDebil.nombre) >= 0
      ? benchmarkActual[
          promediosDim.findIndex((d) => d.nombre === dimMasDebil.nombre)
        ] ?? 2.6
      : 2.6;

  const distData = Object.entries(distribucionMadurez)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "IGM Promedio",
            value: (b2.igmPromedio as number)?.toFixed(2) ?? "0",
          },
          {
            label: "Leads Evaluados",
            value: b2.leadsEvaluados ?? 0,
          },
          {
            label: "Dimensión más débil",
            value: dimMasDebil
              ? `${dimMasDebil.nombre} (${dimMasDebil.promedio} vs ${dimMasDebilBench})`
              : "-",
          },
          {
            label: "Brecha percepción",
            value: (b2.brechaPromedio as number)?.toFixed(2) ?? "0",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
            <p className="mt-1 text-xl font-bold text-[#1B3A5C]">
              {String(kpi.value)}
            </p>
          </motion.div>
        ))}
      </div>

      {radarData.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <h4 className="mb-2 font-semibold text-[#1B3A5C]">
            Perfil de Madurez de tus Leads vs Benchmark
          </h4>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-500">
              Comparar contra:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: "colombia", label: "Colombia", flag: "🇨🇴" },
                { value: "ecuador", label: "Ecuador", flag: "🇪🇨" },
                { value: "peru", label: "Perú", flag: "🇵🇪" },
                { value: "chile", label: "Chile", flag: "🇨🇱" },
                { value: "latam", label: "LATAM", flag: "🌎" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPaisBenchmark(p.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                    paisBenchmark === p.value
                      ? "bg-[#1B3A5C] text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                  )}
                >
                  <span>{p.flag}</span>
                  <span>{p.label}</span>
                  <span className="opacity-60 font-normal">
                    {IGM_POR_PAIS[p.value]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Fuente: Mega Benchmarking PYMEs LATAM 2026 — Arquiron (OCDE/CAF/SELA
            2024, EY Madurez Digital, Think Digital Report 2024)
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f3f4f6" />
              <PolarAngleAxis
                dataKey="nombre"
                tick={{ fontSize: 11, fill: "#6b7280", fontFamily: "DM Sans" }}
              />
              <PolarRadiusAxis
                domain={[0, 5]}
                tickCount={6}
                tick={{ fontSize: 9, fill: "#9ca3af" }}
              />
              <Radar
                name="Tus Leads"
                dataKey="Tus Leads"
                fill="#1B3A5C"
                fillOpacity={0.4}
                stroke="#1B3A5C"
                strokeWidth={2}
              />
              <Radar
                name={`Benchmark ${paisLabel} (${IGM_POR_PAIS[paisBenchmark] ?? IGM_POR_PAIS.default})`}
                dataKey="Benchmark"
                fill="#D4881E"
                fillOpacity={0.15}
                stroke="#D4881E"
                strokeWidth={1.5}
                strokeDasharray="5 5"
              />
              <Radar
                name="Meta Arquiron"
                dataKey="Meta (Definido+)"
                fill="#4CCED5"
                fillOpacity={0.05}
                stroke="#4CCED5"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
              />
              <Tooltip content={<ChartTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Pilar</th>
                  <th className="pb-2 font-medium">Dimensión</th>
                  <th className="pb-2 font-medium">Tu score</th>
                  <th className="pb-2 font-medium">Benchmark {paisLabel}</th>
                  <th className="pb-2 font-medium">Brecha</th>
                </tr>
              </thead>
              <tbody>
                {radarData.map((dim, idx) => {
                  const brechaNum = dim["Tus Leads"] - dim.Benchmark;
                  const brecha = brechaNum.toFixed(1);
                  return (
                    <tr
                      key={`tabla-dim-${idx}`}
                      className="border-b last:border-0"
                    >
                      <td className="py-2 text-xs text-gray-500">
                        {getPilar(idx)}
                      </td>
                      <td className="py-2 font-medium text-[#1B3A5C]">
                        {dim.nombre}
                      </td>
                      <td
                        className={cn(
                          "py-2 text-sm font-bold",
                          brechaNum >= 0
                            ? "text-green-500"
                            : brechaNum >= -0.5
                              ? "text-yellow-500"
                              : "text-red-500"
                        )}
                      >
                        {dim["Tus Leads"].toFixed(1)}
                      </td>
                      <td className="py-2 text-sm text-gray-600">
                        {dim.Benchmark.toFixed(1)}
                      </td>
                      <td
                        className={cn(
                          "py-2 text-sm font-semibold",
                          brechaNum >= 0 ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {brechaNum >= 0 ? "+" : ""}
                        {brecha}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {distData.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h4 className="mb-4 font-semibold text-[#1B3A5C]">
              Distribución por Nivel de Madurez
            </h4>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={distData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {distData.map((_, i) => (
                    <Cell key={i} fill={COLORES_MADUREZ[i % 5]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {topRetos.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h4 className="mb-4 font-semibold text-[#1B3A5C]">
              Top Retos Principales
            </h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topRetos} layout="vertical" margin={{ left: 60 }}>
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="reto"
                  width={55}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#8560C0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {topServicios.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <h4 className="mb-4 font-semibold text-[#1B3A5C]">
            Servicios con Mayor Demanda Potencial
          </h4>
          <div className="space-y-3">
            {topServicios.map((s, i) => {
              const max = Math.max(...topServicios.map((x) => x.count), 1);
              const pct = (s.count / max) * 100;
              return (
                <div key={`servicio-${s.servicio ?? i}`} className="flex items-center gap-3">
                  <span className="w-32 truncate text-sm">{s.servicio}</span>
                  <div className="flex-1">
                    <div className="h-6 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#1B3A5C]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function TabRendimiento({ b3 }: { b3?: Record<string, unknown> }) {
  if (!b3) return null;
  const propuestasPorEstado = (b3.propuestasPorEstado as { estado: string; cantidad: number }[]) ?? [];
  const rendimientoConsultores = (b3.rendimientoConsultores as { nombre: string; leads: number; propuestas: number; ganadas: number }[]) ?? [];
  const propuestasRecientes = (b3.propuestasRecientes as { empresa: string; valor: number; estado: string; consultor: string; fecha: string }[]) ?? [];
  const npsProyectosConDatos = (b3.npsProyectosConDatos as number) ?? 0;
  const npsPromedio = (b3.npsPromedio as number) ?? 0;
  const npsScore = (b3.npsScore as number) ?? 0;
  const npsPromotoresPct = (b3.npsPromotoresPct as number) ?? 0;
  const npsPasivosPct = (b3.npsPasivosPct as number) ?? 0;
  const npsDetractoresPct = (b3.npsDetractoresPct as number) ?? 0;

  const ESTADO_COLORS: Record<string, string> = {
    Borrador: "#9ca3af",
    Lista: "#3b82f6",
    Enviada: "#D4881E",
    Vista: "#8560C0",
    Aceptada: "#22c55e",
    Rechazada: "#ef4444",
    Vencida: "#f97316",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Pipeline Total",
            value: `$${(b3.valorPipelineTotal as number)?.toLocaleString() ?? 0}`,
          },
          {
            label: "Ticket Promedio",
            value: `$${(b3.ticketPromedio as number)?.toLocaleString() ?? 0}`,
          },
          {
            label: "MRR Estimado",
            value: `$${(b3.mrrEstimado as number)?.toLocaleString() ?? 0}`,
          },
          {
            label: "Total Propuestas",
            value: (b3.totalPropuestas as number) ?? 0,
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1B3A5C]">
              {kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      {npsProyectosConDatos >= 3 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-100 bg-white p-4"
        >
          <h4 className="mb-4 font-semibold text-[#1B3A5C]">NPS Promedio</h4>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[#1B3A5C]">{npsScore}</span>
              <span className="text-sm text-gray-500">NPS</span>
            </div>
            <div className="h-12 w-32 overflow-hidden rounded-full bg-gray-100">
              <div
                className="flex h-full"
                style={{
                  width: "100%",
                }}
              >
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${npsDetractoresPct}%` }}
                />
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${npsPasivosPct}%` }}
                />
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${npsPromotoresPct}%` }}
                />
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <span>
                <strong className="text-green-600">Promotores</strong> {npsPromotoresPct.toFixed(0)}%
              </span>
              <span>
                <strong className="text-yellow-600">Pasivos</strong> {npsPasivosPct.toFixed(0)}%
              </span>
              <span>
                <strong className="text-red-600">Detractores</strong> {npsDetractoresPct.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Puntuación promedio: {npsPromedio.toFixed(1)}/10 · Meta del plan: NPS &gt; 60
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center"
        >
          <p className="text-sm text-gray-500">
            Registra NPS en más proyectos para ver esta métrica
          </p>
          <p className="mt-1 text-xs text-gray-400">
            (Se necesitan al menos 3 proyectos con NPS registrado)
          </p>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {propuestasPorEstado.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h4 className="mb-4 font-semibold text-[#1B3A5C]">
              Estado del Pipeline de Propuestas
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={propuestasPorEstado}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="estado" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {propuestasPorEstado.map((entry, i) => (
                    <Cell
                      key={`estado-${entry.estado ?? i}`}
                      fill={ESTADO_COLORS[entry.estado] ?? "#9ca3af"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {rendimientoConsultores.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h4 className="mb-4 font-semibold text-[#1B3A5C]">
              Rendimiento por Consultor
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={rendimientoConsultores}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="leads" fill="#1B3A5C" name="Leads" radius={[4, 4, 0, 0]} />
                <Bar dataKey="propuestas" fill="#8560C0" name="Propuestas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ganadas" fill="#22c55e" name="Ganadas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {propuestasRecientes.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-semibold text-[#1B3A5C]">
              Propuestas Recientes
            </h4>
            <Link href="/propuestas">
              <Button variant="outline" size="sm">
                Ver todas
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Empresa</th>
                  <th className="pb-2 font-medium">Valor</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Consultor</th>
                  <th className="pb-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {propuestasRecientes.map((p, i) => (
                  <tr key={`prop-${p.empresa ?? i}`} className="border-b last:border-0">
                    <td className="py-2">{p.empresa}</td>
                    <td className="py-2">
                      ${p.valor.toLocaleString()}
                    </td>
                    <td className="py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs"
                        style={{
                          backgroundColor: `${ESTADO_COLORS[p.estado] ?? "#9ca3af"}20`,
                          color: ESTADO_COLORS[p.estado] ?? "#6b7280",
                        }}
                      >
                        {p.estado}
                      </span>
                    </td>
                    <td className="py-2">{p.consultor}</td>
                    <td className="py-2 text-gray-500">
                      {p.fecha
                        ? new Date(p.fecha).toLocaleDateString("es-CO")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function TabActividad({ b4 }: { b4?: Record<string, unknown> }) {
  if (!b4) return null;
  const actividadSemanal = (b4.actividadSemanal as { semana: string; cantidad: number }[]) ?? [];
  const tiposInteraccion = (b4.tiposInteraccion as { tipo: string; cantidad: number }[]) ?? [];
  const resultadoPorSemana = (b4.resultadoPorSemana as { semana: string; positivo: number; neutral: number; negativo: number }[]) ?? [];
  const tipoMasFrecuente = tiposInteraccion.sort((a, b) => b.cantidad - a.cantidad)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Interacciones",
            value: (b4.totalInteracciones as number) ?? 0,
          },
          {
            label: "Tasa de Éxito",
            value: `${(b4.tasaExitoInteracciones as number) ?? 0}%`,
          },
          {
            label: "Tipo más frecuente",
            value: tipoMasFrecuente?.tipo ?? "-",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1B3A5C]">
              {kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {actividadSemanal.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h4 className="mb-4 font-semibold text-[#1B3A5C]">
              Ritmo de Actividad Comercial
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={actividadSemanal}>
                <defs>
                  <linearGradient id="colorActividad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CCED5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4CCED5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#4CCED5"
                  fillOpacity={1}
                  fill="url(#colorActividad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {tiposInteraccion.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h4 className="mb-4 font-semibold text-[#1B3A5C]">
              Mix de Canales de Comunicación
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={tiposInteraccion}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="cantidad"
                  nameKey="tipo"
                  label={(entry: { name?: string; tipo?: string; percent?: number }) =>
                    `${entry.name ?? entry.tipo ?? ""} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {tiposInteraccion.map((entry, i) => (
                    <Cell
                      key={`tipo-${entry.tipo ?? i}`}
                      fill={COLORES_INTERACCION[entry.tipo] ?? "#9ca3af"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {resultadoPorSemana.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <h4 className="mb-4 font-semibold text-[#1B3A5C]">
            Calidad de Interacciones en el Tiempo
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={resultadoPorSemana} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="positivo" stackId="a" fill="#22c55e" name="Positivo" />
              <Bar dataKey="neutral" stackId="a" fill="#eab308" name="Neutral" />
              <Bar dataKey="negativo" stackId="a" fill="#ef4444" name="Negativo" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

function TabCrecimiento({
  b5,
  b1,
  datos,
}: {
  b5?: Record<string, unknown>;
  b1?: Record<string, unknown>;
  datos?: Record<string, unknown> | null;
}) {
  const [showPlanModal, setShowPlanModal] = useState(false);
  if (!b5) return null;
  const distribucionPaises = (b5.distribucionPaises as { pais: string; cantidad: number }[]) ?? [];
  const distribucionSectores = (b5.distribucionSectores as { sector: string; cantidad: number }[]) ?? [];
  const clasificacionDist = (b5.clasificacionDist as { clasificacion: string; cantidad: number }[]) ?? [];
  const tendenciaLeads = (b1?.tendenciaLeads as { mes: string; cantidad: number }[]) ?? [];
  const ultimoMes = tendenciaLeads[tendenciaLeads.length - 1]?.cantidad ?? 0;
  const proyeccion = ultimoMes * 3;

  const PAISES_POTENCIAL: Record<string, string> = {
    colombia: "2.5M PYMEs",
    ecuador: "860K PYMEs",
    peru: "2.1M PYMEs",
    chile: "1.1M PYMEs",
    mexico: "4.2M PYMEs",
  };

  const leadsReferidos = (b5.leadsReferidos as number) ?? 0;
  const referidosConvertidos = (b5.referidosConvertidos as number) ?? 0;
  const tasaReferidos = (b5.tasaReferidos as number) ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⭐</span>
          <h3 className="text-sm font-bold text-[#1B3A5C]">
            Canal de Referidos
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-black text-[#1B3A5C]">
              {leadsReferidos}
            </p>
            <p className="text-xs text-gray-400">Total referidos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-green-500">
              {referidosConvertidos}
            </p>
            <p className="text-xs text-gray-400">Convertidos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-[#D4881E]">
              {tasaReferidos}%
            </p>
            <p className="text-xs text-gray-400">Tasa conversión</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progreso hacia meta Fase 3</span>
            <span>{leadsReferidos} / 5 referidos</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all"
              style={{
                width: `${Math.min((leadsReferidos / 5) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
        {leadsReferidos === 0 && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            Meta: 5 referidos en Fase 3 del Plan de Lanzamiento
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Crecimiento MoM",
            value: `${(b5.crecimientoMoM as number) ?? 0}%`,
          },
          {
            label: "MRR Estimado",
            value: `$${(b5.mrrEstimado as number)?.toLocaleString() ?? 0}`,
          },
          {
            label: "Países activos",
            value: distribucionPaises.length,
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1B3A5C]">
              {kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {distribucionPaises.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h4 className="mb-4 font-semibold text-[#1B3A5C]">
              Distribución Geográfica de Leads
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distribucionPaises}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="pais"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => getPaisLabel(v)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    const potencial =
                      PAISES_POTENCIAL[(d.pais as string).toLowerCase()] || "";
                    return (
                      <div className="rounded-xl border border-gray-100 bg-white p-3 text-sm shadow-lg">
                        <p className="font-semibold text-[#1B3A5C]">
                          {getPaisLabel(d.pais)}
                        </p>
                        <p className="text-xs">Leads: {d.cantidad}</p>
                        {potencial && (
                          <p className="text-xs text-gray-500">
                            Potencial: {potencial}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="cantidad" fill="#4CCED5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {distribucionSectores.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h4 className="mb-4 font-semibold text-[#1B3A5C]">
              Sectores con Mayor Tracción
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={distribucionSectores}
                layout="vertical"
                margin={{ left: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="sector"
                  width={35}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="cantidad" fill="#33487A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {clasificacionDist.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <h4 className="mb-4 font-semibold text-[#1B3A5C]">
            Distribución por Clasificación de Oportunidad
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={clasificacionDist}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="cantidad"
                nameKey="clasificacion"
                label={(entry: { clasificacion?: string; name?: string; percent?: number }) =>
                  `${String(entry.clasificacion ?? entry.name ?? "")} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {clasificacionDist.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      [
                        "#ef4444",
                        "#D4881E",
                        "#eab308",
                        "#22c55e",
                        "#9ca3af",
                      ][i % 5]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div
        className="rounded-2xl p-6 text-white"
        style={{
          background: "linear-gradient(135deg, #1D1A70, #8560C0)",
        }}
      >
        <h4 className="font-semibold">Proyección Simple</h4>
        <p className="mt-2 text-sm opacity-90">
          Si mantienes el ritmo actual de {ultimoMes} leads/mes, en 3 meses
          tendrás aproximadamente {proyeccion} leads totales acumulados en el
          período.
        </p>
        <Button
          type="button"
          onClick={() => setShowPlanModal(true)}
          className="mt-4 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-sm font-medium px-4 py-2 transition-colors"
        >
          Ver metas del Plan de Lanzamiento →
        </Button>
      </div>

      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="!max-w-[880px] w-[92vw] flex flex-col gap-0 overflow-hidden rounded-2xl p-0 max-h-[92vh]">
          <div
            className="h-1 w-full shrink-0 rounded-t-2xl"
            style={{
              background: "linear-gradient(90deg, #1D1A70, #8560C0, #D4881E)",
            }}
          />
          <DialogHeader className="shrink-0 border-b border-gray-100 px-8 pt-7 pb-5">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #1D1A70, #8560C0)",
                }}
              >
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-[#1B3A5C]">
                  Plan de Lanzamiento Arquiron
                </DialogTitle>
                <p className="text-sm text-gray-500">
                  Metas por fase — Horizonte 24 meses
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 px-8 py-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Tu posición actual vs metas
              </p>
              <div className="space-y-3">
                {[
                  {
                    kpi: "Total Leads captados",
                    actual: (datos?.bloque1 as Record<string, unknown>)?.totalLeads ?? 0,
                    fase2: 50,
                    fase3: 100,
                    fase4: 200,
                    unidad: "leads",
                  },
                  {
                    kpi: "Propuestas enviadas",
                    actual: (datos?.bloque1 as Record<string, unknown>)?.propuestasEnviadas ?? 0,
                    fase2: 8,
                    fase3: 20,
                    fase4: 40,
                    unidad: "propuestas",
                  },
                  {
                    kpi: "Tasa de conversión Lead→Propuesta",
                    actual: (datos?.bloque1 as Record<string, unknown>)?.tasaConversionLP ?? 0,
                    fase2: 40,
                    fase3: 45,
                    fase4: 50,
                    unidad: "%",
                  },
                  {
                    kpi: "MRR estimado (USD)",
                    actual: (datos?.bloque3 as Record<string, unknown>)?.mrrEstimado ?? 0,
                    fase2: 5000,
                    fase3: 8000,
                    fase4: 20000,
                    unidad: "USD",
                  },
                  {
                    kpi: "Crecimiento mensual de leads",
                    actual: (datos?.bloque1 as Record<string, unknown>)?.crecimientoMoM ?? 0,
                    fase2: 15,
                    fase3: 15,
                    fase4: 10,
                    unidad: "%",
                  },
                ].map((item, idx) => {
                  const porcentaje =
                    item.fase2 > 0
                      ? Math.min((Number(item.actual) / item.fase2) * 100, 100)
                      : 0;
                  const color =
                    porcentaje >= 100
                      ? "#22c55e"
                      : porcentaje >= 60
                        ? "#D4881E"
                        : "#ef4444";
                  const actualNum = Number(item.actual);
                  const suf =
                    item.unidad === "%"
                      ? "%"
                      : item.unidad === "USD"
                        ? " USD"
                        : "";
                  return (
                    <div key={`plan-${idx}`} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 font-medium">
                          {item.kpi}
                        </span>
                        <span className="font-bold" style={{ color }}>
                          {actualNum.toLocaleString()}
                          {suf}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${porcentaje}%`,
                            background: color,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>
                          Meta Fase 2: {item.fase2.toLocaleString()}
                          {item.unidad === "%" ? "%" : item.unidad === "USD" ? " USD" : ""}
                        </span>
                        <span>
                          Fase 3: {item.fase3.toLocaleString()} | Fase 4:{" "}
                          {item.fase4.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Hitos clave del plan
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    fase: "Fase 2",
                    meses: "Mes 3-5",
                    meta: "3 primeros clientes pagos",
                    color: "#1B3A5C",
                  },
                  {
                    fase: "Fase 3",
                    meses: "Mes 6-9",
                    meta: "6 clientes simultáneos",
                    color: "#33487A",
                  },
                  {
                    fase: "Fase 4",
                    meses: "Mes 10-15",
                    meta: "10-15 clientes + equipo",
                    color: "#8560C0",
                  },
                  {
                    fase: "Fase 5",
                    meses: "Mes 16-24",
                    meta: "Expansión Ecuador + Perú",
                    color: "#4CCED5",
                  },
                ].map((hito, idx) => (
                  <div
                    key={`hito-${idx}`}
                    className="rounded-xl p-3 border border-gray-100"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: hito.color }}
                      />
                      <span className="text-xs font-bold text-gray-400">
                        {hito.fase} — {hito.meses}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#1B3A5C]">
                      {hito.meta}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex justify-end rounded-b-2xl border-t border-gray-100 bg-white px-8 py-4">
            <Button
              onClick={() => setShowPlanModal(false)}
              className="rounded-xl bg-[#1B3A5C] px-7 py-2.5 text-sm font-semibold text-white hover:bg-[#33487A]"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
