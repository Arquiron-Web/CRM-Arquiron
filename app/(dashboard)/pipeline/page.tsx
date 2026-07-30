"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { LeadDrawer } from "@/components/pipeline/LeadDrawer";
import { NewDealModal } from "@/components/pipeline/NewDealModal";
import { NewProyectoModal } from "@/components/proyectos/NewProyectoModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calcularTiempoRelativo } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getEstado } from "@/lib/estados";
import type { Lead } from "@/types/lead";

const VALOR_POR_TAMANO: Record<string, number> = {
  micro: 5000,
  pequena: 15000,
  mediana: 35000,
  grande: 80000,
};

const COLUMNAS_KANBAN = [
  {
    id: "col-prospeccion",
    nombre: "Prospección",
    estados: ["NUEVO", "CONTACTADO"],
    color: "#3b82f6",
  },
  {
    id: "col-calificacion",
    nombre: "Calificación",
    estados: ["CALIFICADO"],
    color: "#D4881E",
  },
  {
    id: "col-propuesta",
    nombre: "Propuesta",
    estados: ["PROPUESTA"],
    color: "#eab308",
  },
  {
    id: "col-negociacion",
    nombre: "Negociación",
    estados: ["NEGOCIACION"],
    color: "#f97316",
  },
  {
    id: "col-ganado",
    nombre: "Ganado",
    estados: ["GANADO"],
    color: "#22c55e",
  },
  {
    id: "col-espera",
    nombre: "En Espera",
    estados: ["EN_ESPERA"],
    color: "#9ca3af",
  },
] as const;

function getLeadsPorColumna(
  columna: (typeof COLUMNAS_KANBAN)[number],
  leads: Lead[]
): Lead[] {
  const estados = columna.estados as readonly string[];
  return leads.filter((l) => estados.includes(l.estadoLead || "NUEVO"));
}

function getLeadId(lead: Lead): string {
  return lead.id;
}

function getValorLead(lead: Lead): number {
  const valorIngreso = parseFloat(lead.ingresoAnual);
  if (!isNaN(valorIngreso) && valorIngreso > 0) {
    return valorIngreso;
  }
  const tamano = (lead.tamano || "").toLowerCase().trim();
  return VALOR_POR_TAMANO[tamano] ?? 10000;
}

function getTituloDeal(lead: Lead): string {
  return lead.servicioSugeridoForja || lead.nombreEmpresa || "-";
}

function getDiasDesdeRegistro(timestamp: string): number {
  if (!timestamp) return 0;
  const fecha = new Date(timestamp);
  const ahora = new Date();
  return Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
}

function KanbanCardContent({ lead }: { lead: Lead }) {
  const valor = getValorLead(lead);
  const probabilidad = lead.scoreLead || "0";
  const dias = getDiasDesdeRegistro(lead.timestamp);

  return (
    <>
      <p className="text-sm font-semibold leading-tight text-[#1B3A5C]">
        {getTituloDeal(lead)}
      </p>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
        <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        {lead.nombreEmpresa || "-"}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
          <DollarSign className="h-3.5 w-3.5 text-green-500" />
          ${valor.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[#4CCED5]/15 px-2.5 py-1 text-xs font-semibold text-[#1B3A5C]">
          <TrendingUp className="h-3 w-3" />
          {probabilidad}%
        </span>
      </div>
      <div className="my-3 border-t border-gray-50" />
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Clock className="h-3 w-3 shrink-0 text-gray-400" />
        {dias}d en etapa
        <span className="text-gray-300">·</span>
        {calcularTiempoRelativo(lead.timestamp)}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B3A5C] text-xs font-bold text-white">
          {(lead.consultorAsignado || "?").charAt(0).toUpperCase()}
        </div>
        <span className="text-xs text-gray-600">
          {lead.consultorAsignado || "Sin asignar"}
        </span>
      </div>
    </>
  );
}

function DraggableCard({
  lead,
  onClick,
}: {
  lead: Lead;
  onClick: () => void;
}) {
  const id = getLeadId(lead);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "cursor-grab active:cursor-grabbing rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:shadow-md",
        isDragging && "opacity-40 shadow-2xl scale-105 rotate-1"
      )}
    >
      <KanbanCardContent lead={lead} />
    </div>
  );
}

function KanbanColumn({
  columna,
  leads,
  onCardClick,
}: {
  columna: (typeof COLUMNAS_KANBAN)[number];
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columna.id });
  const valorTotal = leads.reduce((sum, l) => sum + getValorLead(l), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-[300px] max-w-[300px] shrink-0 flex-col rounded-2xl p-3 transition-colors duration-150",
        isOver ? "bg-[#1B3A5C]/8 border-2 border-[#1B3A5C]/30" : "bg-gray-50/50"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: columna.color }}
          />
          <span className="text-base font-semibold text-[#1B3A5C]">
            {columna.nombre}
          </span>
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: "#4CCED5" }}
          >
            {leads.length}
          </span>
        </div>
        <span className="text-sm font-semibold text-gray-500">
          ${(valorTotal / 1000).toFixed(0)}k
        </span>
      </div>

      <div
        className="flex max-h-[calc(100vh-240px)] flex-1 flex-col gap-3 overflow-y-auto"
        style={{ minHeight: "200px" }}
      >
        {leads.map((lead, index) => (
          <motion.div
            key={getLeadId(lead)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
          >
            <DraggableCard lead={lead} onClick={() => onCardClick(lead)} />
          </motion.div>
        ))}
        {leads.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-xs text-gray-400">Arrastra aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [proyectoModalOpen, setProyectoModalOpen] = useState(false);
  const [proyectoDatosPreCargados, setProyectoDatosPreCargados] = useState<
    { idLead?: string; empresaCliente?: string; contacto?: string; emailCliente?: string; servicioForja?: string; valorUSD?: string; consultor?: string } | undefined
  >(undefined);
  const [filtroConsultor, setFiltroConsultor] = useState<string>("todos");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

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
      setError("No se pudieron cargar los leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const leadsFiltrados = useMemo(() => {
    const sinPerdidos = leads.filter((l) => (l.estadoLead || "NUEVO") !== "PERDIDO");
    if (filtroConsultor === "todos") return sinPerdidos;
    return sinPerdidos.filter(
      (l) => (l.consultorAsignado || "").trim() === filtroConsultor
    );
  }, [leads, filtroConsultor]);

  const metricas = useMemo(() => {
    const activos = leadsFiltrados.filter(
      (l) => !["GANADO", "PERDIDO"].includes(l.estadoLead || "NUEVO")
    );
    const valorTotal = activos.reduce((sum, l) => sum + getValorLead(l), 0);
    const ganados = leadsFiltrados.filter((l) => (l.estadoLead || "NUEVO") === "GANADO");
    const total = leadsFiltrados.length;
    const tasaConversion = total > 0 ? ((ganados.length / total) * 100).toFixed(1) : "0";
    return { totalActivos: activos.length, valorTotal, tasaConversion };
  }, [leadsFiltrados]);

  const consultores = useMemo(
    () => [...new Set(leads.map((l) => l.consultorAsignado).filter(Boolean))] as string[],
    [leads]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const lead = leads.find((l) => getLeadId(l) === active.id);
    setActiveLead(lead || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveLead(null);

    if (!over) return;

    const overId = over.id as string;
    const columnaDestino = COLUMNAS_KANBAN.find((col) => {
      if (col.id === overId) return true;
      const leadsColumna = getLeadsPorColumna(col, leadsFiltrados);
      return leadsColumna.some((l) => getLeadId(l) === overId);
    });
    if (!columnaDestino) return;

    const leadArrastrado = leads.find((l) => getLeadId(l) === active.id);
    if (!leadArrastrado) return;

    let nuevoEstado: string = columnaDestino.estados[0];
    if (
      columnaDestino.nombre === "Prospección" &&
      (leadArrastrado.estadoLead || "NUEVO") !== "NUEVO"
    ) {
      nuevoEstado = "CONTACTADO";
    }

    if ((leadArrastrado.estadoLead || "NUEVO") === nuevoEstado) return;

    const estadoAnterior = leadArrastrado.estadoLead || "NUEVO";
    setLeads((prev) =>
      prev.map((l) =>
        getLeadId(l) === active.id ? { ...l, estadoLead: nuevoEstado } : l
      )
    );

    const estadoObj = getEstado(nuevoEstado);
    toast.success(
      `${leadArrastrado.nombreEmpresa || "Deal"} → ${estadoObj.label}`
    );

    try {
      const res = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leadArrastrado.id,
          estadoLead: nuevoEstado,
          consultorAsignado: leadArrastrado.consultorAsignado || "",
          fechaContacto: leadArrastrado.fechaContacto || "",
          notas: leadArrastrado.notas || "",
        }),
      });
      if (!res.ok) throw new Error("Error");
    } catch {
      setLeads((prev) =>
        prev.map((l) =>
          getLeadId(l) === active.id ? { ...l, estadoLead: estadoAnterior } : l
        )
      );
      toast.error("No se pudo actualizar el estado. Intenta de nuevo.");
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1B3A5C]">Pipeline</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Gestiona tus deals a través del embudo de ventas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={filtroConsultor}
            onValueChange={(v) => setFiltroConsultor(v ?? "todos")}
          >
            <SelectTrigger className="min-w-[200px] w-[200px] shrink-0 rounded-xl border-gray-200">
              <SelectValue placeholder="Filtrar por vendedor">
                {(val: string | null) =>
                  val && val !== "todos" ? val : "Todos los deals"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" sideOffset={4}>
              <SelectItem value="todos">Todos los deals</SelectItem>
              {consultores.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setNewDealOpen(true)}
            className="rounded-xl bg-[#1B3A5C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#33487A]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Deal
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 bg-white px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Total deals activos</span>
          <span className="font-semibold text-[#1B3A5C]">
            {loading ? "-" : metricas.totalActivos}
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Valor total pipeline</span>
          <span className="font-semibold text-[#1B3A5C]">
            {loading ? "-" : `$${(metricas.valorTotal / 1000).toFixed(0)}k`}
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Tasa de conversión estimada</span>
          <span className="font-semibold text-[#1B3A5C]">
            {loading ? "-" : `${metricas.tasaConversion}%`}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton
              key={i}
              className="h-[400px] min-w-[300px] max-w-[300px] rounded-2xl"
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200">
            {COLUMNAS_KANBAN.map((columna, colIndex) => {
              const leadsColumna = getLeadsPorColumna(columna, leadsFiltrados);
              return (
                <motion.div
                  key={columna.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIndex * 0.1, duration: 0.3 }}
                >
                  <KanbanColumn
                    columna={columna}
                    leads={leadsColumna}
                    onCardClick={(lead) => {
                      setDrawerLead(lead);
                      setDrawerOpen(true);
                    }}
                  />
                </motion.div>
              );
            })}
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="cursor-grabbing rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl rotate-2 scale-105">
                <p className="text-sm font-semibold text-[#1B3A5C]">
                  {getTituloDeal(activeLead)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {activeLead.nombreEmpresa}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <NewDealModal
        open={newDealOpen}
        onClose={() => setNewDealOpen(false)}
        onSuccess={() => {
          setNewDealOpen(false);
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
    </div>
  );
}
