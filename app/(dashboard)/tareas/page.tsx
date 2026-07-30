"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  Building2,
  MoreVertical,
} from "lucide-react";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  RefreshCw,
  DollarSign,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { NewTareaModal } from "@/components/tareas/NewTareaModal";
import { TareaDrawer } from "@/components/tareas/TareaDrawer";
import {
  TIPOS_TAREA,
  PRIORIDADES_TAREA,
} from "@/types/tarea";
import type { Tarea } from "@/types/tarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIPO_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  phone: Phone,
  mail: Mail,
  calendar: Calendar,
  "file-text": FileText,
  "refresh-cw": RefreshCw,
  "check-square": CheckSquare,
  "dollar-sign": DollarSign,
  "more-horizontal": MoreHorizontal,
};

function getGrupoFecha(t: Tarea, hoy: Date): string {
  if (!t.fechaVencimiento) return "sin_fecha";
  const f = new Date(t.fechaVencimiento);
  f.setHours(0, 0, 0, 0);
  const hoyStr = hoy.toDateString();
  const fStr = f.toDateString();

  if (fStr < hoyStr) return "vencidas";
  if (fStr === hoyStr) return "hoy";
  const mañana = new Date(hoy);
  mañana.setDate(mañana.getDate() + 1);
  if (fStr === mañana.toDateString()) return "mañana";

  const finSemana = new Date(hoy);
  finSemana.setDate(finSemana.getDate() + 7);
  if (f <= finSemana) return "semana";
  return "mas_adelante";
}

const GRUPOS: { key: string; label: string; icon: typeof AlertCircle; color: string }[] = [
  { key: "vencidas", label: "Vencidas", icon: AlertCircle, color: "#ef4444" },
  { key: "hoy", label: "Hoy", icon: Clock, color: "#D4881E" },
  { key: "mañana", label: "Mañana", icon: Clock, color: "#eab308" },
  { key: "semana", label: "Esta semana", icon: Calendar, color: "#3b82f6" },
  { key: "mas_adelante", label: "Más adelante", icon: CheckSquare, color: "#9ca3af" },
  { key: "sin_fecha", label: "Sin fecha", icon: MoreHorizontal, color: "#9ca3af" },
];

function formatHora(h: string): string {
  if (!h) return "";
  const m = h.match(/(\d{1,2}):?(\d{2})?/);
  if (!m) return h;
  const hr = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  return `${hr.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

export default function TareasPage() {
  const router = useRouter();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todas");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerTarea, setDrawerTarea] = useState<Tarea | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [completandoId, setCompletandoId] = useState<string | null>(null);
  const [taskRefs, setTaskRefs] = useState<Record<string, HTMLDivElement | null>>({});

  const { data: session } = useSession();
  const userName = session?.user?.name ?? "";

  const fetchTareas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tareas");
      if (res.ok) {
        const data = await res.json();
        setTareas(Array.isArray(data) ? data : []);
      }
    } catch {
      setTareas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTareas();
  }, []);

  const hoy = useMemo(() => {
    const h = new Date();
    h.setHours(0, 0, 0, 0);
    return h;
  }, []);

  const tareasFiltradas = useMemo(() => {
    let list = tareas.filter((t) => !["COMPLETADA", "CANCELADA"].includes(t.estado));
    if (filtro === "mis") list = list.filter((t) => t.asignadoA === userName);
    if (filtro === "urgentes") list = list.filter((t) => t.prioridad === "urgente");
    if (filtro === "hoy") list = list.filter((t) => t.fechaVencimiento && new Date(t.fechaVencimiento).toDateString() === hoy.toDateString());
    if (filtro === "semana") {
      const fin = new Date(hoy);
      fin.setDate(fin.getDate() + 7);
      list = list.filter((t) => {
        if (!t.fechaVencimiento) return false;
        const f = new Date(t.fechaVencimiento);
        return f >= hoy && f <= fin;
      });
    }
    return list;
  }, [tareas, filtro, hoy, userName]);

  const tareasPorGrupo = useMemo(() => {
    const map: Record<string, Tarea[]> = {};
    GRUPOS.forEach((g) => (map[g.key] = []));
    tareasFiltradas.forEach((t) => {
      const g = getGrupoFecha(t, hoy);
      if (map[g]) map[g].push(t);
    });
    return map;
  }, [tareasFiltradas, hoy]);

  const kpiPendientes = tareas.filter((t) => ["PENDIENTE", "EN_PROGRESO"].includes(t.estado)).length;
  const kpiVencenHoy = tareas.filter((t) => {
    if (["COMPLETADA", "CANCELADA"].includes(t.estado)) return false;
    return t.fechaVencimiento && new Date(t.fechaVencimiento).toDateString() === hoy.toDateString();
  }).length;
  const kpiVencidasSinCompletar = tareas.filter((t) => {
    if (["COMPLETADA", "CANCELADA"].includes(t.estado)) return false;
    if (!t.fechaVencimiento) return false;
    return new Date(t.fechaVencimiento) < hoy;
  }).length;
  const sieteDiasAtras = new Date();
  sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
  const kpiCompletadasSemana = tareas.filter((t) => {
    if (t.estado !== "COMPLETADA" || !t.completadaEn) return false;
    return new Date(t.completadaEn) >= sieteDiasAtras;
  }).length;

  const semana7 = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(hoy);
      d.setDate(d.getDate() + i);
      const count = tareas.filter((t) => {
        if (["COMPLETADA", "CANCELADA"].includes(t.estado)) return false;
        if (!t.fechaVencimiento) return false;
        return new Date(t.fechaVencimiento).toDateString() === d.toDateString();
      }).length;
      arr.push({ fecha: d, count });
    }
    return arr;
  }, [tareas, hoy]);

  const urgentesTop3 = useMemo(() => {
    return tareas
      .filter((t) => !["COMPLETADA", "CANCELADA"].includes(t.estado) && (t.prioridad === "urgente" || t.prioridad === "alta"))
      .slice(0, 3);
  }, [tareas]);

  const scrollToTask = (id: string) => {
    const el = document.getElementById(`tarea-${id}`);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCompletar = async (tarea: Tarea) => {
    setCompletandoId(tarea.id);
    try {
      const res = await fetch("/api/tareas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tarea, estado: "COMPLETADA" }),
      });
      if (!res.ok) throw new Error("Error");
      setTareas((prev) => prev.map((t) => (t.id === tarea.id ? { ...t, estado: "COMPLETADA", completadaEn: new Date().toISOString() } : t)));
      toast.success("Tarea completada ✓");
    } catch {
      toast.error("Error al completar");
    } finally {
      setCompletandoId(null);
    }
  };

  const handleCancelar = async (tarea: Tarea) => {
    try {
      const res = await fetch("/api/tareas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tarea, estado: "CANCELADA" }),
      });
      if (!res.ok) throw new Error("Error");
      setTareas((prev) => prev.map((t) => (t.id === tarea.id ? { ...t, estado: "CANCELADA" } : t)));
      toast.success("Tarea cancelada");
    } catch {
      toast.error("Error al cancelar");
    }
  };

  const handleCambiarPrioridad = async (tarea: Tarea, prioridad: string) => {
    try {
      const res = await fetch("/api/tareas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tarea, prioridad }),
      });
      if (!res.ok) throw new Error("Error");
      setTareas((prev) => prev.map((t) => (t.id === tarea.id ? { ...t, prioridad } : t)));
    } catch {
      toast.error("Error al actualizar");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Tareas</h1>
          <p className="mt-1 text-sm text-gray-500">Seguimiento de pendientes y próximas acciones</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filtro} onValueChange={(v) => setFiltro(v ?? "todas")}>
            <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
              <SelectValue>
                {(val: string | null) =>
                  ({
                    todas: "Todas",
                    mis: "Mis tareas",
                    urgentes: "Urgentes",
                    hoy: "Hoy",
                    semana: "Esta semana",
                  } as Record<string, string>)[val || "todas"] || "Todas"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="mis">Mis tareas</SelectItem>
              <SelectItem value="urgentes">Urgentes</SelectItem>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setModalOpen(true)}
            className="rounded-xl bg-[#1B3A5C] px-5 font-semibold text-white hover:bg-[#33487A]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tareas pendientes", value: kpiPendientes, icon: CheckSquare, color: "#1B3A5C" },
          { label: "Vencen hoy", value: kpiVencenHoy, icon: AlertCircle, color: kpiVencenHoy > 0 ? "#D4881E" : "#9ca3af" },
          { label: "Vencidas sin completar", value: kpiVencidasSinCompletar, icon: Clock, color: kpiVencidasSinCompletar > 0 ? "#ef4444" : "#22c55e" },
          { label: "Completadas esta semana", value: kpiCompletadasSemana, icon: CheckCircle2, color: "#22c55e" },
        ].map((k) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${k.color}20` }}>
                <k.icon className="h-6 w-6" style={{ color: k.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1B3A5C]">{k.value}</p>
                <p className="text-xs text-gray-500">{k.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Vista de tareas */}
      <div className="flex gap-6">
        <div className="min-w-0 flex-1 space-y-6">
          {GRUPOS.map((grupo, gIdx) => {
            const items = tareasPorGrupo[grupo.key] || [];
            if (items.length === 0) return null;

            return (
              <motion.div
                key={grupo.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gIdx * 0.08 }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <grupo.icon className="h-4 w-4" style={{ color: grupo.color }} />
                  <span className="text-sm font-semibold text-[#1B3A5C]">{grupo.label}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{items.length}</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {items.map((tarea) => {
                      const completada = tarea.estado === "COMPLETADA";
                      const tipoInfo = TIPOS_TAREA.find((x) => x.value === tarea.tipo);
                      const prioridadInfo = PRIORIDADES_TAREA.find((x) => x.value === tarea.prioridad) || PRIORIDADES_TAREA[2];
                      const TipoIcon = tipoInfo ? TIPO_ICONS[tipoInfo.icon] : MoreHorizontal;

                      return (
                        <motion.div
                          key={tarea.id}
                          id={`tarea-${tarea.id}`}
                          ref={(el) => setTaskRefs((prev) => ({ ...prev, [tarea.id]: el }))}
                          layout
                          initial={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
                            completada && "opacity-75"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => !completada && handleCompletar(tarea)}
                            disabled={completada || completandoId === tarea.id}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                            style={{
                              borderColor: completada ? "#22c55e" : "#e5e7eb",
                              backgroundColor: completada ? "#22c55e" : "transparent",
                            }}
                          >
                            {completada && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className={cn("font-medium text-[#1B3A5C]", completada && "line-through text-gray-400")}>
                              {tarea.titulo}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {tipoInfo && (
                                <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: `${tipoInfo.color}20`, color: tipoInfo.color }}>
                                  <TipoIcon className="h-3 w-3" />
                                  {tipoInfo.label}
                                </span>
                              )}
                              {tarea.empresa && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Building2 className="h-3 w-3" />
                                  {tarea.empresa}
                                </span>
                              )}
                              {tarea.hora && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  {formatHora(tarea.hora)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", prioridadInfo.bgClass, prioridadInfo.textClass)}>
                              {prioridadInfo.label}
                            </span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1B3A5C] text-xs font-bold text-white">
                              {(tarea.asignadoA || "?").charAt(0).toUpperCase()}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button size="sm" variant="outline" className="h-8 w-8 rounded-xl p-0" />
                                }
                              >
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => { setDrawerTarea(tarea); setDrawerOpen(true); }}>Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCompletar(tarea)}>Marcar completada</DropdownMenuItem>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>Cambiar prioridad</DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {PRIORIDADES_TAREA.map((p) => (
                                      <DropdownMenuItem key={p.value} onClick={() => handleCambiarPrioridad(tarea, p.value)}>
                                        {p.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                {tarea.relacionadoCon === "Lead" && tarea.idReferencia && (
                                  <DropdownMenuItem onClick={() => router.push(`/leads?search=${encodeURIComponent(tarea.empresa || "")}`)}>
                                    Ver lead relacionado
                                  </DropdownMenuItem>
                                )}
                                {tarea.relacionadoCon === "Proyecto" && (
                                  <DropdownMenuItem onClick={() => router.push("/proyectos")}>
                                    Ver proyecto
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleCancelar(tarea)} className="text-red-600">
                                  Cancelar tarea
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Panel derecho */}
        <div className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-[#1B3A5C]">Esta semana</p>
            <div className="grid grid-cols-7 gap-1">
              {semana7.map((d) => (
                <div key={d.fecha.toISOString()} className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">{d.fecha.toLocaleDateString("es-CO", { weekday: "short" }).slice(0, 2)}</span>
                  <span className={cn("text-sm font-semibold", d.fecha.toDateString() === new Date().toDateString() && "rounded bg-[#1B3A5C] px-1.5 py-0.5 text-white")}>
                    {d.fecha.getDate()}
                  </span>
                  {d.count > 0 && <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#1B3A5C]" title={`${d.count} tareas`} />}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm font-semibold text-[#1B3A5C]">Tareas urgentes</p>
            <div className="mt-2 space-y-2">
              {urgentesTop3.length === 0 ? (
                <p className="text-xs text-gray-400">Sin tareas urgentes</p>
              ) : (
                urgentesTop3.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => scrollToTask(t.id)}
                    className="block w-full text-left rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 text-xs hover:bg-gray-100"
                  >
                    <span className="line-clamp-1 font-medium text-[#1B3A5C]">{t.titulo}</span>
                    <span className="text-[10px] text-gray-500">Ir a la tarea</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <NewTareaModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchTareas} />
      <TareaDrawer
        tarea={drawerTarea}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDrawerTarea(null); }}
        onSave={(t, updates) => {
          setTareas((prev) =>
            prev.map((x) =>
              x.id === t.id ? { ...x, ...updates } : x
            )
          );
          setDrawerTarea((prev) => (prev?.id === t.id ? { ...prev, ...updates } : prev));
        }}
      />
    </div>
  );
}
