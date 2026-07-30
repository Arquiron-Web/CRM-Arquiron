"use client";

import { useState, useEffect } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TIPOS_TAREA,
  PRIORIDADES_TAREA,
  ESTADOS_TAREA,
} from "@/types/tarea";
import type { Tarea } from "@/types/tarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  User,
  Calendar,
  Building2,
  Link2,
  CheckCircle2,
} from "lucide-react";

interface TareaDrawerProps {
  tarea: Tarea | null;
  open: boolean;
  onClose: () => void;
  onSave: (tarea: Tarea, updates: Partial<Tarea>) => void;
}

function getPrioridad(prioridad: string) {
  return (
    PRIORIDADES_TAREA.find((p) => p.value === prioridad) ||
    PRIORIDADES_TAREA[2]
  );
}

function getTipoColor(tipo: string): string {
  return TIPOS_TAREA.find((t) => t.value === tipo)?.color ?? "#9ca3af";
}

function formatearFechaHora(t: Tarea): string {
  if (!t.fechaVencimiento) return "Sin fecha";
  try {
    const d = new Date(t.fechaVencimiento + "T12:00:00");
    const str = d.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return t.hora ? `${str} · ${t.hora}` : str;
  } catch {
    return t.fechaVencimiento;
  }
}

function estaVencida(t: Tarea): boolean {
  if (!t.fechaVencimiento || ["COMPLETADA", "CANCELADA"].includes(t.estado))
    return false;
  return new Date(t.fechaVencimiento) < new Date();
}

export function TareaDrawer({
  tarea,
  open,
  onClose,
  onSave,
}: TareaDrawerProps) {
  const [estadoLocal, setEstadoLocal] = useState(tarea?.estado ?? "");
  const [prioridadLocal, setPrioridadLocal] = useState(tarea?.prioridad ?? "");
  const [fechaLocal, setFechaLocal] = useState("");
  const [horaLocal, setHoraLocal] = useState("");
  const [descripcionLocal, setDescripcionLocal] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (tarea) {
      setEstadoLocal(tarea.estado);
      setPrioridadLocal(tarea.prioridad);
      setFechaLocal((tarea.fechaVencimiento || "").split("T")[0] || "");
      setHoraLocal(tarea.hora || "");
      setDescripcionLocal(tarea.descripcion || "");
    }
  }, [tarea]);

  if (!tarea) return null;

  const handleCompletar = async () => {
    try {
      const res = await fetch("/api/tareas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tarea, estado: "COMPLETADA" }),
      });
      if (!res.ok) throw new Error("Error");
      onSave(tarea, { estado: "COMPLETADA", completadaEn: new Date().toISOString() });
      toast.success("Tarea completada ✓");
      onClose();
    } catch {
      toast.error("Error al completar");
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const res = await fetch("/api/tareas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tarea,
          estado: estadoLocal,
          prioridad: prioridadLocal,
          fechaVencimiento: fechaLocal || tarea.fechaVencimiento,
          hora: horaLocal || tarea.hora,
          descripcion: descripcionLocal || tarea.descripcion,
        }),
      });
      if (!res.ok) throw new Error("Error");
      onSave(tarea, {
        estado: estadoLocal,
        prioridad: prioridadLocal,
        fechaVencimiento: fechaLocal || tarea.fechaVencimiento,
        hora: horaLocal || tarea.hora,
        descripcion: descripcionLocal || tarea.descripcion,
      });
      toast.success("Tarea actualizada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={tarea.titulo}
      subtitle={`${TIPOS_TAREA.find((t) => t.value === tarea.tipo)?.label ?? tarea.tipo} · ${tarea.empresa || "Sin empresa"}`}
      size="lg"
      accentColor={getPrioridad(tarea.prioridad).color}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cerrar
          </button>
          {tarea.estado !== "COMPLETADA" && (
            <button
              onClick={handleCompletar}
              className="flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-600"
            >
              <CheckCircle2 className="h-4 w-4" />
              Completar
            </button>
          )}
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="rounded-xl bg-[#1B3A5C] px-7 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#33487A] disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </>
      }
    >
      <div className="space-y-5 px-8 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-bold",
              getPrioridad(tarea.prioridad).bgClass,
              getPrioridad(tarea.prioridad).textClass
            )}
          >
            {getPrioridad(tarea.prioridad).label}
          </span>
          <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600">
            {tarea.estado}
          </span>
          <span
            className="rounded-full border px-3 py-1.5 text-xs font-bold"
            style={{
              background: getTipoColor(tarea.tipo) + "15",
              color: getTipoColor(tarea.tipo),
              borderColor: getTipoColor(tarea.tipo) + "30",
            }}
          >
            {TIPOS_TAREA.find((t) => t.value === tarea.tipo)?.label ?? tarea.tipo}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: User,
              label: "Asignado a",
              value: tarea.asignadoA || "Sin asignar",
              isRed: false,
            },
            {
              icon: Calendar,
              label: "Vence el",
              value: formatearFechaHora(tarea),
              isRed: estaVencida(tarea),
            },
            {
              icon: Building2,
              label: "Empresa",
              value: tarea.empresa || "—",
              isRed: false,
            },
            {
              icon: Link2,
              label: "Relacionado",
              value: tarea.relacionadoCon || "—",
              isRed: false,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">{item.label}</p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    item.isRed ? "text-red-500" : "text-[#1B3A5C]"
                  )}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {tarea.descripcion && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
            <p className="mb-1 text-xs font-semibold text-blue-400">
              Descripción
            </p>
            <p className="text-sm leading-relaxed text-[#1B3A5C]">
              {tarea.descripcion}
            </p>
          </div>
        )}

        <div className="space-y-4 border-t border-gray-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Actualizar tarea
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">
                Estado
              </label>
              <Select
                  value={estadoLocal}
                  onValueChange={(v) => setEstadoLocal(v ?? "")}
                >
                <SelectTrigger className="rounded-xl border-gray-200 text-sm">
                  <SelectValue placeholder="Seleccionar estado">
                    {(val: string | null) =>
                      ESTADOS_TAREA.find((e) => e.value === val)?.label || "Seleccionar estado"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_TAREA.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">
                Prioridad
              </label>
              <Select
                  value={prioridadLocal}
                  onValueChange={(v) => setPrioridadLocal(v ?? "")}
                >
                <SelectTrigger className="rounded-xl border-gray-200 text-sm">
                  <SelectValue placeholder="Seleccionar prioridad">
                    {(val: string | null) =>
                      PRIORIDADES_TAREA.find((p) => p.value === val)?.label || "Seleccionar prioridad"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES_TAREA.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: p.color }}
                        />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">
                Nueva fecha
              </label>
              <input
                type="date"
                value={fechaLocal}
                onChange={(e) => setFechaLocal(e.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">
                Hora
              </label>
              <input
                type="time"
                value={horaLocal}
                onChange={(e) => setHoraLocal(e.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">
              Descripción / notas
            </label>
            <textarea
              value={descripcionLocal}
              onChange={(e) => setDescripcionLocal(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
