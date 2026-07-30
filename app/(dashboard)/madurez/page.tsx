"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart2,
  Search,
  FileText,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Target,
  ChevronRight,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { MadurezDrawer } from "@/components/madurez/MadurezDrawer";
import { ChartTooltip } from "@/components/reportes/ChartTooltip";
import {
  BENCHMARK_POR_PAIS,
  IGM_POR_PAIS,
  META_DEFINIDO_MAS,
  getNivelMadurez,
  normalizarPais,
} from "@/lib/benchmarks-madurez";
import { getPaisLabel } from "@/lib/pipeline-utils";
import { cn } from "@/lib/utils";
import type { Evaluado } from "@/types/madurez";

const PAISES_COMPARAR = [
  { value: "latam", label: "LATAM" },
  { value: "colombia", label: "Colombia" },
  { value: "ecuador", label: "Ecuador" },
  { value: "peru", label: "Perú" },
  { value: "chile", label: "Chile" },
];

const COLORES_NIVELES = ["#ef4444", "#D4881E", "#eab308", "#8560C0", "#22c55e"];
const NIVEL_LABELS: Record<string, string> = {
  inicial: "Inicial",
  basico: "Básico",
  definido: "Definido",
  gestionado: "Gestionado",
  optimizado: "Optimizado",
};

function getNivelNombre(igm: number): string {
  if (igm < 2) return "inicial";
  if (igm < 3) return "basico";
  if (igm < 3.5) return "definido";
  if (igm < 4.5) return "gestionado";
  return "optimizado";
}

export default function MadurezPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    evaluados: Evaluado[];
    stats: {
      totalEvaluados: number;
      igmPromedio: number;
      promediosDim: { indice: number; nombre: string; promedio: number }[];
      dimMasDebilGlobal: { nombre: string; promedio: number };
      dimMasFuerteGlobal: { nombre: string; promedio: number };
      distribucionNiveles: Record<string, number>;
      brechaPercepcionPromedio: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paisBenchmark, setPaisBenchmark] = useState("latam");
  const [search, setSearch] = useState("");
  const [filtroNivel, setFiltroNivel] = useState<string>("todos");
  const [filtroPais, setFiltroPais] = useState<string>("todos");
  const [filtroDimDebil, setFiltroDimDebil] = useState<string>("todos");
  const [drawerEmpresa, setDrawerEmpresa] = useState<Evaluado | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchMadurez = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/madurez");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Error al cargar datos de madurez");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMadurez();
  }, []);

  const benchmark = BENCHMARK_POR_PAIS[paisBenchmark] || BENCHMARK_POR_PAIS.latam;
  const radarData = useMemo(() => {
    if (!data?.stats?.promediosDim) return [];
    return data.stats.promediosDim.map((d, i) => ({
      nombre: d.nombre,
      Promedio: d.promedio,
      Benchmark: benchmark[i] ?? 2.6,
      "Meta Definido+": META_DEFINIDO_MAS[i] ?? 3.0,
    }));
  }, [data, benchmark]);

  const pieData = useMemo(() => {
    if (!data?.stats?.distribucionNiveles) return [];
    return Object.entries(data.stats.distribucionNiveles)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: NIVEL_LABELS[k] || k, value: v }));
  }, [data]);

  const filtrados = useMemo(() => {
    if (!data?.evaluados) return [];
    let list = data.evaluados;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.nombreEmpresa.toLowerCase().includes(q) ||
          e.emailCorporativo.toLowerCase().includes(q) ||
          e.nombreContacto?.toLowerCase().includes(q)
      );
    }
    if (filtroNivel !== "todos") {
      list = list.filter((e) => getNivelNombre(e.igm) === filtroNivel);
    }
    if (filtroPais !== "todos") {
      list = list.filter(
        (e) => normalizarPais(e.pais) === filtroPais
      );
    }
    if (filtroDimDebil !== "todos") {
      list = list.filter((e) => e.dimMasDebil?.nombre === filtroDimDebil);
    }
    return list;
  }, [data?.evaluados, search, filtroNivel, filtroPais, filtroDimDebil]);

  const dimsUnicas = useMemo(() => {
    if (!data?.evaluados) return [];
    const set = new Set<string>();
    data.evaluados.forEach((e) => {
      if (e.dimMasDebil?.nombre) set.add(e.dimMasDebil.nombre);
    });
    return Array.from(set).sort();
  }, [data?.evaluados]);

  const paisesUnicos = useMemo(() => {
    if (!data?.evaluados) return [];
    const set = new Set<string>();
    data.evaluados.forEach((e) => {
      const p = normalizarPais(e.pais);
      if (p) set.add(p);
    });
    return Array.from(set).sort();
  }, [data?.evaluados]);

  const handleVerPerfil = (e: Evaluado) => {
    setDrawerEmpresa(e);
    setDrawerOpen(true);
  };

  const handleCrearPropuesta = (e: Evaluado) => {
    const params = new URLSearchParams();
    params.set("empresa", e.nombreEmpresa);
    params.set("email", e.emailCorporativo);
    params.set("igm", String(e.igm));
    params.set("dimDebil", e.dimMasDebil?.nombre ?? "");
    params.set("servicio", e.servicioSugerido || "");
    params.set("id", e.id || "");
    params.set("contacto", e.nombreContacto || "");
    params.set("sector", e.sector || "");
    params.set("pais", e.pais || "");
    params.set("tamano", e.tamano || "");
    router.push(`/propuestas/nueva?${params.toString()}`);
    setDrawerOpen(false);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="mt-1 h-5 w-72" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[320px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Madurez Empresarial</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error}</p>
          <Button variant="outline" className="mt-3" onClick={fetchMadurez}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const evaluados = data?.evaluados ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">
            Madurez Empresarial
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Índice de madurez empresarial de empresas evaluadas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Comparar vs</span>
          <Select value={paisBenchmark} onValueChange={(v) => setPaisBenchmark(v ?? "latam")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue>
                {(val: string | null) =>
                  `${getPaisLabel(val || "latam")} (IGM ${IGM_POR_PAIS[val || "latam"] ?? "—"})`
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAISES_COMPARAR.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {getPaisLabel(p.value)} (IGM {IGM_POR_PAIS[p.value] ?? "—"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMadurez}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-100">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-gray-500">Empresas evaluadas</p>
            <p className="mt-1 text-2xl font-bold text-[#1B3A5C]">
              {stats?.totalEvaluados ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-gray-100">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-gray-500">IGM Promedio</p>
            <p className="mt-1 text-2xl font-bold text-[#1B3A5C]">
              {stats?.igmPromedio?.toFixed(2) ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-gray-100">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-gray-500">Dimensión más débil</p>
            <p className="mt-1 text-lg font-bold text-[#1B3A5C]">
              {stats?.dimMasDebilGlobal?.nombre ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-gray-100">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-gray-500">Brecha percepción</p>
            <p className="mt-1 text-2xl font-bold text-[#1B3A5C]">
              {stats?.brechaPercepcionPromedio?.toFixed(2) ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Radar */}
        <Card className="border-gray-100">
          <CardHeader>
            <h3 className="font-semibold text-[#1B3A5C]">
              Perfil vs Benchmark {getPaisLabel(paisBenchmark)}
            </h3>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f3f4f6" />
                  <PolarAngleAxis
                    dataKey="nombre"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 5]}
                    tickCount={6}
                    tick={{ fontSize: 9 }}
                  />
                  <Radar
                    name="Promedio"
                    dataKey="Promedio"
                    fill="#1B3A5C"
                    fillOpacity={0.4}
                    stroke="#1B3A5C"
                    strokeWidth={2}
                  />
                  <Radar
                    name={`Benchmark ${getPaisLabel(paisBenchmark)}`}
                    dataKey="Benchmark"
                    fill="#D4881E"
                    fillOpacity={0.15}
                    stroke="#D4881E"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                  />
                  <Radar
                    name="Meta (Definido+)"
                    dataKey="Meta Definido+"
                    fill="#4CCED5"
                    fillOpacity={0.05}
                    stroke="#4CCED5"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-gray-400">
                Sin datos
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie */}
        <Card className="border-gray-100">
          <CardHeader>
            <h3 className="font-semibold text-[#1B3A5C]">
              Distribución por nivel
            </h3>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORES_NIVELES[i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-gray-400">
                Sin datos
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-gray-100">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-[#1B3A5C]">Empresas evaluadas</h3>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  className="w-[180px] pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filtroNivel} onValueChange={(v) => setFiltroNivel(v ?? "todos")}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Nivel">
                    {(val: string | null) =>
                      (val && val !== "todos" && NIVEL_LABELS[val]) || "Nivel"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Nivel</SelectItem>
                  {Object.entries(NIVEL_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroPais} onValueChange={(v) => setFiltroPais(v ?? "todos")}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="País">
                    {(val: string | null) =>
                      val && val !== "todos" ? getPaisLabel(val) : "País"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">País</SelectItem>
                  {paisesUnicos.map((p) => (
                    <SelectItem key={p} value={p}>
                      {getPaisLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroDimDebil} onValueChange={(v) => setFiltroDimDebil(v ?? "todos")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Pilar débil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Pilar débil</SelectItem>
                  {dimsUnicas.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d.length > 18 ? d.slice(0, 16) + "…" : d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart2 className="h-12 w-12 text-gray-300" />
              <p className="mt-3 font-medium text-gray-600">Sin empresas que coincidan</p>
              <p className="mt-1 text-sm text-gray-500">
                Ajusta los filtros o busca por nombre / email
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>Empresa</TableHead>
                    <TableHead>IGM</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Dim. más débil</TableHead>
                    <TableHead>Brecha percepción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((e) => (
                    <TableRow key={e.id} className="border-b">
                      <TableCell className="font-medium text-[#1B3A5C]">
                        {e.nombreEmpresa}
                      </TableCell>
                      <TableCell>{e.igm.toFixed(1)}</TableCell>
                      <TableCell>
                        {(() => {
                          const nivel = e.nivel ?? getNivelMadurez(e.igm);
                          return (
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: (nivel?.color ?? "#9ca3af") + "30",
                                color: nivel?.color ?? "#374151",
                              }}
                            >
                              {nivel?.nombre ?? "—"}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">
                        {e.dimMasDebil?.nombre ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-medium",
                          e.brechaPercepcion >= 0
                            ? "text-amber-600"
                            : "text-green-600"
                        )}
                      >
                        {e.brechaPercepcion >= 0 ? "+" : ""}
                        {e.brechaPercepcion.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <EstadoBadge estado={e.estadoLead} size="sm" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleVerPerfil(e)}
                          >
                            Ver perfil completo
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleCrearPropuesta(e)}
                          >
                            <FileText className="mr-1 h-3.5 w-3.5" />
                            Crear propuesta
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insight cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-amber-100 bg-amber-50/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-[#1B3A5C]">
                  Oportunidad por dimensión débil
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  {stats?.dimMasDebilGlobal?.nombre
                    ? `${stats.dimMasDebilGlobal.nombre} presenta la brecha más amplia vs benchmark. Prioriza servicios alineados a esta dimensión.`
                    : "Analiza las dimensiones débiles para orientar tu oferta."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-100 bg-purple-50/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-[#1B3A5C]">
                  Brecha de percepción
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  {stats && stats.brechaPercepcionPromedio > 0
                    ? "En promedio, las empresas subestiman su madurez. Usa el IGM como argumento para demostrar el valor de la evaluación."
                    : stats && stats.brechaPercepcionPromedio < 0
                      ? "En promedio, las empresas sobreestiman su madurez. El IGM ayuda a alinear expectativas."
                      : "La autoevaluación se alinea con el IGM. Revisa empresas individuales para oportunidades."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-blue-50/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-[#1B3A5C]">
                  Convertir evaluación en propuesta
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  Empresas en nivel Básico o Definido con brecha alta son candidatas
                  ideales. Usa &quot;Crear propuesta&quot; con los datos pre-cargados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drawer */}
      <MadurezDrawer
        empresa={drawerEmpresa}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerEmpresa(null);
        }}
        benchmarkPais={paisBenchmark}
      />
    </div>
  );
}
