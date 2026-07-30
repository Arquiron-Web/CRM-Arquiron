"use client";

import { useRouter } from "next/navigation";
import {
  FileText,
  TrendingUp,
  History,
  ExternalLink,
  Target,
  ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { getPaisLabel } from "@/lib/pipeline-utils";
import {
  BRECHA_A_SERVICIO,
  META_DEFINIDO_MAS,
  DIMENSIONES,
} from "@/lib/benchmarks-madurez";
import { cn } from "@/lib/utils";
import type { Evaluado } from "@/types/madurez";

interface MadurezDrawerProps {
  empresa: Evaluado | null;
  open: boolean;
  onClose: () => void;
  benchmarkPais?: string;
}

const PAISES_SELECT = [
  { value: "latam", label: "LATAM" },
  { value: "colombia", label: "Colombia" },
  { value: "ecuador", label: "Ecuador" },
  { value: "peru", label: "Perú" },
  { value: "chile", label: "Chile" },
];

function buildPropuestaUrl(e: Evaluado): string {
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
  return `/propuestas/nueva?${params.toString()}`;
}

export function MadurezDrawer({
  empresa,
  open,
  onClose,
  benchmarkPais = "latam",
}: MadurezDrawerProps) {
  const router = useRouter();

  if (!empresa) return null;

  const radarData = empresa.dimensiones.map((d, i) => ({
    nombre: d.nombre.length > 12 ? d.nombre.slice(0, 11) + "…" : d.nombre,
    fullNombre: d.nombre,
    Empresa: d.score,
    Benchmark: empresa.dimensiones[i]?.benchmark ?? 2.6,
    Meta: META_DEFINIDO_MAS[i] ?? 3.0,
  }));

  const servicioRecomendado =
    BRECHA_A_SERVICIO[empresa.dimMasDebil?.nombre] || empresa.servicioSugerido;

  const handleCrearPropuesta = () => {
    onClose();
    router.push(buildPropuestaUrl(empresa));
  };

  const handleVerLead = () => {
    onClose();
    router.push(
      `/pipeline${empresa.emailCorporativo ? `?email=${encodeURIComponent(empresa.emailCorporativo)}` : ""}`
    );
  };

  const metaLine = empresa.brechaPercepcion >= 0 ? "Subestima" : "Sobreestima";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="!max-w-[920px] w-[92vw] flex flex-col gap-0 overflow-hidden rounded-2xl p-0 max-h-[92vh]"
        showCloseButton
      >
        <div
          className="h-1 w-full shrink-0 rounded-t-2xl"
          style={{ background: "linear-gradient(90deg, #8560C0, #4CCED5)" }}
        />

        <div className="shrink-0 bg-gradient-to-br from-[#1B3A5C] via-[#33487A] to-[#8560C0] px-8 py-5 text-white">
          <h2 className="text-xl font-bold text-white">
            {empresa.nombreEmpresa}
          </h2>
          <p className="mt-1 text-sm text-white/90">
            {[empresa.sector, getPaisLabel(empresa.pais), empresa.tamano]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "border-0 font-semibold text-white",
                empresa.nivel?.bg?.replace("50", "500") || "bg-gray-500"
              )}
              style={{ backgroundColor: empresa.nivel?.color }}
            >
              {empresa.nivel?.nombre || "—"}
            </Badge>
            <span className="text-lg font-bold">IGM {empresa.igm.toFixed(1)}</span>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              className="bg-white text-[#1B3A5C] hover:bg-white/90"
              onClick={handleCrearPropuesta}
            >
              <FileText className="mr-1.5 h-4 w-4" />
              Crear propuesta
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/50 text-white hover:bg-white/10"
              onClick={handleVerLead}
            >
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Ver lead
            </Button>
          </div>
        </div>

        <div className="px-8 py-6">
          <Tabs defaultValue="diagnostico" className="flex flex-col">
            <TabsList className="shrink-0 rounded-xl">
            <TabsTrigger value="diagnostico" className="rounded-lg">
              Diagnóstico
            </TabsTrigger>
            <TabsTrigger value="brechas" className="rounded-lg">
              Brechas
            </TabsTrigger>
            <TabsTrigger value="historial" className="rounded-lg">
              Historial
            </TabsTrigger>
          </TabsList>

            <div className="mt-4 overflow-y-auto pb-4">
            <TabsContent value="diagnostico" className="mt-4">
              {/* Radar */}
              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <h4 className="mb-3 font-semibold text-[#1B3A5C]">
                  Perfil por dimensión
                </h4>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#f3f4f6" />
                    <PolarAngleAxis
                      dataKey="nombre"
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                    />
                    <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                    <Radar
                      name="Empresa"
                      dataKey="Empresa"
                      fill="#1B3A5C"
                      fillOpacity={0.4}
                      stroke="#1B3A5C"
                      strokeWidth={2}
                    />
                    <Radar
                      name="Benchmark"
                      dataKey="Benchmark"
                      fill="#D4881E"
                      fillOpacity={0.15}
                      stroke="#D4881E"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                    />
                    <Radar
                      name="Meta"
                      dataKey="Meta"
                      fill="#4CCED5"
                      fillOpacity={0.05}
                      stroke="#4CCED5"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabla dimensiones */}
              <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
                <h4 className="mb-3 font-semibold text-[#1B3A5C]">
                  Score por dimensión
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-2 pr-2 font-medium">Dimensión</th>
                        <th className="pb-2 pr-2 font-medium">Score</th>
                        <th className="pb-2 pr-2 font-medium">Benchmark</th>
                        <th className="pb-2 font-medium">Brecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empresa.dimensiones.map((d, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1.5 text-[#1B3A5C]">{d.nombre}</td>
                          <td className="py-1.5 font-medium">{d.score.toFixed(1)}</td>
                          <td className="py-1.5 text-gray-600">{d.benchmark.toFixed(1)}</td>
                          <td
                            className={cn(
                              "py-1.5 font-medium",
                              d.brecha >= 0 ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {d.brecha >= 0 ? "+" : ""}
                            {d.brecha.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Brecha percepción */}
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                <h4 className="mb-2 font-semibold text-[#1B3A5C]">
                  Brecha de percepción
                </h4>
                <p className="text-sm text-gray-600">
                  Autoevaluación {empresa.madurezAutoevaluada.toFixed(1)} vs IGM{" "}
                  {empresa.igm.toFixed(1)}. La empresa{" "}
                  <strong>{metaLine}</strong> su madurez (
                  {empresa.brechaPercepcion >= 0 ? "+" : ""}
                  {empresa.brechaPercepcion.toFixed(1)} pts).
                </p>
              </div>
            </TabsContent>

            <TabsContent value="brechas" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-[#1B3A5C]">
                  Top 3 brechas vs benchmark
                </h4>
                {empresa.brechaTop3?.slice(0, 3).map((b, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{
                        backgroundColor:
                          DIMENSIONES.find((d) => d.nombre === b.nombre)?.pilarColor ??
                          "#6b7280",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#1B3A5C]">{b.nombre}</p>
                      <p className="text-sm text-gray-500">
                        Score {b.score.toFixed(1)} vs benchmark {b.benchmark.toFixed(1)} → brecha{" "}
                        {b.brecha >= 0 ? "+" : ""}
                        {b.brecha.toFixed(1)}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#8560C0]">
                        {BRECHA_A_SERVICIO[b.nombre] || "—"}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl border border-[#1B3A5C]/20 bg-[#1B3A5C]/5 p-4">
                  <h5 className="mb-2 flex items-center gap-2 font-semibold text-[#1B3A5C]">
                    <Target className="h-4 w-4" />
                    Posicionamiento sugerido
                  </h5>
                  <p className="text-sm text-gray-600">
                    {servicioRecomendado}
                  </p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={handleCrearPropuesta}
                  >
                    Crear propuesta
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="historial" className="mt-4">
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 text-center">
                <History className="h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm font-medium text-gray-500">
                  Historial de evaluaciones
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Próximamente
                </p>
              </div>
            </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
