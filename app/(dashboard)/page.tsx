"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Zap,
  BarChart2,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  CheckSquare,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { getRetoLabel } from "@/lib/pipeline-utils";
import type { Lead } from "@/types/lead";
import Link from "next/link";

function calcularTiempoRelativo(timestamp: string): string {
  if (!timestamp) return "Fecha desconocida";
  const fecha = new Date(timestamp);
  const ahora = new Date();
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);

  if (diffMin < 60) return `Hace ${diffMin} minutos`;
  if (diffHrs < 24) return `Hace ${diffHrs} horas`;
  if (diffDias === 1) return "Ayer";
  if (diffDias < 7) return `Hace ${diffDias} días`;
  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

const FUENTE_LABELS: Record<string, string> = {
  Portal_Empresarial: "Portal Web",
  Evaluacion_Madurez: "Evaluación",
};

const PAISES_LABELS: Record<string, string> = {
  colombia: "Colombia",
  ecuador: "Ecuador",
  peru: "Perú",
  chile: "Chile",
  mexico: "México",
  panama: "Panamá",
  costa_rica: "Costa Rica",
  otro_latam: "Otro LATAM",
};

function getClasificacionColor(clasificacion: string): string {
  const c = clasificacion || "";
  if (c.includes("Oportunidad Inmediata")) return "#ef4444";
  if (c.includes("Oportunidad Alta")) return "var(--color-arquiron-orange)";
  if (c.includes("Oportunidad Media")) return "#eab308";
  if (c.includes("Oportunidad Baja")) return "#22c55e";
  if (c.includes("Sin Oportunidad")) return "#9ca3af";
  return "#9ca3af";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tareas, setTareas] = useState<Array<{ id: string; titulo: string; prioridad: string; asignadoA: string; estado: string; fechaVencimiento: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Error al cargar leads");
      }
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      setError("No se pudieron cargar los leads. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    fetch("/api/tareas")
      .then((r) => r.json())
      .then((data) => setTareas(Array.isArray(data) ? data : []))
      .catch(() => setTareas([]));
  }, []);

  // KPIs
  const totalLeads = leads.length;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const leadsEstaSemana = leads.filter((l) => {
    const ts = l.timestamp ? new Date(l.timestamp) : null;
    return ts && ts >= sevenDaysAgo;
  }).length;
  const oportunidadesInmediatas = leads.filter(
    (l) =>
      (l.estadoLead || "NUEVO") === "NUEVO" &&
      parseInt(l.scoreLead || "0") >= 55
  ).length;
  const hoyDate = new Date();
  hoyDate.setHours(0, 0, 0, 0);
  const tareasParaHoy = tareas.filter((t) => {
    if (["COMPLETADA", "CANCELADA"].includes(t.estado)) return false;
    if (!t.fechaVencimiento) return false;
    const f = new Date(t.fechaVencimiento);
    f.setHours(0, 0, 0, 0);
    const esDelDia = f <= hoyDate || f.toDateString() === hoyDate.toDateString();
    const esMia = !session?.user?.name || t.asignadoA === session.user.name;
    return esDelDia && esMia;
  }).slice(0, 5);

  const leadsConIGM = leads.filter((l) => l.indiceMadurez && l.indiceMadurez.trim() !== "");
  const igmPromedio =
    leadsConIGM.length > 0
      ? (
          leadsConIGM.reduce((acc, l) => acc + parseFloat(l.indiceMadurez) || 0, 0) /
          leadsConIGM.length
        ).toFixed(1)
      : "0";

  // Datos para gráficas
  const clasificacionData = [
    {
      name: "Oportunidad Inmediata",
      value: leads.filter((l) =>
        (l.clasificacion || "").includes("Oportunidad Inmediata")
      ).length,
      color: "#ef4444",
    },
    {
      name: "Oportunidad Alta",
      value: leads.filter(
        (l) =>
          (l.clasificacion || "").includes("Oportunidad Alta") &&
          !(l.clasificacion || "").includes("Inmediata")
      ).length,
      color: "#D4881E",
    },
    {
      name: "Oportunidad Media",
      value: leads.filter((l) =>
        (l.clasificacion || "").includes("Oportunidad Media")
      ).length,
      color: "#eab308",
    },
    {
      name: "Oportunidad Baja",
      value: leads.filter(
        (l) =>
          (l.clasificacion || "").includes("Oportunidad Baja") &&
          !(l.clasificacion || "").includes("Media")
      ).length,
      color: "#22c55e",
    },
    {
      name: "Sin Oportunidad",
      value: leads.filter((l) =>
        (l.clasificacion || "").includes("Sin Oportunidad")
      ).length,
      color: "#9ca3af",
    },
  ]
    .filter((item) => item.value > 0)
    .map(({ name, value, color }) => ({ name, value, color }));

  const fuenteData = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      const f = l.fuenteFormulario || "Otro";
      const key = f in FUENTE_LABELS ? f : "Otro";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([key, value]) => ({
    name: FUENTE_LABELS[key as keyof typeof FUENTE_LABELS] || key,
    value,
    fill: key === "Portal_Empresarial" ? "#1B3A5C" : "#8560C0",
  }));

  const paisesCount = leads.reduce(
    (acc, lead) => {
      const paisRaw = (lead.pais || "").toLowerCase().trim().replace(/\s+/g, "_");
      const paisLabel =
        PAISES_LABELS[paisRaw] ||
        (paisRaw
          ? paisRaw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          : "Sin país");
      acc[paisLabel] = (acc[paisLabel] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const paisData = Object.entries(paisesCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const recentLeads = [...leads]
    .sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 8);

  const actividadesRecientes = recentLeads.map((lead) => {
    const fuente = lead.fuenteFormulario;

    const icono =
      fuente === "Evaluacion_Madurez" ? (
        <BarChart2 className="h-4 w-4 text-[#8560C0]" />
      ) : lead.estadoLead === "CONTACTADO" ? (
        <Phone className="h-4 w-4 text-[#1B3A5C]" />
      ) : lead.estadoLead === "PROPUESTA" ? (
        <FileText className="h-4 w-4 text-[#D4881E]" />
      ) : lead.estadoLead === "GANADO" ? (
        <CheckCircle className="h-4 w-4 text-[#22c55e]" />
      ) : (
        <Mail className="h-4 w-4 text-[#1B3A5C]" />
      );

    const titulo =
      fuente === "Evaluacion_Madurez"
        ? `Evaluación completada — ${lead.nombreEmpresa}`
        : lead.estadoLead === "CONTACTADO"
          ? `Contacto realizado con ${lead.nombreEmpresa}`
          : lead.estadoLead === "PROPUESTA"
            ? `Propuesta enviada a ${lead.nombreEmpresa}`
            : lead.estadoLead === "GANADO"
              ? `Cliente ganado — ${lead.nombreEmpresa}`
              : `Nuevo lead registrado — ${lead.nombreEmpresa}`;

    const descripcion = lead.servicioSugeridoForja
      ? `Servicio: ${lead.servicioSugeridoForja}`
      : lead.retoPrincipal
        ? `Reto: ${getRetoLabel(lead.retoPrincipal)}`
        : "Sin descripción disponible";

    const consultor =
      lead.consultorAsignado ||
      (fuente === "Portal_Empresarial" ? "Portal Web" : "Evaluación");

    const tiempo = calcularTiempoRelativo(lead.timestamp);

    return {
      icono,
      titulo,
      descripcion,
      consultor,
      tiempo,
      lead,
    };
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchLeads}>Reintentar</Button>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Fila 1 - KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-gray-200">
                <CardContent className="relative p-6">
                  <div
                    className="absolute right-4 top-4 opacity-15 text-arquiron-navy"
                  >
                    <Users className="h-8 w-8" />
                  </div>
                  <p className="text-2xl font-bold text-arquiron-navy">
                    {totalLeads}
                  </p>
                  <p className="text-sm text-gray-500">Total Leads</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-gray-200">
                <CardContent className="relative p-6">
                  <div
                    className="absolute right-4 top-4 opacity-15 text-arquiron-teal"
                  >
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <p className="text-2xl font-bold text-arquiron-teal">
                    {leadsEstaSemana}
                  </p>
                  <p className="text-sm text-gray-500">Leads Esta Semana</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-gray-200">
                <CardContent className="relative p-6">
                  <div
                    className="absolute right-4 top-4 opacity-15 text-arquiron-orange"
                  >
                    <Zap className="h-8 w-8" />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-arquiron-orange">
                      {oportunidadesInmediatas}
                    </p>
                    {oportunidadesInmediatas > 0 && (
                      <Badge className="bg-red-500 text-white">!</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Oportunidades Inmediatas
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-gray-200">
                <CardContent className="relative p-6">
                  <div
                    className="absolute right-4 top-4 opacity-15 text-arquiron-purple"
                  >
                    <BarChart2 className="h-8 w-8" />
                  </div>
                  <p className="text-2xl font-bold text-arquiron-purple">
                    {igmPromedio}
                  </p>
                  <p className="text-sm text-gray-500">IGM Promedio</p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Fila 2 - Gráficas */}
      <div className="grid gap-6 lg:grid-cols-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))
        ) : (
          <>
            <motion.div variants={itemVariants}>
              <Card className="border-gray-200">
                <CardHeader>
                  <h3 className="font-semibold">Clasificación de Leads</h3>
                </CardHeader>
                <CardContent>
                  <div className="h-64 min-h-[256px] w-full">
                    <ResponsiveContainer width="100%" height={256} minWidth={0}>
                      <PieChart>
                        <Pie
                          data={clasificacionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                          }
                        >
                          {clasificacionData.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={entry.color || "#9ca3af"}
                            />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-gray-200">
                <CardHeader>
                  <h3 className="font-semibold">Leads por Fuente</h3>
                </CardHeader>
                <CardContent>
                  <div className="h-64 min-h-[256px] w-full">
                    <ResponsiveContainer width="100%" height={256} minWidth={0}>
                      <BarChart
                        data={fuenteData}
                        layout="vertical"
                        margin={{ left: 20, right: 20 }}
                      >
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={80}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar dataKey="value" fill="#1B3A5C" radius={[0, 4, 4, 0]}>
                          {fuenteData.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={
                                entry.name === "Portal Web"
                                  ? "var(--color-arquiron-navy)"
                                  : entry.name === "Evaluación"
                                    ? "var(--color-arquiron-purple)"
                                    : "#9ca3af"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-gray-200">
                <CardHeader>
                  <h3 className="font-semibold">Leads por País</h3>
                </CardHeader>
                <CardContent>
                  <div className="h-64 min-h-[256px] w-full">
                    <ResponsiveContainer width="100%" height={256} minWidth={0}>
                      <BarChart data={paisData} margin={{ left: 20 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill="var(--color-arquiron-teal)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Fila 3 - Mis tareas para hoy */}
      <motion.div variants={itemVariants}>
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-lg font-semibold text-[#1B3A5C]">Mis tareas para hoy</h2>
          {tareasParaHoy.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Sin tareas pendientes para hoy ✓</p>
          ) : (
            <div className="mt-4 space-y-2">
              {tareasParaHoy.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border border-gray-50 bg-gray-50/50 px-3 py-2">
                  <div className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-300" />
                  <span className="flex-1 text-sm font-medium text-[#1B3A5C]">{t.titulo}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.prioridad === "urgente" ? "bg-red-50 text-red-600" :
                    t.prioridad === "alta" ? "bg-orange-50 text-orange-600" :
                    t.prioridad === "media" ? "bg-yellow-50 text-yellow-600" : "bg-green-50 text-green-600"
                  }`}>
                    {t.prioridad === "urgente" ? "Urgente" : t.prioridad === "alta" ? "Alta" : t.prioridad === "media" ? "Media" : "Baja"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link href="/tareas">
            <Button variant="outline" className="mt-4 rounded-xl">Ver todas las tareas</Button>
          </Link>
        </div>
      </motion.div>

      {/* Fila 4 - Actividad Reciente */}
      <motion.div variants={itemVariants}>
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#1B3A5C]">
              Actividad Reciente
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Últimas interacciones del equipo
            </p>
          </div>

          {/* Lista de actividades */}
          {loading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <div className="space-y-0">
              {actividadesRecientes.map((actividad, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.3 }}
                  className={index < actividadesRecientes.length - 1 ? "border-b border-gray-50 pb-5" : ""}
                >
                  <div
                    className={`flex items-start gap-4 ${index < actividadesRecientes.length - 1 ? "mb-5" : ""}`}
                  >
                    {/* Ícono */}
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                      {actividad.icono}
                    </div>

                    {/* Contenido */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-[#1B3A5C]">
                        {actividad.titulo}
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-gray-500">
                        {actividad.descripcion}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <EstadoBadge
                          estado={actividad.lead.estadoLead || "NUEVO"}
                          size="sm"
                        />
                        <span className="text-xs text-gray-400">
                          {actividad.consultor} · {actividad.tiempo}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
