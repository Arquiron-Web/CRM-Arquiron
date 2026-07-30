"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  DollarSign,
  AlertCircle,
  Plus,
  Building2,
  Layers,
  User,
  Calendar,
  Target,
  MoreVertical,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { NewProyectoModal } from "@/components/proyectos/NewProyectoModal";
import { ProyectoDrawer } from "@/components/proyectos/ProyectoDrawer";
import {
  ETAPAS_FORJA,
  ESTADOS_PROYECTO,
  ESTADOS_PAGO,
} from "@/types/proyecto";
import type { Proyecto } from "@/types/proyecto";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

function getEtapaOrden(etapa: string): number {
  const e = ETAPAS_FORJA.find(
    (x) => x.nombre.toLowerCase() === etapa?.toLowerCase()
  );
  return e?.orden ?? 0;
}

function getEstadoProyectoStyle(estado: string) {
  return (
    ESTADOS_PROYECTO.find((e) => e.value === estado) || ESTADOS_PROYECTO[0]
  );
}

function getEstadoPagoStyle(estado: string) {
  return ESTADOS_PAGO.find((e) => e.value === estado) || ESTADOS_PAGO[0];
}

export default function ProyectosPage() {
  const router = useRouter();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerProyecto, setDrawerProyecto] = useState<Proyecto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchProyectos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proyectos");
      if (res.ok) {
        const data = await res.json();
        setProyectos(Array.isArray(data) ? data : []);
      }
    } catch {
      setProyectos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProyectos();
  }, []);

  const proyectosFiltrados =
    filtroEstado === "todos"
      ? proyectos
      : proyectos.filter((p) => p.estadoProyecto === filtroEstado);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const activos = proyectos.filter((p) => p.estadoProyecto === "ACTIVO");
  const enPausa = proyectos.filter((p) => p.estadoProyecto === "EN_PAUSA");
  const valorEnEjecucion = [
    ...activos,
    ...enPausa,
  ].reduce((sum, p) => sum + parseFloat(p.valorUSD || "0"), 0);

  const accionesVencidas = proyectos.filter((p) => {
    if (["COMPLETADO", "CANCELADO"].includes(p.estadoProyecto)) return false;
    if (!p.fechaProximaAccion) return false;
    const f = new Date(p.fechaProximaAccion);
    f.setHours(0, 0, 0, 0);
    return f < hoy;
  }).length;

  const avancePromedio =
    activos.length > 0
      ? activos.reduce((s, p) => s + parseFloat(p.porcentajeAvance || "0"), 0) /
        activos.length
      : 0;

  const proyectosPorEtapa = ETAPAS_FORJA.map((etapa) => ({
    ...etapa,
    count: proyectos.filter(
      (p) =>
        (p.etapaForja || "").toLowerCase() === etapa.nombre.toLowerCase() &&
        !["COMPLETADO", "CANCELADO"].includes(p.estadoProyecto)
    ).length,
  }));

  const handleDrawerSave = (proyecto: Proyecto, updates: Partial<Proyecto>) => {
    setProyectos((prev) =>
      prev.map((p) =>
        p.id === proyecto.id ? { ...p, ...updates } : p
      )
    );
    if (drawerProyecto?.id === proyecto.id) {
      setDrawerProyecto({ ...proyecto, ...updates });
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
        <Skeleton className="h-40" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">
            Proyectos Activos
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión del ciclo de entrega con metodología FORJA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v ?? "todos")}>
            <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
              <SelectValue>
                {(val: string | null) =>
                  val && val !== "todos"
                    ? ESTADOS_PROYECTO.find((e) => e.value === val)?.label || "Todos"
                    : "Todos"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {ESTADOS_PROYECTO.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setModalOpen(true)}
            className="rounded-xl bg-[#1B3A5C] px-5 font-semibold text-white hover:bg-[#33487A]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#1B3A5C" }}
            >
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1B3A5C]">
                {activos.length}
              </p>
              <p className="text-xs text-gray-500">Proyectos activos</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1B3A5C]">
                ${valorEnEjecucion.toLocaleString("es-CO")} USD
              </p>
              <p className="text-xs text-gray-500">Valor en ejecución</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.11 }}
          className={cn(
            "rounded-2xl border border-gray-100 bg-white p-6 shadow-sm",
            accionesVencidas > 0 ? "border-red-200" : ""
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                accionesVencidas > 0 ? "bg-red-100" : "bg-green-100"
              )}
            >
              <AlertCircle
                className={cn(
                  "h-6 w-6",
                  accionesVencidas > 0 ? "text-red-600" : "text-green-600"
                )}
              />
            </div>
            <div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  accionesVencidas > 0 ? "text-red-600" : "text-green-600"
                )}
              >
                {accionesVencidas}
              </p>
              <p className="text-xs text-gray-500">Acciones vencidas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.14 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                avancePromedio < 50
                  ? "bg-red-100"
                  : avancePromedio < 75
                    ? "bg-orange-100"
                    : "bg-green-100"
              )}
            >
              <span
                className={cn(
                  "text-lg font-bold",
                  avancePromedio < 50
                    ? "text-red-600"
                    : avancePromedio < 75
                      ? "text-orange-600"
                      : "text-green-600"
                )}
              >
                {Math.round(avancePromedio)}%
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1B3A5C]">
                Avance promedio
              </p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    avancePromedio < 50
                      ? "bg-red-500"
                      : avancePromedio < 75
                        ? "bg-orange-500"
                        : "bg-green-500"
                  )}
                  style={{ width: `${avancePromedio}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Barra FORJA global */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, #1B3A5C 0%, #33487A 50%, #1B3A5C 100%)",
        }}
      >
        <p className="mb-4 text-sm font-bold text-white/90">
          {"Pipeline FORJA - Proyectos activos por etapa"}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          {proyectosPorEtapa.map((etapa, idx) => (
            <motion.div
              key={etapa.letra}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="flex flex-col items-center gap-1"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black text-white shadow-sm"
                style={{ backgroundColor: etapa.color }}
              >
                {etapa.letra}
              </span>
              <span className="text-xs font-medium text-white/80">
                {etapa.nombre}
              </span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold text-white">
                {etapa.count}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-white/40" style={{ width: "100%" }} />
        </div>
      </motion.div>

      {/* Lista de proyectos */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#1B3A5C]">
          Proyectos
        </h2>
        <div className="space-y-4">
          {proyectosFiltrados.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm font-medium text-gray-600">
                No hay proyectos
                {filtroEstado !== "todos" ? " con este filtro" : ""}
              </p>
              {filtroEstado === "todos" && (
                <Button
                  onClick={() => setModalOpen(true)}
                  className="mt-4 rounded-xl bg-[#1B3A5C] text-white hover:bg-[#33487A]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer proyecto
                </Button>
              )}
            </div>
          ) : (
            proyectosFiltrados.map((proyecto, index) => {
              const etapaActual = getEtapaOrden(proyecto.etapaForja);
              const estProy = getEstadoProyectoStyle(proyecto.estadoProyecto);
              const estPago = getEstadoPagoStyle(proyecto.estadoPago);
              const fechaProv = proyecto.fechaProximaAccion
                ? new Date(proyecto.fechaProximaAccion)
                : null;
              const accionVencida =
                fechaProv &&
                !["COMPLETADO", "CANCELADO"].includes(proyecto.estadoProyecto) &&
                fechaProv.getTime() < hoy.getTime();
              const diffDias = fechaProv
                ? Math.floor(
                    (hoy.getTime() - fechaProv.getTime()) / (1000 * 60 * 60 * 24)
                  )
                : 0;

              const igmIni = parseFloat(proyecto.igmInicial);
              const igmFin = parseFloat(proyecto.igmFinal);
              const mejoraIGM =
                !isNaN(igmIni) && !isNaN(igmFin) ? igmFin - igmIni : null;

              return (
                <motion.div
                  key={proyecto.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:scale-[1.002] hover:shadow-md lg:flex-row"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-[#1B3A5C]">
                        {proyecto.nombre}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          estProy.bgClass,
                          estProy.textClass
                        )}
                      >
                        {estProy.label}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" />
                        {proyecto.empresaCliente}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-4 w-4" />
                        {proyecto.servicioForja}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        {proyecto.consultor}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {ETAPAS_FORJA.map((etapa, i) => (
                        <div
                          key={etapa.letra}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                            i + 1 < etapaActual
                              ? "text-white"
                              : i + 1 === etapaActual
                                ? "ring-2 ring-offset-2"
                                : "bg-gray-100 text-gray-400"
                          )}
                          style={{
                            backgroundColor:
                              i + 1 <= etapaActual ? etapa.color : undefined,
                            ...(i + 1 === etapaActual
                              ? {
                                  backgroundColor: etapa.color,
                                  boxShadow: `0 0 0 2px ${etapa.color}40`,
                                }
                              : {}),
                          }}
                        >
                          {etapa.letra}
                        </div>
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-600">
                        {proyecto.porcentajeAvance || "0"}%
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Inicio: {proyecto.fechaInicio || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        Cierre est: {proyecto.fechaCierreEst || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        ${parseFloat(proyecto.valorUSD || "0").toLocaleString()}{" "}
                        USD
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-xs"
                        style={{
                          backgroundColor: `${estPago.color}20`,
                          color: estPago.color,
                        }}
                      >
                        {estPago.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex w-48 flex-col gap-2 lg:w-52">
                    {(igmIni > 0 || igmFin > 0) && (
                      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-sm">
                        <p className="font-medium text-[#1B3A5C]">
                          IGM: {igmIni || "—"} → {igmFin || "pendiente"}
                          {mejoraIGM !== null && mejoraIGM > 0 && (
                            <span className="ml-1 text-green-600">
                              (+{mejoraIGM.toFixed(1)})
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {proyecto.proximaAccion && (
                      <div
                        className={cn(
                          "rounded-xl border p-3",
                          accionVencida
                            ? "border-red-200 bg-red-50/50"
                            : "border-gray-100 bg-gray-50/50"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle
                            className={cn(
                              "h-4 w-4 shrink-0 mt-0.5",
                              accionVencida ? "text-red-500" : "text-gray-400"
                            )}
                          />
                          <div>
                            <p className="text-xs font-medium text-[#1B3A5C]">
                              {proyecto.proximaAccion}
                            </p>
                            <p
                              className={cn(
                                "text-xs",
                                accionVencida
                                  ? "text-red-600"
                                  : "text-gray-500"
                              )}
                            >
                              {accionVencida
                                ? `Vencida hace ${diffDias} días`
                                : proyecto.fechaProximaAccion || ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={() => {
                          setDrawerProyecto(proyecto);
                          setDrawerOpen(true);
                        }}
                      >
                        Ver detalle
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 rounded-xl p-0"
                            />
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={() => {
                              setDrawerProyecto(proyecto);
                              setDrawerOpen(true);
                            }}
                          >
                            Editar proyecto
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDrawerProyecto(proyecto);
                              setDrawerOpen(true);
                            }}
                          >
                            Registrar avance
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDrawerProyecto(proyecto);
                              setDrawerOpen(true);
                            }}
                          >
                            Marcar completado
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/leads${proyecto.emailCliente ? `?search=${encodeURIComponent(proyecto.emailCliente)}` : ""}`
                              )
                            }
                          >
                            Ver lead original
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <NewProyectoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchProyectos}
      />

      <ProyectoDrawer
        proyecto={drawerProyecto}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerProyecto(null);
        }}
        onSave={handleDrawerSave}
        onSuccess={fetchProyectos}
      />
    </div>
  );
}
