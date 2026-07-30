"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  RefreshCw,
  CheckSquare,
  DollarSign,
  MoreHorizontal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadSelect } from "@/components/ui/LeadSelect";
import { ConsultorSelect } from "@/components/ui/ConsultorSelect";
import { TIPOS_TAREA, PRIORIDADES_TAREA } from "@/types/tarea";
import type { Lead } from "@/types/lead";
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

interface NewTareaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  datosPreCargados?: Partial<{
    relacionadoCon: string;
    idReferencia: string;
    empresa: string;
    asignadoA: string;
  }>;
}

export function NewTareaModal({
  open,
  onClose,
  onSuccess,
  datosPreCargados,
}: NewTareaModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("");
  const [prioridad, setPrioridad] = useState("media");
  const [asignadoA, setAsignadoA] = useState(session?.user?.name || "");
  const [relacionadoCon, setRelacionadoCon] = useState("");
  const [idReferencia, setIdReferencia] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [leadSeleccionadoId, setLeadSeleccionadoId] = useState("");
  const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [hora, setHora] = useState("");
  const [proyectos, setProyectos] = useState<{ id: string; nombre: string; empresaCliente: string }[]>([]);

  const mañana = (() => {
    const m = new Date();
    m.setDate(m.getDate() + 1);
    return m.toISOString().split("T")[0];
  })();

  useEffect(() => {
    if (open && datosPreCargados) {
      const rel = datosPreCargados.relacionadoCon || "";
      const idRef = datosPreCargados.idReferencia || "";
      setRelacionadoCon(rel);
      setIdReferencia(idRef);
      if (rel === "Lead") setLeadSeleccionadoId(idRef);
      if (rel === "Proyecto") setProyectoSeleccionadoId(idRef);
      setEmpresa(datosPreCargados.empresa || "");
      setAsignadoA(datosPreCargados.asignadoA || session?.user?.name || "");
    }
  }, [open, datosPreCargados, session?.user?.name]);

  useEffect(() => {
    if (open) {
      setAsignadoA(session?.user?.name || "");
      setFechaVencimiento(mañana);
    }
  }, [open, session?.user?.name, mañana]);

  useEffect(() => {
    if (relacionadoCon === "Proyecto" && open) {
      fetch("/api/proyectos")
        .then((r) => r.json())
        .then((data) => {
          const arr = Array.isArray(data) ? data : [];
          setProyectos(
            arr
              .filter((p: { estadoProyecto?: string }) => p.estadoProyecto !== "COMPLETADO" && p.estadoProyecto !== "CANCELADO")
              .map((p: { id?: string; nombre?: string; empresaCliente?: string }) => ({
                id: p.id || "",
                nombre: p.nombre || p.empresaCliente || "-",
                empresaCliente: p.empresaCliente || "",
              }))
          );
        })
        .catch(() => setProyectos([]));
    }
  }, [relacionadoCon, open]);

  const handleLeadSelect = (lead: Lead | null) => {
    if (!lead) {
      setLeadSeleccionadoId("");
      setIdReferencia("");
      setEmpresa("");
      return;
    }
    setLeadSeleccionadoId(lead.id || lead.emailCorporativo || "");
    setIdReferencia(lead.id || lead.emailCorporativo || "");
    setEmpresa(lead.nombreEmpresa || "");
  };

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setTipo("");
    setPrioridad("media");
    setAsignadoA(session?.user?.name || "");
    setRelacionadoCon("");
    setIdReferencia("");
    setEmpresa("");
    setLeadSeleccionadoId("");
    setProyectoSeleccionadoId("");
    setFechaVencimiento(mañana);
    setHora("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    if (!fechaVencimiento) {
      toast.error("La fecha de vencimiento es obligatoria");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          tipo: tipo || undefined,
          prioridad,
          asignadoA,
          relacionadoCon: relacionadoCon || undefined,
          idReferencia: relacionadoCon === "Lead" ? idReferencia : relacionadoCon === "Proyecto" ? proyectoSeleccionadoId : undefined,
          empresa: empresa || undefined,
          fechaVencimiento,
          hora: hora || undefined,
          creadaPor: session?.user?.name || "",
        }),
      });
      if (!res.ok) throw new Error("Error al crear");
      toast.success("Tarea creada ✓");
      handleClose();
      onSuccess();
    } catch {
      toast.error("Error al crear la tarea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="!max-w-[620px] w-[88vw] flex flex-col gap-0 overflow-hidden rounded-2xl p-0 max-h-[88vh]"
        showCloseButton
      >
        <div
          className="h-1 w-full shrink-0 rounded-t-2xl"
          style={{
            background: "linear-gradient(90deg, #4CCED5, #1B3A5C)",
          }}
        />
        <div className="shrink-0 border-b border-gray-100 px-8 pt-6 pb-4">
          <h2 className="text-xl font-bold leading-tight text-[#1B3A5C]">
            Nueva Tarea
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div>
            <Label>Título *</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="ej. Llamar a TechStart para seguimiento"
              className="mt-1 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v ?? "")}>
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue placeholder="Seleccionar tipo">
                    {(val: string | null) =>
                      TIPOS_TAREA.find((t) => t.value === val)?.label || "Seleccionar tipo"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_TAREA.map((t) => {
                    const Icon = TIPO_ICONS[t.icon] || MoreHorizontal;
                    return (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <span style={{ color: t.color }}>
                          <Icon className="h-4 w-4" />
                        </span>
                        {t.label}
                      </span>
                    </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridad</Label>
              <Select value={prioridad} onValueChange={(v) => setPrioridad(v ?? "media")}>
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue placeholder="Seleccionar prioridad">
                    {(val: string | null) =>
                      PRIORIDADES_TAREA.find((p) => p.value === val)?.label || "Seleccionar prioridad"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES_TAREA.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Asignar a</Label>
            <ConsultorSelect
              value={asignadoA}
              onChange={(v) => setAsignadoA(v)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Relacionado con</Label>
            <Select value={relacionadoCon} onValueChange={(v) => setRelacionadoCon(v ?? "")}>
              <SelectTrigger className="mt-1 rounded-xl">
                <SelectValue placeholder="Sin relación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin relación</SelectItem>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Proyecto">Proyecto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {relacionadoCon === "Lead" && (
            <div>
              <Label>Lead</Label>
              <LeadSelect
                value={leadSeleccionadoId}
                onChange={handleLeadSelect}
                className="mt-1"
              />
            </div>
          )}

          {relacionadoCon === "Proyecto" && (
            <div>
              <Label>Proyecto</Label>
              <Select
                value={proyectoSeleccionadoId}
                onValueChange={(v) => {
                  setProyectoSeleccionadoId(v ?? "");
                  const p = proyectos.find((x) => x.id === v);
                  if (p) setEmpresa(p.empresaCliente);
                }}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue placeholder="Seleccionar proyecto">
                    {(val: string | null) => {
                      const p = proyectos.find((x) => x.id === val);
                      return p ? `${p.nombre}${p.empresaCliente ? ` — ${p.empresaCliente}` : ""}` : "Seleccionar proyecto";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {proyectos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.empresaCliente ? `— ${p.empresaCliente}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha vencimiento *</Label>
              <Input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label>Hora</Label>
              <Input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                placeholder="09:00 (opcional)"
                className="mt-1 rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles adicionales o contexto..."
              rows={3}
              className="mt-1 resize-none rounded-xl"
            />
          </div>

        </div>
        <div className="shrink-0 flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-white px-8 py-4">
          <Button type="button" variant="outline" onClick={handleClose} className="rounded-xl border-gray-200 px-6 py-2.5 text-sm font-medium hover:bg-gray-50">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#1B3A5C] px-7 py-2.5 text-sm font-semibold text-white hover:bg-[#33487A] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? "Creando..." : "Crear tarea"}
          </Button>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
