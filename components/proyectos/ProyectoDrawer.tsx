"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ModalShell } from "@/components/ui/ModalShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ETAPAS_FORJA,
  ESTADOS_PAGO,
  ESTADOS_PROYECTO,
} from "@/types/proyecto";
import type { Proyecto } from "@/types/proyecto";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Check,
  Plus,
  User,
  DollarSign,
  CalendarDays,
  Target,
  Package,
  ArrowRight,
  CheckCircle2,
  Building2,
  Briefcase,
} from "lucide-react";
import { NewTareaModal } from "@/components/tareas/NewTareaModal";
import type { Tarea } from "@/types/tarea";
import { ConsultorSelect } from "@/components/ui/ConsultorSelect";

interface ProyectoDrawerProps {
  proyecto: Proyecto | null;
  open: boolean;
  onClose: () => void;
  onSave: (proyecto: Proyecto, updates: Partial<Proyecto>) => void;
  onSuccess?: () => void;
}

function getEtapaOrden(etapa: string): number {
  const e = ETAPAS_FORJA.find(
    (x) => x.nombre.toLowerCase() === etapa?.toLowerCase()
  );
  return e?.orden ?? 0;
}

function getSiguienteEtapa(etapa: string): string {
  const idx = ETAPAS_FORJA.findIndex(
    (e) => e.nombre.toLowerCase() === etapa?.toLowerCase()
  );
  if (idx >= 0 && idx < ETAPAS_FORJA.length - 1) {
    return ETAPAS_FORJA[idx + 1].nombre;
  }
  return "";
}

function getLabelPago(estadoPago: string): string {
  return ESTADOS_PAGO.find((e) => e.value === estadoPago)?.label ?? estadoPago;
}

function formatearFecha(f: string): string {
  if (!f) return "—";
  try {
    return new Date(f + "T12:00:00").toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return f;
  }
}

export function ProyectoDrawer({
  proyecto,
  open,
  onClose,
  onSave,
  onSuccess,
}: ProyectoDrawerProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Proyecto>>({});
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [tareasDelProyecto, setTareasDelProyecto] = useState<Tarea[]>([]);
  const [showTareaModal, setShowTareaModal] = useState(false);
  const [showNPSModal, setShowNPSModal] = useState(false);
  const [npsScoreLocal, setNpsScoreLocal] = useState<number | null>(null);
  const [npsComentarioLocal, setNpsComentarioLocal] = useState("");
  const [guardandoNPS, setGuardandoNPS] = useState(false);
  const [enviandoNPS, setEnviandoNPS] = useState(false);

  useEffect(() => {
    if (!proyecto?.id || !open) return;
    fetch("/api/tareas")
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setTareasDelProyecto(
          arr.filter(
            (t: Tarea) =>
              t.relacionadoCon === "Proyecto" &&
              t.idReferencia === proyecto.id &&
              !["COMPLETADA", "CANCELADA"].includes(t.estado)
          )
        );
      })
      .catch(() => setTareasDelProyecto([]));
  }, [proyecto?.id, open]);

  const npsScore =
    proyecto?.npsScore != null
      ? parseInt(proyecto.npsScore, 10)
      : null;
  const npsDateSaved = proyecto?.npsDateSaved ?? "";
  const npsComment = proyecto?.npsComment ?? "";
  const tieneNPS =
    npsScore !== null && !Number.isNaN(npsScore);

  const handleEnviarEmailNPS = async () => {
    if (!proyecto) return;
    setEnviandoNPS(true);
    try {
      await fetch("/api/nps/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyecto }),
      });
      toast.success("Email NPS enviado a " + proyecto.emailCliente);
    } catch {
      toast.error("Error al enviar email");
    } finally {
      setEnviandoNPS(false);
    }
  };

  const handleGuardarNPS = async () => {
    if (npsScoreLocal === null || !proyecto) return;
    setGuardandoNPS(true);
    const fecha = new Date().toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    try {
      await fetch("/api/proyectos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: proyecto.id,
          soloNPS: true,
          npsScore: npsScoreLocal,
          npsDateSaved: fecha,
          npsComentario: npsComentarioLocal,
        }),
      });
      toast.success(`NPS registrado: ${npsScoreLocal}/10`);
      setShowNPSModal(false);
      setNpsScoreLocal(null);
      setNpsComentarioLocal("");
      onSave(proyecto, {
        npsScore: String(npsScoreLocal),
        npsDateSaved: fecha,
        npsComment: npsComentarioLocal,
      });
      onSuccess?.();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setGuardandoNPS(false);
    }
  };

  if (!proyecto) return null;

  const etapaActual = ETAPAS_FORJA.find(
    (x) => x.nombre.toLowerCase() === proyecto.etapaForja?.toLowerCase()
  );
  const merged = { ...proyecto, ...form };
  const estProy =
    ESTADOS_PROYECTO.find((e) => e.value === merged.estadoProyecto) ||
    ESTADOS_PROYECTO[0];
  const valorNum = parseInt(merged.valorUSD || "0", 10);
  const igmIni = parseFloat(merged.igmInicial || "0");
  const igmFin = parseFloat(merged.igmFinal || "0");

  const update = (updates: Partial<Proyecto>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const requestClose = (action: () => void) => {
    if (Object.keys(form).length === 0) {
      action();
      return;
    }
    setPendingAction(() => action);
  };

  const handleClose = () => requestClose(onClose);

  const handlePut = async (updates: Partial<Proyecto>): Promise<boolean> => {
    setSaving(true);
    try {
      const payload = { ...proyecto, ...form, ...updates };
      const res = await fetch("/api/proyectos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payload.id,
          nombre: payload.nombre,
          idLead: payload.idLead,
          empresaCliente: payload.empresaCliente,
          contacto: payload.contacto,
          emailCliente: payload.emailCliente,
          consultor: payload.consultor,
          servicioForja: payload.servicioForja,
          valorUSD: payload.valorUSD,
          etapaForja: payload.etapaForja,
          faseActual: payload.faseActual,
          igmInicial: payload.igmInicial,
          igmFinal: payload.igmFinal,
          fechaInicio: payload.fechaInicio,
          fechaCierreEst: payload.fechaCierreEst,
          fechaCierreReal: payload.fechaCierreReal,
          estadoPago: payload.estadoPago,
          porcentajeAvance: payload.porcentajeAvance,
          proximaAccion: payload.proximaAccion,
          fechaProximaAccion: payload.fechaProximaAccion,
          entregablesPendientes: payload.entregablesPendientes,
          notas: payload.notas,
          estadoProyecto: payload.estadoProyecto,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      onSave(proyecto, { ...form, ...updates });
      setForm({});
      toast.success("Guardado correctamente");
      return true;
    } catch {
      toast.error("Error al guardar");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAvanzarEtapa = () => {
    const siguiente = getSiguienteEtapa(proyecto.etapaForja);
    if (siguiente) handlePut({ etapaForja: siguiente });
  };

  const handleGuardarTodo = async () => {
    const ok = await handlePut({
      porcentajeAvance: merged.porcentajeAvance,
      proximaAccion: merged.proximaAccion,
      fechaProximaAccion: merged.fechaProximaAccion,
      igmInicial: merged.igmInicial,
      igmFinal: merged.igmFinal,
      entregablesPendientes: merged.entregablesPendientes,
      notas: merged.notas,
      estadoPago: merged.estadoPago,
    });
    if (ok) onClose();
  };

  const epPago = ESTADOS_PAGO.find((e) => e.value === merged.estadoPago);

  return (
    <>
      <ModalShell
        open={open && !pendingAction}
        onClose={handleClose}
        title={merged.empresaCliente}
        subtitle={merged.nombre}
        size="xl"
        accentColor={etapaActual?.color || "#1B3A5C"}
        accentType="gradient"
        headerRight={
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="relative h-14 w-14">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth={5}
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke={etapaActual?.color || "#1B3A5C"}
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={
                      2 *
                      Math.PI *
                      22 *
                      (1 - parseInt(merged.porcentajeAvance || "0", 10) / 100)
                    }
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#1B3A5C]">
                  {merged.porcentajeAvance || 0}%
                </span>
              </div>
              <span className="mt-1 text-xs text-gray-400">Avance</span>
            </div>
            <div className="flex flex-col gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-center text-xs font-medium",
                  estProy.bgClass,
                  estProy.textClass
                )}
              >
                {estProy.label}
              </span>
              <span
                className="rounded-full border px-2.5 py-1 text-center text-xs font-medium"
                style={{
                  background: epPago ? `${epPago.color}15` : undefined,
                  color: epPago?.color,
                  borderColor: epPago ? `${epPago.color}40` : undefined,
                }}
              >
                {getLabelPago(merged.estadoPago || "PENDIENTE")}
              </span>
            </div>
          </div>
        }
        footer={
          <>
            <button
              onClick={handleClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cerrar
            </button>
            <button
              onClick={handleGuardarTodo}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#1B3A5C] px-7 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#33487A] disabled:opacity-50"
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </>
        }
      >
        {/* Meta-info strip */}
        <div className="flex items-center gap-6 border-b border-gray-100 bg-gray-50/60 px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4 text-gray-400" />
            <span>{merged.consultor || "Sin consultor"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="font-semibold text-green-600">
              ${valorNum.toLocaleString("es-CO")} USD
            </span>
          </div>
          {merged.fechaInicio && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              <span>Inicio: {formatearFecha(merged.fechaInicio)}</span>
            </div>
          )}
          {merged.fechaCierreEst && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Target className="h-4 w-4 text-gray-400" />
              <span>Cierre: {formatearFecha(merged.fechaCierreEst)}</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="progreso" className="flex-1">
          <TabsList className="flex h-auto w-full justify-start gap-0 rounded-none border-b border-gray-100 bg-transparent px-8">
            <TabsTrigger
              value="progreso"
              className="rounded-none border-b-2 border-transparent px-5 py-3 text-sm font-medium text-gray-500 capitalize transition-colors hover:text-[#1B3A5C] data-[state=active]:border-[#1B3A5C] data-[state=active]:bg-transparent data-[state=active]:text-[#1B3A5C]"
            >
              Progreso FORJA
            </TabsTrigger>
            <TabsTrigger
              value="entregables"
              className="rounded-none border-b-2 border-transparent px-5 py-3 text-sm font-medium text-gray-500 capitalize transition-colors hover:text-[#1B3A5C] data-[state=active]:border-[#1B3A5C] data-[state=active]:bg-transparent data-[state=active]:text-[#1B3A5C]"
            >
              Entregables y Notas
            </TabsTrigger>
            <TabsTrigger
              value="informacion"
              className="rounded-none border-b-2 border-transparent px-5 py-3 text-sm font-medium text-gray-500 capitalize transition-colors hover:text-[#1B3A5C] data-[state=active]:border-[#1B3A5C] data-[state=active]:bg-transparent data-[state=active]:text-[#1B3A5C]"
            >
              Información
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progreso" className="space-y-6 px-8 py-6">
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Etapas de la metodología FORJA
              </p>
              <div className="relative">
                <div className="absolute left-6 right-6 top-6 h-0.5 bg-gray-200" />
                <div
                  className="absolute left-6 top-6 h-0.5 transition-all duration-500"
                  style={{
                    width: `${((getEtapaOrden(merged.etapaForja) - 1) / 4) * 100}%`,
                    background: etapaActual?.color || "#1B3A5C",
                  }}
                />
                <div className="relative flex justify-between">
                  {ETAPAS_FORJA.map((etapa) => {
                    const completada =
                      etapa.orden < getEtapaOrden(merged.etapaForja);
                    const actual =
                      etapa.nombre.toLowerCase() ===
                      merged.etapaForja?.toLowerCase();

                    return (
                      <div
                        key={etapa.letra}
                        className="flex flex-1 flex-col items-center gap-3"
                      >
                        <div
                          className={cn(
                            "z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                            completada
                              ? "border-transparent text-white"
                              : actual
                                ? "scale-110 border-transparent text-white shadow-lg"
                                : "border-gray-200 bg-white text-gray-400"
                          )}
                          style={
                            completada || actual
                              ? { background: etapa.color }
                              : undefined
                          }
                        >
                          {completada ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span>{etapa.letra}</span>
                          )}
                        </div>
                        <div className="text-center">
                          <p
                            className={cn(
                              "text-xs font-semibold",
                              actual ? "text-[#1B3A5C]" : "text-gray-400"
                            )}
                          >
                            {etapa.nombre}
                          </p>
                          <p className="mt-0.5 hidden max-w-[80px] text-center text-[10px] leading-tight text-gray-400 md:block">
                            {etapa.descripcion}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: `${etapaActual?.color || "#1B3A5C"}20`,
                    color: etapaActual?.color || "#1B3A5C",
                  }}
                >
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-400">
                    Etapa actual — {merged.etapaForja}
                  </p>
                  <p className="text-sm font-semibold text-[#1B3A5C]">
                    Entregable: {etapaActual?.entregable}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#1B3A5C]">
                  Porcentaje de avance
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={parseInt(merged.porcentajeAvance || "0", 10)}
                    onChange={(e) =>
                      update({ porcentajeAvance: e.target.value })
                    }
                    className="flex-1 accent-[#1B3A5C]"
                  />
                  <span className="min-w-[52px] text-right text-2xl font-bold text-[#1B3A5C]">
                    {merged.porcentajeAvance || 0}%
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#1B3A5C]">
                  Progreso metodológico
                </label>
                {merged.etapaForja !== "Acompañar" ? (
                  <button
                    onClick={handleAvanzarEtapa}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:opacity-90"
                    style={{
                      background: etapaActual?.color || "#1B3A5C",
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                    Avanzar a {getSiguienteEtapa(merged.etapaForja)}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold text-green-600">
                      Proyecto completado
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-2">
              <label className="text-sm font-semibold text-[#1B3A5C]">
                Próxima acción
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  value={merged.proximaAccion || ""}
                  onChange={(e) => update({ proximaAccion: e.target.value })}
                  placeholder="Describe la próxima acción..."
                  className="col-span-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#33487A] focus:outline-none"
                />
                <input
                  type="date"
                  value={(merged.fechaProximaAccion || "").split("T")[0] || ""}
                  onChange={(e) =>
                    update({ fechaProximaAccion: e.target.value })
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#33487A] focus:outline-none"
                />
                <button
                  onClick={() =>
                    handlePut({
                      proximaAccion: merged.proximaAccion,
                      fechaProximaAccion: merged.fechaProximaAccion,
                    })
                  }
                  disabled={saving}
                  className="rounded-xl bg-[#1B3A5C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#33487A]"
                >
                  Guardar
                </button>
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-2">
              <label className="text-sm font-semibold text-[#1B3A5C]">
                Índice de Madurez (IGM)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 p-4 text-center">
                  <p className="mb-1 text-xs text-gray-400">IGM Inicial</p>
                  <p className="text-3xl font-bold text-[#D4881E]">
                    {merged.igmInicial || "—"}
                  </p>
                  <p className="text-xs text-gray-400">antes del proyecto</p>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={merged.igmInicial || ""}
                    onChange={(e) => update({ igmInicial: e.target.value })}
                    placeholder="Ej: 2.4"
                    className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-center text-sm focus:border-[#33487A] focus:outline-none"
                  />
                </div>
                <div className="rounded-xl border border-gray-100 p-4 text-center">
                  <p className="mb-1 text-xs text-gray-400">IGM Final</p>
                  {merged.igmFinal ? (
                    <>
                      <p className="text-3xl font-bold text-green-500">
                        {merged.igmFinal}
                      </p>
                      <p className="text-xs text-green-500">
                        +
                        {(
                          parseFloat(merged.igmFinal) -
                          parseFloat(merged.igmInicial || "0")
                        ).toFixed(1)}{" "}
                        pts
                      </p>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="number"
                        step={0.1}
                        min={1}
                        max={5}
                        value={merged.igmFinal || ""}
                        onChange={(e) =>
                          update({ igmFinal: e.target.value })
                        }
                        placeholder="0.0"
                        className="w-full rounded border-0 border-b-2 border-[#1B3A5C] bg-transparent text-center text-2xl font-bold text-[#1B3A5C] focus:outline-none focus:ring-0"
                      />
                      <p className="text-xs text-gray-400">post-proyecto</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await handlePut({
                      igmInicial: merged.igmInicial,
                      igmFinal: merged.igmFinal,
                    });
                    if (merged.idLead && merged.igmFinal?.trim()) {
                      const igmFin = parseFloat(merged.igmFinal);
                      if (!isNaN(igmFin)) {
                        try {
                          await fetch("/api/leads/update-igm", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              idLead: merged.idLead,
                              igm: String(igmFin),
                            }),
                          });
                        } catch {
                          /* silenciar */
                        }
                      }
                    }
                  }}
                  disabled={saving}
                  className="rounded-xl bg-[#1B3A5C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#33487A]"
                >
                  Guardar IGM
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Este dato se usa en el módulo de Madurez como caso de éxito
              </p>
            </div>
          </TabsContent>

          <TabsContent value="entregables" className="space-y-6 px-8 py-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#1B3A5C]">
                Tareas del proyecto
              </label>
              <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                {tareasDelProyecto.length === 0 ? (
                  <p className="text-xs text-gray-500">Sin tareas asociadas</p>
                ) : (
                  tareasDelProyecto.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-[#1B3A5C]">
                        {t.titulo}
                      </span>
                      <span className="text-xs text-gray-500">
                        {t.fechaVencimiento || "Sin fecha"}
                      </span>
                    </div>
                  ))
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => setShowTareaModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar tarea al proyecto
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-[#1B3A5C]">
                Estado de pago
              </label>
              <div className="grid grid-cols-4 gap-3">
                {ESTADOS_PAGO.map((ep) => (
                  <button
                    key={ep.value}
                    onClick={() => handlePut({ estadoPago: ep.value })}
                    disabled={saving}
                    className={cn(
                      "rounded-xl border-2 px-3 py-3 text-center text-xs font-semibold transition-all",
                      merged.estadoPago === ep.value
                        ? "scale-[1.02] border-transparent text-white"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                    style={
                      merged.estadoPago === ep.value
                        ? { background: ep.color }
                        : undefined
                    }
                  >
                    {ep.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Valor total:{" "}
                    <span className="font-bold text-[#1B3A5C]">
                      ${valorNum.toLocaleString()} USD
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    50% inicial: ${(valorNum * 0.5).toLocaleString()} · 50%
                    final: ${(valorNum * 0.5).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-[#1B3A5C]">
                Entregables del proyecto
              </label>
              <textarea
                value={merged.entregablesPendientes || ""}
                onChange={(e) =>
                  update({ entregablesPendientes: e.target.value })
                }
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-[#1B3A5C] focus:border-[#33487A] focus:outline-none"
                placeholder="• Diagnóstico de madurez&#10;• Roadmap estratégico 90 días&#10;• Manual de procesos&#10;• Dashboard de KPIs"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-[#1B3A5C]">
                Notas internas del equipo
              </label>
              <textarea
                value={merged.notas || ""}
                onChange={(e) => update({ notas: e.target.value })}
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-[#1B3A5C] focus:border-[#33487A] focus:outline-none"
                placeholder="Notas visibles solo para el equipo Arquiron..."
              />
            </div>
          </TabsContent>

          <TabsContent value="informacion" className="space-y-6 px-8 py-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1B3A5C]">
                  <Building2 className="h-4 w-4" />
                  Datos del cliente
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Empresa", value: merged.empresaCliente },
                    { label: "Contacto", value: merged.contacto },
                    { label: "Email", value: merged.emailCliente },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <p className="mb-0.5 text-xs text-gray-400">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-[#1B3A5C]">
                        {item.value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    requestClose(() => {
                      onClose();
                      router.push(
                        `/leads${merged.emailCliente ? `?search=${encodeURIComponent(merged.emailCliente)}` : ""}`
                      );
                    });
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-[#1B3A5C] transition-colors hover:text-[#D4881E]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver lead original
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1B3A5C]">
                  <Briefcase className="h-4 w-4" />
                  Datos del proyecto
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Servicio FORJA",
                      value: merged.servicioForja,
                    },
                    {
                      label: "Fecha inicio",
                      value: formatearFecha(merged.fechaInicio || ""),
                    },
                    {
                      label: "Cierre estimado",
                      value: formatearFecha(merged.fechaCierreEst || ""),
                    },
                    {
                      label: "Valor",
                      value: `$${valorNum.toLocaleString()} USD`,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <p className="mb-0.5 text-xs text-gray-400">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-[#1B3A5C]">
                        {item.value || "—"}
                      </p>
                    </div>
                  ))}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="mb-1 text-xs text-gray-400">Consultor</p>
                    <ConsultorSelect
                      value={merged.consultor || ""}
                      onChange={(v) => update({ consultor: v })}
                      className="h-9 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECCIÓN NPS ─────────────────────────────── */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1B3A5C]">
                <span>⭐</span> NPS y Satisfacción
              </h3>

              {tieneNPS ? (
                <div className="rounded-xl border border-gray-100 p-5">
                  <div className="mb-3 flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-black text-white"
                      style={{
                        background:
                          (npsScore ?? 0) >= 9
                            ? "#22c55e"
                            : (npsScore ?? 0) >= 7
                              ? "#eab308"
                              : "#ef4444",
                      }}
                    >
                      {npsScore}
                    </div>
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{
                          color:
                            (npsScore ?? 0) >= 9
                              ? "#22c55e"
                              : (npsScore ?? 0) >= 7
                                ? "#eab308"
                                : "#ef4444",
                        }}
                      >
                        {(npsScore ?? 0) >= 9
                          ? "Promotor 🎉"
                          : (npsScore ?? 0) >= 7
                            ? "Pasivo 😐"
                            : "Detractor ⚠️"}{" "}
                        — {npsScore}/10
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Registrado el {npsDateSaved}
                      </p>
                      {npsComment && (
                        <p className="mt-1 text-xs italic text-gray-500">
                          &quot;{npsComment}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <p className="mb-1 text-sm font-semibold text-orange-700">
                      ⏰ Sin NPS registrado
                    </p>
                    <p className="text-xs leading-relaxed text-orange-600">
                      Captura la satisfacción del cliente para documentar el
                      impacto (etapa J — Justificar).
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleEnviarEmailNPS}
                      disabled={!proyecto.emailCliente || enviandoNPS}
                      className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#1B3A5C] py-2.5 text-sm font-semibold text-[#1B3A5C] transition-colors hover:bg-[#1B3A5C]/5 disabled:opacity-40"
                    >
                      {enviandoNPS ? "Enviando..." : "📧 Enviar email al cliente"}
                    </button>
                    <button
                      onClick={() => {
                        setNpsScoreLocal(null);
                        setNpsComentarioLocal("");
                        setShowNPSModal(true);
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#1B3A5C] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#33487A]"
                    >
                      ✏️ Registrar manualmente
                    </button>
                  </div>
                  {!proyecto.emailCliente && (
                    <p className="text-center text-xs text-gray-400">
                      El proyecto no tiene email del cliente configurado
                    </p>
                  )}
                </div>
              )}
            </div>

            {!isNaN(igmFin) && igmFin > 0 && (
              <div
                className="rounded-2xl p-6 text-white"
                style={{
                  background: "linear-gradient(135deg, #1D1A70, #8560C0)",
                }}
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-200">
                  Reporte de Impacto — Etapa J (Justificar)
                </p>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-black text-white">
                      {merged.igmInicial}
                    </p>
                    <p className="text-xs text-blue-200">IGM inicial</p>
                  </div>
                  <ArrowRight className="h-8 w-8 text-[#D4881E]" />
                  <div className="text-center">
                    <p className="text-3xl font-black text-[#4CCED5]">
                      {merged.igmFinal}
                    </p>
                    <p className="text-xs text-blue-200">IGM final</p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-2xl font-black text-[#D4881E]">
                      +
                      {(
                        parseFloat(merged.igmFinal || "0") -
                        parseFloat(merged.igmInicial || "0")
                      ).toFixed(1)}{" "}
                      pts
                    </p>
                    <p className="text-xs text-blue-200">
                      mejora documentada
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="mt-3 bg-[#D4881E] text-white hover:bg-[#EC8E48]"
                  onClick={() => {
                    requestClose(() => {
                      onClose();
                      const params = new URLSearchParams();
                      params.set("empresa", merged.empresaCliente || "");
                      params.set("email", merged.emailCliente || "");
                      params.set("igm", String(igmFin));
                      params.set("servicio", merged.servicioForja || "");
                      params.set("id", merged.idLead || "");
                      params.set("contacto", merged.contacto || "");
                      router.push(`/propuestas/nueva?${params.toString()}`);
                    });
                  }}
                >
                  Usar en propuesta
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ModalShell>

      {showNPSModal && (
        <Dialog open={showNPSModal} onOpenChange={setShowNPSModal}>
          <DialogContent className="!max-w-[480px] w-[90vw] rounded-2xl p-0 gap-0 overflow-hidden">
            <div
              className="h-1 rounded-t-2xl"
              style={{ background: "linear-gradient(90deg,#1D1A70,#8560C0)" }}
            />
            <div className="px-8 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1B3A5C]">
                Registrar satisfacción
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {proyecto.empresaCliente} — {proyecto.nombre}
              </p>
            </div>
            <div className="px-8 py-6 space-y-5">
              <p className="text-sm text-[#1B3A5C] font-medium text-center">
                ¿Qué tan probable es que{" "}
                <strong>{proyecto.contacto || proyecto.empresaCliente}</strong>{" "}
                recomiende Arquiron?
              </p>

              <div className="space-y-2">
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNpsScoreLocal(i)}
                      className="w-9 h-9 rounded-xl text-sm font-bold border-2 transition-all"
                      style={
                        npsScoreLocal === i
                          ? {
                              background:
                                i >= 9 ? "#22c55e" : i >= 7 ? "#eab308" : "#ef4444",
                              borderColor: "transparent",
                              color: "white",
                              transform: "scale(1.1)",
                            }
                          : {
                              background: "white",
                              borderColor: "#e5e7eb",
                              color: "#6b7280",
                            }
                      }
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 px-1">
                  <span>Muy improbable</span>
                  <span>Muy probable</span>
                </div>
              </div>

              {npsScoreLocal !== null && (
                <div
                  className="rounded-xl py-2 text-center"
                  style={{
                    background:
                      npsScoreLocal >= 9
                        ? "#f0fdf4"
                        : npsScoreLocal >= 7
                          ? "#fefce8"
                          : "#fef2f2",
                  }}
                >
                  <p
                    className="text-sm font-bold"
                    style={{
                      color:
                        npsScoreLocal >= 9
                          ? "#22c55e"
                          : npsScoreLocal >= 7
                            ? "#eab308"
                            : "#ef4444",
                    }}
                  >
                    {npsScoreLocal >= 9
                      ? "🎉 Promotor — Recomendará activamente"
                      : npsScoreLocal >= 7
                        ? "😐 Pasivo — Satisfecho pero no activo"
                        : "⚠️ Detractor — Riesgo de mala recomendación"}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#1B3A5C]">
                  Comentario del cliente (opcional)
                </label>
                <textarea
                  value={npsComentarioLocal}
                  onChange={(e) => setNpsComentarioLocal(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none resize-none bg-white"
                  placeholder="¿Qué fue lo más valioso? ¿Qué podría mejorar?"
                />
              </div>
            </div>
            <div className="px-8 py-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowNPSModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarNPS}
                disabled={npsScoreLocal === null || guardandoNPS}
                className="px-6 py-2.5 rounded-xl bg-[#1B3A5C] hover:bg-[#33487A] text-white text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {guardandoNPS ? "Guardando..." : "Guardar NPS"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <NewTareaModal
        open={showTareaModal}
        onClose={() => setShowTareaModal(false)}
        onSuccess={() => {
          setShowTareaModal(false);
          if (proyecto?.id) {
            fetch("/api/tareas")
              .then((r) => r.json())
              .then((data) => {
                const arr = Array.isArray(data) ? data : [];
                setTareasDelProyecto(
                  arr.filter(
                    (t: Tarea) =>
                      t.relacionadoCon === "Proyecto" &&
                      t.idReferencia === proyecto.id &&
                      !["COMPLETADA", "CANCELADA"].includes(t.estado)
                  )
                );
              });
          }
        }}
        datosPreCargados={
          showTareaModal && proyecto
            ? {
                relacionadoCon: "Proyecto",
                idReferencia: proyecto.id,
                empresa: proyecto.empresaCliente || "",
                asignadoA: proyecto.consultor || "",
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={pendingAction !== null}
        title="¿Descartar cambios?"
        description="Tienes cambios sin guardar en este proyecto. Se perderán si continúas."
        confirmLabel="Descartar"
        cancelLabel="Seguir editando"
        onConfirm={() => {
          const action = pendingAction;
          setPendingAction(null);
          action?.();
        }}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}
