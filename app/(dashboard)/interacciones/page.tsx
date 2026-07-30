"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Filter,
  X,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  MapPin,
  Monitor,
  User,
  Building2,
  Clock,
  MessageSquare,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewInteraccionModal } from "@/components/interacciones/NewInteraccionModal";
import { NewEventoModal } from "@/components/calendario/NewEventoModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Interaccion } from "@/types/interaccion";

const TIPOS = [
  "Llamada",
  "Email",
  "Reunión",
  "WhatsApp",
  "Visita",
  "Demo",
];

const PERIODOS = [
  { value: "7", label: "Últimos 7 días" },
  { value: "30", label: "Últimos 30 días" },
  { value: "90", label: "Últimos 90 días" },
  { value: "year", label: "Este año" },
  { value: "all", label: "Todos" },
];

function getTipoConfig(tipo: string) {
  const configs: Record<
    string,
    { bg: string; badge: string; icon: typeof Phone }
  > = {
    Llamada: {
      bg: "bg-blue-500",
      badge: "bg-blue-50 text-blue-600 border-blue-200",
      icon: Phone,
    },
    Email: {
      bg: "bg-purple-500",
      badge: "bg-purple-50 text-purple-600 border-purple-200",
      icon: Mail,
    },
    Reunión: {
      bg: "bg-green-500",
      badge: "bg-green-50 text-green-600 border-green-200",
      icon: Calendar,
    },
    WhatsApp: {
      bg: "bg-[#25D366]",
      badge: "bg-green-50 text-green-700 border-green-200",
      icon: MessageCircle,
    },
    Visita: {
      bg: "bg-orange-500",
      badge: "bg-orange-50 text-orange-600 border-orange-200",
      icon: MapPin,
    },
    Demo: {
      bg: "bg-[#8560C0]",
      badge: "bg-violet-50 text-violet-600 border-violet-200",
      icon: Monitor,
    },
  };
  return (
    configs[tipo] || {
      bg: "bg-gray-500",
      badge: "bg-gray-50 text-gray-600 border-gray-200",
      icon: Mail,
    }
  );
}

function getResultadoBadge(resultado: string) {
  const configs: Record<string, string> = {
    Positivo: "bg-green-50 text-green-600",
    Excelente: "bg-teal-50 text-teal-600",
    Neutral: "bg-gray-50 text-gray-600",
    Negativo: "bg-red-50 text-red-500",
    "Sin respuesta": "bg-yellow-50 text-yellow-600",
  };
  return configs[resultado] || "bg-gray-50 text-gray-600";
}

function formatFechaHora(fecha: string, hora: string): string {
  if (!fecha) return "";
  const d = new Date(fecha + (hora ? `T${hora}` : ""));
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(hora && { hour: "2-digit", minute: "2-digit" }),
  });
}

function filtrarPorPeriodo(
  interacciones: Interaccion[],
  periodo: string
): Interaccion[] {
  if (periodo === "all") return interacciones;
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  return interacciones.filter((i) => {
    const ts = i.timestamp ? new Date(i.timestamp) : null;
    if (!ts || isNaN(ts.getTime())) return false;

    if (periodo === "year") {
      return ts.getFullYear() === ahora.getFullYear();
    }
    const dias = parseInt(periodo, 10);
    if (isNaN(dias)) return true;
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() - dias);
    return ts >= limite;
  });
}

export default function InteraccionesPage() {
  const [interacciones, setInteracciones] = useState<Interaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("30");
  const [showEventoModal, setShowEventoModal] = useState(false);
  const [eventoPreCargado, setEventoPreCargado] = useState<{
    titulo?: string;
    tipo?: string;
    cliente?: string;
    idLead?: string;
    fecha?: string;
    horaInicio?: string;
    horaFin?: string;
    descripcion?: string;
  } | null>(null);

  const fetchInteracciones = async () => {
    try {
      const res = await fetch("/api/interacciones");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Error al cargar");
      }
      const data = await res.json();
      setInteracciones(data);
    } catch {
      toast.error("No se pudieron cargar las interacciones.");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchInteracciones().finally(() => setLoading(false));
  }, []);

  const empresasUnicas = useMemo(
    () => [...new Set(interacciones.map((i) => i.empresa).filter(Boolean))].sort(),
    [interacciones]
  );

  const interaccionesFiltradas = useMemo(() => {
    let result = interacciones;

    if (filtroTipo !== "todos") {
      result = result.filter((i) => i.tipo === filtroTipo);
    }
    if (filtroEmpresa !== "todos") {
      result = result.filter((i) => i.empresa === filtroEmpresa);
    }
    result = filtrarPorPeriodo(result, filtroPeriodo);

    return result;
  }, [interacciones, filtroTipo, filtroEmpresa, filtroPeriodo]);

  const hayFiltrosActivos =
    filtroTipo !== "todos" ||
    filtroEmpresa !== "todos" ||
    filtroPeriodo !== "30";

  const limpiarFiltros = () => {
    setFiltroTipo("todos");
    setFiltroEmpresa("todos");
    setFiltroPeriodo("30");
  };

  const handleVerDetalles = (i: Interaccion) => {
    toast.info(
      `${i.titulo} — ${i.empresa} · ${formatFechaHora(i.fecha, i.hora)}`,
      { duration: 3000 }
    );
  };

  const handleAgendarSeguimiento = (interaccion: Interaccion) => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaManana = manana.toISOString().split("T")[0];

    const tipoEvento =
      interaccion.tipo === "Reunión"
        ? "Reunión"
        : interaccion.tipo === "Demo"
          ? "Demo"
          : "Seguimiento";

    setEventoPreCargado({
      titulo: "Seguimiento: " + interaccion.empresa,
      tipo: tipoEvento,
      cliente: interaccion.empresa,
      idLead: interaccion.idLead,
      fecha: fechaManana,
      horaInicio: "09:00",
      horaFin: "10:00",
      descripcion: "Seguimiento de la interacción: " + interaccion.titulo,
    });
    setShowEventoModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1B3A5C]">
            Interacciones
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Historial completo de comunicaciones con clientes
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="rounded-xl bg-[#1B3A5C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#33487A]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Registrar Interacción
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 shrink-0 text-gray-400" />
        <Select
          value={filtroTipo}
          onValueChange={(v) => setFiltroTipo(v ?? "todos")}
        >
          <SelectTrigger className="min-w-[160px] w-fit shrink-0">
            <SelectValue placeholder="Todos los tipos">
              {(val: string | null) =>
                val && val !== "todos" ? val : "Todos los tipos"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {TIPOS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filtroEmpresa}
          onValueChange={(v) => setFiltroEmpresa(v ?? "todos")}
        >
          <SelectTrigger className="min-w-[160px] w-fit shrink-0">
            <SelectValue placeholder="Todos los leads">
              {(val: string | null) =>
                val && val !== "todos" ? val : "Todos los leads"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los leads</SelectItem>
            {empresasUnicas.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filtroPeriodo}
          onValueChange={(v) => setFiltroPeriodo(v ?? "30")}
        >
          <SelectTrigger className="min-w-[160px] w-fit shrink-0">
            <SelectValue placeholder="Últimos 30 días">
              {(val: string | null) =>
                PERIODOS.find((p) => p.value === val)?.label || "Últimos 30 días"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PERIODOS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hayFiltrosActivos && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-red-500"
            onClick={limpiarFiltros}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : interaccionesFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <MessageSquare className="h-16 w-16 text-gray-200" />
          <h2 className="mt-4 text-lg font-semibold text-gray-600">
            Sin interacciones registradas
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Registra la primera comunicación con un cliente
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            className="mt-4 rounded-xl bg-[#1B3A5C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#33487A]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Registrar Interacción
          </Button>
        </div>
      ) : (
        <div className="space-y-0">
          <AnimatePresence mode="popLayout">
            {interaccionesFiltradas.map((interaccion, index) => {
              const tipoConfig = getTipoConfig(interaccion.tipo);
              const Icon = tipoConfig.icon;

              return (
                <motion.div
                  key={interaccion.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.3 }}
                  className={cn(
                    "group flex gap-4 pb-6",
                    index < interaccionesFiltradas.length - 1 &&
                      "mb-6 border-b border-gray-50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white",
                      tipoConfig.bg
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-3 py-0.5 text-xs font-medium",
                            tipoConfig.badge
                          )}
                        >
                          {interaccion.tipo}
                        </span>
                        {interaccion.resultado && (
                          <span
                            className={cn(
                              "rounded-full px-3 py-0.5 text-xs font-medium",
                              getResultadoBadge(interaccion.resultado)
                            )}
                          >
                            {interaccion.resultado}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleAgendarSeguimiento(interaccion)}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#1B3A5C] transition-colors opacity-0 group-hover:opacity-100 hover:text-[#D4881E]"
                        >
                          <CalendarPlus className="h-3.5 w-3.5" />
                          Agendar seguimiento
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerDetalles(interaccion)}
                          className="text-sm font-medium text-[#1B3A5C] hover:underline"
                        >
                          Ver detalles
                        </button>
                      </div>
                    </div>

                    <h3 className="mt-2 text-base font-semibold text-[#1B3A5C]">
                      {interaccion.titulo}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {interaccion.descripcion}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {interaccion.contacto || "-"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {interaccion.empresa || "-"}
                      </span>
                      {interaccion.duracion && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {interaccion.duracion} min
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-gray-400">
                      <span className="font-medium text-gray-500">
                        {interaccion.consultor}
                      </span>
                      {" · "}
                      {formatFechaHora(interaccion.fecha, interaccion.hora)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <NewInteraccionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetchInteracciones();
        }}
      />

      <NewEventoModal
        open={showEventoModal}
        onClose={() => {
          setShowEventoModal(false);
          setEventoPreCargado(null);
        }}
        onSuccess={() => {
          setShowEventoModal(false);
          setEventoPreCargado(null);
          toast.success("Evento creado en tu Google Calendar");
        }}
        datosPreCargados={eventoPreCargado ?? undefined}
        origenInteracciones={!!eventoPreCargado}
      />
    </div>
  );
}
