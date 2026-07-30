"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  X,
  SearchX,
  Building2,
  Mail,
  Phone,
  MoreHorizontal,
  MessageCircle,
  Download,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { LeadDrawer } from "@/components/pipeline/LeadDrawer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NewLeadModal } from "@/components/leads/NewLeadModal";
import { NewProyectoModal } from "@/components/proyectos/NewProyectoModal";
import { LeadCardGrid } from "@/components/leads/LeadCardGrid";
import { ViewToggle, type ViewMode } from "@/components/leads/ViewToggle";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { EstadoSelect } from "@/components/ui/EstadoSelect";
import { calcularTiempoRelativo } from "@/lib/utils";
import { ESTADOS_LEAD, getEstado } from "@/lib/estados";
import { useConsultores } from "@/hooks/useConsultores";
import { toast } from "sonner";
import type { Lead } from "@/types/lead";

const PER_PAGE = 15;

function getScoreBarColor(score: number): string {
  if (score >= 75) return "bg-red-500";
  if (score >= 55) return "bg-orange-500";
  if (score >= 35) return "bg-yellow-500";
  if (score >= 15) return "bg-green-500";
  return "bg-gray-300";
}

function whatsappUrl(whatsapp: string): string {
  const num = (whatsapp || "").replace(/\D/g, "");
  return num ? `https://wa.me/${num}` : "#";
}

function LeadsPageContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroFuente, setFiltroFuente] = useState("all");
  const [page, setPage] = useState(1);
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nuevoLeadOpen, setNuevoLeadOpen] = useState(false);
  const [proyectoModalOpen, setProyectoModalOpen] = useState(false);
  const [proyectoDatosPreCargados, setProyectoDatosPreCargados] = useState<
    { idLead?: string; empresaCliente?: string; contacto?: string; emailCliente?: string; servicioForja?: string; valorUSD?: string; consultor?: string } | undefined
  >(undefined);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"estado" | "consultor" | null>(
    null
  );
  const [editConsultorValue, setEditConsultorValue] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [leadsAEliminar, setLeadsAEliminar] = useState<Lead[] | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const { consultores } = useConsultores();

  const getLeadKey = (l: Lead) => l.id;

  const toggleSeleccion = (key: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const seleccionarTodos = () => {
    if (seleccionados.size === filteredLeads.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(filteredLeads.map((l) => getLeadKey(l))));
    }
  };

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
    } catch {
      setError("No se pudieron cargar los leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    const fuente = searchParams.get("fuente");
    if (fuente === "referido") setFiltroFuente("referido");
  }, [searchParams]);

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          (l.nombreContacto || "").toLowerCase().includes(q) ||
          (l.nombreEmpresa || "").toLowerCase().includes(q) ||
          (l.emailCorporativo || "").toLowerCase().includes(q)
      );
    }

    if (filtroEstado !== "todos") {
      result = result.filter((l) => (l.estadoLead || "NUEVO") === filtroEstado);
    }

    if (filtroFuente !== "all") {
      if (filtroFuente === "referido") {
        result = result.filter((l) => l.comoNosConocio === "referido");
      } else {
        result = result.filter((l) => l.fuenteFormulario === filtroFuente);
      }
    }

    return result;
  }, [leads, search, filtroEstado, filtroFuente]);

  const totalPages = Math.ceil(filteredLeads.length / PER_PAGE);
  const startIdx = (page - 1) * PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIdx, startIdx + PER_PAGE);

  const hasActiveFilters = filtroEstado !== "todos" || filtroFuente !== "all";

  const clearFilters = () => {
    setFiltroEstado("todos");
    setFiltroFuente("all");
    setSearch("");
    setPage(1);
  };

  const handleEstadoChange = async (lead: Lead, nuevoEstado: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id ? { ...l, estadoLead: nuevoEstado } : l
      )
    );
    if (drawerLead?.id === lead.id) {
      setDrawerLead({ ...drawerLead, estadoLead: nuevoEstado });
    }
    setEditingLeadId(null);
    setEditingField(null);
    try {
      const res = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lead.id,
          estadoLead: nuevoEstado,
          consultorAsignado: lead.consultorAsignado || "",
          fechaContacto: lead.fechaContacto || "",
          notas: lead.notas || "",
        }),
      });
      if (res.ok) {
        toast.success("Estado actualizado");
      } else throw new Error("Error");
    } catch {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id ? { ...l, estadoLead: lead.estadoLead } : l
        )
      );
      if (drawerLead?.id === lead.id) {
        setDrawerLead({ ...drawerLead, estadoLead: lead.estadoLead });
      }
      toast.error("Error al actualizar estado");
    }
  };

  const handleConsultorSave = async (lead: Lead) => {
    try {
      const res = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lead.id,
          consultorAsignado: editConsultorValue,
        }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id
              ? { ...l, consultorAsignado: editConsultorValue }
              : l
          )
        );
        if (drawerLead?.id === lead.id) {
          setDrawerLead({ ...drawerLead, consultorAsignado: editConsultorValue });
        }
        setEditingLeadId(null);
        setEditingField(null);
        toast.success("Consultor asignado");
      } else {
        const body = await res.json().catch(() => null);
        toast.error(body?.error || "Error al asignar consultor");
      }
    } catch {
      toast.error("Error al asignar consultor");
    }
  };

  const handleSave = async (
    lead: Lead,
    updates: Partial<Lead>
  ): Promise<void> => {
    const res = await fetch("/api/leads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: lead.id,
        estadoLead: updates.estadoLead,
        consultorAsignado: updates.consultorAsignado,
        fechaContacto: updates.fechaContacto,
        notas: updates.notas,
      }),
    });
    if (!res.ok) throw new Error("Error al guardar");
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id ? { ...l, ...updates } : l
      )
    );
    setDrawerLead((prev) =>
      prev?.id === lead.id && prev
        ? ({ ...prev, ...updates } as Lead)
        : prev
    );
  };

  const openEditEstado = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setEditingField("estado");
  };

  const openEditConsultor = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setEditingField("consultor");
    setEditConsultorValue(lead.consultorAsignado || "");
  };

  const accionMasivaEstado = async (nuevoEstado: string) => {
    const leadsAActualizar = leads.filter((l) =>
      seleccionados.has(getLeadKey(l))
    );
    setLeads((prev) =>
      prev.map((l) =>
        seleccionados.has(getLeadKey(l)) ? { ...l, estadoLead: nuevoEstado } : l
      )
    );
    try {
      await Promise.all(
        leadsAActualizar.map((lead) =>
          fetch("/api/leads", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: lead.id,
              estadoLead: nuevoEstado,
              consultorAsignado: lead.consultorAsignado || "",
              fechaContacto: lead.fechaContacto || "",
              notas: lead.notas || "",
            }),
          })
        )
      );
      toast.success(
        `${leadsAActualizar.length} leads actualizados — Estado: ${getEstado(nuevoEstado).label}`
      );
      setSeleccionados(new Set());
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const accionMasivaConsultor = async (consultor: string) => {
    const leadsAActualizar = leads.filter((l) =>
      seleccionados.has(getLeadKey(l))
    );
    setLeads((prev) =>
      prev.map((l) =>
        seleccionados.has(getLeadKey(l))
          ? { ...l, consultorAsignado: consultor }
          : l
      )
    );
    try {
      await Promise.all(
        leadsAActualizar.map((lead) =>
          fetch("/api/leads", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: lead.id,
              estadoLead: lead.estadoLead,
              consultorAsignado: consultor,
              fechaContacto: lead.fechaContacto || "",
              notas: lead.notas || "",
            }),
          })
        )
      );
      toast.success(`${leadsAActualizar.length} leads reasignados a ${consultor}`);
      setSeleccionados(new Set());
    } catch {
      toast.error("Error al reasignar");
    }
  };

  const handleEliminarConfirmado = async () => {
    if (!leadsAEliminar || leadsAEliminar.length === 0 || eliminando) return;
    setEliminando(true);
    const ids = leadsAEliminar.map((l) => l.id);
    try {
      const res = await fetch("/api/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Error al eliminar");
      }
      setLeads((prev) => prev.filter((l) => !ids.includes(l.id)));
      setSeleccionados((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      if (drawerLead && ids.includes(drawerLead.id)) {
        setDrawerOpen(false);
        setDrawerLead(null);
      }
      toast.success(ids.length > 1 ? `${ids.length} leads eliminados` : "Lead eliminado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    } finally {
      setEliminando(false);
      setLeadsAEliminar(null);
    }
  };

  const exportarSeleccionados = () => {
    const leadsExportar = leads.filter((l) => seleccionados.has(getLeadKey(l)));
    if (leadsExportar.length === 0) return;
    const headers = Object.keys(leadsExportar[0]).join(",");
    const filas = leadsExportar
      .map((l) =>
        Object.values(l)
          .map((v) =>
            typeof v === "string" && v.includes(",") ? `"${v}"` : v
          )
          .join(",")
      )
      .join("\n");
    const csv = headers + "\n" + filas;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arquiron-leads-seleccionados-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${leadsExportar.length} leads exportados`);
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
    <div className="space-y-6">
      {/* Sección 1 — Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1B3A5C]">Leads</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Gestiona tus prospectos y oportunidades
          </p>
        </div>
        <Button
          onClick={() => setNuevoLeadOpen(true)}
          className="rounded-xl bg-[#1B3A5C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B3A5C]/90"
        >
          ＋ Nuevo Lead
        </Button>
      </div>

      {/* Sección 2 — Barra de búsqueda y filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-0 sm:w-[35%]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, empresa o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border-gray-200 pl-9"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={filtroEstado}
            onValueChange={(v) => {
              setFiltroEstado(v ?? "todos");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] rounded-xl border-gray-200">
              <SelectValue placeholder="Todos los estados">
                {(val: string | null) =>
                  val && val !== "todos"
                    ? getEstado(val).label
                    : "Todos los estados"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {ESTADOS_LEAD.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: e.color }}
                    />
                    {e.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filtroFuente}
            onValueChange={(v) => {
              setFiltroFuente(v ?? "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] rounded-xl border-gray-200">
              <SelectValue placeholder="Todas las fuentes">
                {(val: string | null) =>
                  ({
                    Portal_Empresarial: "Portal Web",
                    Evaluacion_Madurez: "Evaluación",
                    referido: "⭐ Referidos",
                  } as Record<string, string>)[val || ""] || "Todas las fuentes"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fuentes</SelectItem>
              <SelectItem value="Portal_Empresarial">Portal Web</SelectItem>
              <SelectItem value="Evaluacion_Madurez">Evaluación</SelectItem>
              <SelectItem value="referido">⭐ Referidos</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-gray-500 hover:text-red-500"
              onClick={clearFilters}
            >
              <X className="mr-1 h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
          <div className="hidden sm:block">
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>
      </div>

      {/* Barra de acciones masivas */}
      <AnimatePresence>
        {seleccionados.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sticky top-16 z-30 mb-3 flex items-center gap-3 rounded-xl bg-[#1B3A5C] px-4 py-3 shadow-lg shadow-[#1B3A5C]/20"
          >
            <span className="shrink-0 text-sm font-semibold text-white">
              {seleccionados.size} lead
              {seleccionados.size > 1 ? "s" : ""} seleccionado
              {seleccionados.size > 1 ? "s" : ""}
            </span>
            <div className="h-5 w-px bg-white/20" />
            <Select
              onValueChange={(val) => {
                if (typeof val === "string") accionMasivaEstado(val);
              }}
            >
              <SelectTrigger className="h-8 min-w-[140px] w-auto rounded-lg border-white/20 bg-white/10 text-xs text-white">
                <SelectValue placeholder="Cambiar estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_LEAD.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: e.color }}
                      />
                      {e.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              onValueChange={(val) => {
                if (typeof val === "string") accionMasivaConsultor(val);
              }}
            >
              <SelectTrigger className="h-8 min-w-[160px] w-auto rounded-lg border-white/20 bg-white/10 text-xs text-white">
                <SelectValue placeholder="Asignar consultor" />
              </SelectTrigger>
              <SelectContent>
                {consultores.map((c) => (
                  <SelectItem key={c.id} value={c.nombre}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={exportarSeleccionados}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-medium text-white transition-colors hover:bg-white/20"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar
            </button>
            {isAdmin && (
              <button
                onClick={() =>
                  setLeadsAEliminar(
                    leads.filter((l) => seleccionados.has(getLeadKey(l)))
                  )
                }
                className="flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-medium text-white transition-colors hover:bg-red-500/80"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            )}
            <button
              onClick={() => setSeleccionados(new Set())}
              className="ml-auto text-white/60 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sección 3 — Tabla */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="overflow-x-auto overflow-hidden rounded-2xl border border-gray-100 bg-white"
      >
        {loading ? (
          <div className="p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-gray-50 py-4 last:border-0"
              >
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <SearchX className="h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-700">No se encontraron leads</p>
            <p className="text-sm text-gray-500">
              Intenta con otros filtros o términos de búsqueda
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        ) : viewMode === "cards" ? (
          <div className="p-4 sm:p-6">
            <LeadCardGrid
              leads={paginatedLeads}
              onEstadoChange={handleEstadoChange}
              onVerDetalle={(lead) => {
                setDrawerLead(lead);
                setDrawerOpen(true);
              }}
            />
          </div>
        ) : (
          <>
            {/* Mobile: la tabla de columnas fijas no cabe en pantallas angostas — se usa la vista de tarjetas */}
            <div className="p-4 sm:hidden">
              <LeadCardGrid
                leads={paginatedLeads}
                onEstadoChange={handleEstadoChange}
                onVerDetalle={(lead) => {
                  setDrawerLead(lead);
                  setDrawerOpen(true);
                }}
              />
            </div>
            <div className="hidden sm:block">
            {/* Header tabla */}
            <div className="grid grid-cols-[40px_1fr_1fr_1.2fr_100px_100px_1fr_120px_60px] gap-4 border-b border-gray-100 px-6 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              <div className="flex items-center pl-1">
                <input
                  type="checkbox"
                  checked={
                    seleccionados.size > 0 &&
                    seleccionados.size === filteredLeads.length
                  }
                  ref={(el) => {
                    if (el)
                      el.indeterminate =
                        seleccionados.size > 0 &&
                        seleccionados.size < filteredLeads.length;
                  }}
                  onChange={seleccionarTodos}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#1B3A5C]"
                />
              </div>
              <div>Lead</div>
              <div>Empresa</div>
              <div>Contacto</div>
              <div>Estado</div>
              <div>Score</div>
              <div>Asignado a</div>
              <div>Última Interacción</div>
              <div />
            </div>

            {/* Filas */}
            {paginatedLeads.map((lead, index) => {
              const score = parseFloat(lead.scoreLead) || 0;
              const isEditingEstado =
                editingLeadId === lead.id && editingField === "estado";
              const isEditingConsultor =
                editingLeadId === lead.id && editingField === "consultor";
              const rowBorder =
                score >= 75
                  ? "border-l-4 border-l-red-400"
                  : score >= 55 && score < 75
                    ? "border-l-4 border-l-orange-400"
                    : "";

              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  className={`group cursor-pointer border-b border-gray-50 px-6 py-4 transition-colors hover:bg-gray-50/50 ${rowBorder}`}
                  onClick={() => {
                    setDrawerLead(lead);
                    setDrawerOpen(true);
                  }}
                >
                  <div className="grid grid-cols-[40px_1fr_1fr_1.2fr_100px_100px_1fr_120px_60px] items-center gap-4">
                    <div
                      className="flex items-center pl-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={seleccionados.has(getLeadKey(lead))}
                        onChange={() => toggleSeleccion(getLeadKey(lead))}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#1B3A5C]"
                      />
                    </div>
                    {/* Lead */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#1B3A5C]">
                          {lead.nombreContacto || "-"}
                        </p>
                        {lead.comoNosConocio === "referido" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200">
                            ⭐ Referido
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{lead.cargo || "-"}</p>
                    </div>

                    {/* Empresa */}
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {lead.nombreEmpresa || "-"}
                      </span>
                    </div>

                    {/* Contacto */}
                    <div className="space-y-1">
                      {lead.emailCorporativo && (
                        <a
                          href={`mailto:${lead.emailCorporativo}`}
                          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#1B3A5C]"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {lead.emailCorporativo}
                        </a>
                      )}
                      {lead.whatsapp && (
                        <a
                          href={whatsappUrl(lead.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#1B3A5C]"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {lead.whatsapp}
                        </a>
                      )}
                      {!lead.emailCorporativo && !lead.whatsapp && "-"}
                    </div>

                    {/* Estado */}
                    <div>
                      {isEditingEstado ? (
                        <EstadoSelect
                          value={lead.estadoLead || "NUEVO"}
                          onChange={(v) => handleEstadoChange(lead, v)}
                          className="h-7 border-0 shadow-none text-xs"
                        />
                      ) : (
                        <EstadoBadge
                          estado={lead.estadoLead || "NUEVO"}
                          size="sm"
                        />
                      )}
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${getScoreBarColor(score)}`}
                          style={{
                            width: `${Math.min(100, score)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-[#1B3A5C]">
                        {score || 0}
                      </span>
                    </div>

                    {/* Asignado a */}
                    <div>
                      {isEditingConsultor ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editConsultorValue}
                            onChange={(e) =>
                              setEditConsultorValue(e.target.value)
                            }
                            className="h-8 text-sm"
                            placeholder="Nombre consultor"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleConsultorSave(lead);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => handleConsultorSave(lead)}
                          >
                            Guardar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-700">
                          {lead.consultorAsignado || "Sin asignar"}
                        </span>
                      )}
                    </div>

                    {/* Última Interacción */}
                    <div className="text-sm text-gray-400">
                      {(lead.estadoLead || "NUEVO") === "NUEVO" &&
                      !lead.fechaContacto
                        ? "Nunca"
                        : calcularTiempoRelativo(
                            lead.fechaContacto || lead.timestamp || ""
                          )}
                    </div>

                    {/* Acciones */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex justify-end"
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            />
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setDrawerLead(lead);
                              setDrawerOpen(true);
                            }}
                          >
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditEstado(lead)}
                          >
                            Editar estado
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Contactar</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(
                                    whatsappUrl(lead.whatsapp),
                                    "_blank"
                                  )
                                }
                              >
                                <MessageCircle className="mr-2 h-4 w-4" />
                                WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.location.assign(
                                    `mailto:${lead.emailCorporativo}`
                                  )
                                }
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Email
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openEditConsultor(lead)}
                          >
                            Asignar consultor
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setLeadsAEliminar([lead])}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </div>
          </>
        )}

        {/* Paginación */}
        {!loading && filteredLeads.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-sm text-gray-600">
              Mostrando {startIdx + 1}-
              {Math.min(startIdx + PER_PAGE, filteredLeads.length)} de{" "}
              {filteredLeads.length} leads
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      <NewLeadModal
        open={nuevoLeadOpen}
        onClose={() => setNuevoLeadOpen(false)}
        onSuccess={() => {
          setNuevoLeadOpen(false);
          fetchLeads();
        }}
      />

      <LeadDrawer
        lead={drawerLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleSave}
        onCrearProyecto={(lead) => {
          setProyectoDatosPreCargados({
            idLead: lead.id,
            empresaCliente: lead.nombreEmpresa,
            contacto: lead.nombreContacto || undefined,
            emailCliente: lead.emailCorporativo || undefined,
            servicioForja: lead.servicioSugeridoForja || undefined,
            consultor: lead.consultorAsignado || undefined,
          });
          setProyectoModalOpen(true);
        }}
      />

      <NewProyectoModal
        open={proyectoModalOpen}
        onClose={() => setProyectoModalOpen(false)}
        onSuccess={() => {
          setProyectoModalOpen(false);
          setProyectoDatosPreCargados(undefined);
        }}
        datosPreCargados={proyectoDatosPreCargados}
      />

      <ConfirmDialog
        open={leadsAEliminar !== null}
        title={
          leadsAEliminar && leadsAEliminar.length > 1
            ? `¿Eliminar ${leadsAEliminar.length} leads?`
            : "¿Eliminar este lead?"
        }
        description={
          leadsAEliminar && leadsAEliminar.length > 1
            ? "Esta acción no se puede deshacer. Los proyectos o propuestas ya vinculados a estos leads no se eliminan, pero quedarán sin lead asociado."
            : `Esta acción no se puede deshacer${leadsAEliminar?.[0]?.nombreContacto ? ` (${leadsAEliminar[0].nombreContacto})` : ""}. Si este lead tiene un proyecto o propuesta vinculados, quedarán sin lead asociado.`
        }
        confirmLabel={eliminando ? "Eliminando..." : "Eliminar"}
        cancelLabel="Cancelar"
        accentColor="#ef4444"
        onConfirm={handleEliminarConfirmado}
        onCancel={() => setLeadsAEliminar(null)}
      />
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[400px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1B3A5C] border-t-transparent" /></div>}>
      <LeadsPageContent />
    </Suspense>
  );
}
