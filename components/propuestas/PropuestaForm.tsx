"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  BarChart2,
  Target,
  Layers,
  CheckSquare,
  Calendar,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronRight,
  Save,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { ConsultorSelect } from "@/components/ui/ConsultorSelect";
import { LeadSelect } from "@/components/ui/LeadSelect";
import {
  PLANTILLAS,
  aplicarPlantilla,
  type PlantillaKey,
} from "@/lib/plantillas-propuesta";
import { toast } from "sonner";
import type { Propuesta } from "@/types/propuesta";

const SECCIONES = [
  { key: "introduccion", titulo: "Introducción", icono: BookOpen },
  { key: "diagnostico", titulo: "Diagnóstico", icono: BarChart2 },
  { key: "alcance", titulo: "Alcance del Proyecto", icono: Target },
  { key: "metodologia", titulo: "Metodología FORJA", icono: Layers },
  { key: "entregables", titulo: "Entregables", icono: CheckSquare },
  { key: "timeline", titulo: "Timeline", icono: Calendar },
  { key: "inversion", titulo: "Inversión", icono: DollarSign },
  { key: "terminos", titulo: "Términos y Condiciones", icono: FileText },
] as const;

const METODOLOGIA_DEFAULT = `Aplicaremos nuestra metodología propietaria FORJA:

F — FIJAR: Diagnóstico profundo y definición del punto de partida.
O — ORIENTAR: Diseño de la hoja de ruta estratégica con quick wins.
R — REDISEÑAR: Intervención en procesos, sistemas y capacidades.
J — JUSTIFICAR: Medición de resultados e impacto cuantificable.
A — ACOMPAÑAR: Soporte post-intervención y seguimiento del plan.`;

const TERMINOS_DEFAULT = `• Esta propuesta tiene una vigencia de 30 días calendario.
• El inicio del proyecto está sujeto a la firma del contrato.
• El 50% del valor se factura al inicio, 50% al finalizar.
• Arquiron garantiza confidencialidad total de la información.
• Cualquier modificación al alcance será acordada por escrito.`;

interface PropuestaFormProps {
  propuestaInicial?: Partial<Propuesta> | null;
  onGuardarBorrador: (data: Partial<Propuesta>) => Promise<void>;
  onEnviar: (data: Partial<Propuesta>) => Promise<void>;
  onFormChange?: (data: Partial<Propuesta>) => void;
  version?: string;
  isNew?: boolean;
}

const FORM_DEFAULT: Partial<Propuesta> = {
  titulo: "",
  plantilla: "Estándar",
  idLead: "",
  emailCliente: "",
  empresaCliente: "",
  contacto: "",
  consultor: "",
  servicioForja: "",
  valorUSD: "",
  notasInternas: "",
  introduccion: "",
  diagnostico: "",
  alcance: "",
  metodologia: METODOLOGIA_DEFAULT,
  entregables: "",
  timeline: "",
  inversion: "",
  terminos: TERMINOS_DEFAULT,
  version: "v1.0",
  estado: "Borrador",
};

export function PropuestaForm({
  propuestaInicial,
  onGuardarBorrador,
  onEnviar,
  onFormChange,
  version = "v1.0",
  isNew = true,
}: PropuestaFormProps) {
  const { data: session } = useSession();
  const [leadSeleccionadoId, setLeadSeleccionadoId] = useState("");
  const [form, setForm] = useState<Partial<Propuesta>>({
    ...FORM_DEFAULT,
    titulo: "",
    plantilla: "Estándar",
    idLead: "",
    emailCliente: "",
    empresaCliente: "",
    contacto: "",
    consultor: "",
    servicioForja: "",
    valorUSD: "",
    notasInternas: "",
    introduccion: "",
    diagnostico: "",
    alcance: "",
    metodologia: METODOLOGIA_DEFAULT,
    entregables: "",
    timeline: "",
    inversion: "",
    terminos: TERMINOS_DEFAULT,
    ...propuestaInicial,
  });

  useEffect(() => {
    onFormChange?.(form);
  }, [form, onFormChange]);

  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({
    introduccion: true,
    diagnostico: true,
    alcance: false,
    metodologia: false,
    entregables: false,
    timeline: false,
    inversion: false,
    terminos: false,
  });

  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [showEnviarModal, setShowEnviarModal] = useState(false);

  useEffect(() => {
    if (propuestaInicial) {
      setForm((prev) => ({ ...prev, ...propuestaInicial }));
    }
  }, [propuestaInicial]);

  const toggleSeccion = (key: string) => {
    setSeccionesAbiertas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const update = (updates: Partial<Propuesta>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handlePlantillaChange = (plantilla: PlantillaKey) => {
    const contenido = aplicarPlantilla(plantilla, form.empresaCliente);
    setForm((prev) => ({
      ...prev,
      plantilla,
      introduccion: contenido.introduccion || prev.introduccion,
      diagnostico: contenido.diagnostico || prev.diagnostico,
      alcance: contenido.alcance || prev.alcance,
      metodologia: contenido.metodologia || prev.metodologia,
      entregables: contenido.entregables || prev.entregables,
      timeline: contenido.timeline || prev.timeline,
      inversion: contenido.inversion || prev.inversion,
      terminos: contenido.terminos || prev.terminos,
    }));
  };

  useEffect(() => {
    if (propuestaInicial?.idLead && !leadSeleccionadoId) {
      setLeadSeleccionadoId(propuestaInicial.idLead);
    }
  }, [propuestaInicial?.idLead, leadSeleccionadoId]);

  useEffect(() => {
    if (!form.consultor && session?.user?.name) {
      update({ consultor: session.user.name });
    }
  }, [session?.user?.name]);

  const tieneContenido = (key: string) => {
    const val = form[key as keyof Propuesta];
    return typeof val === "string" && val.trim().length > 0;
  };

  const handleGuardarBorrador = async () => {
    if (!form.titulo?.trim()) {
      toast.error("El título es requerido");
      return;
    }
    if (!form.empresaCliente?.trim()) {
      toast.error("El cliente es requerido");
      return;
    }
    setGuardando(true);
    try {
      await onGuardarBorrador({ ...form, estado: "Borrador", version });
      toast.success(`Borrador guardado — ID: ${form.id || "nuevo"}`);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const handleConfirmarEnviar = async () => {
    if (!form.titulo?.trim() || !form.empresaCliente?.trim()) {
      toast.error("Título y cliente son requeridos");
      return;
    }
    setEnviando(true);
    setShowEnviarModal(false);
    try {
      await onEnviar({ ...form, estado: "Enviada", version });
      toast.success(`Propuesta enviada exitosamente a ${form.emailCliente}`);
    } catch {
      toast.error("Error al enviar. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sección 0 - Datos generales */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-[#1B3A5C]">
          Datos generales
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Título de la propuesta *</Label>
            <Input
              value={form.titulo || ""}
              onChange={(e) => update({ titulo: e.target.value })}
              placeholder="ej. Propuesta Implementación CRM — TechStart SAS"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Plantilla</Label>
            <Select
              value={form.plantilla || "Estándar"}
              onValueChange={(v) => v && handlePlantillaChange(v as PlantillaKey)}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {PLANTILLAS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#1B3A5C]">
              Cliente <span className="text-[#D4881E]">*</span>
            </Label>
            <LeadSelect
              value={leadSeleccionadoId}
              onChange={(lead) => {
                if (!lead) {
                  setLeadSeleccionadoId("");
                  return;
                }
                setLeadSeleccionadoId(
                  lead.id || lead.emailCorporativo || ""
                );
                update({
                  idLead: lead.id || lead.emailCorporativo || "",
                  emailCliente: lead.emailCorporativo || "",
                  empresaCliente: lead.nombreEmpresa || "",
                  contacto: lead.nombreContacto || "",
                  servicioForja: lead.servicioSugeridoForja || form.servicioForja,
                });
                const igm = parseFloat(lead.indiceMadurez || "0");
                if (igm > 0) {
                  const nivel =
                    igm < 2
                      ? "Inicial"
                      : igm < 3
                        ? "Básico"
                        : igm < 3.5
                          ? "Definido"
                          : igm < 4.5
                            ? "Gestionado"
                            : "Optimizado";
                  update({
                    diagnostico: `El diagnóstico de madurez empresarial de ${lead.nombreEmpresa} arroja un Índice Global de Madurez (IGM) de ${igm.toFixed(2)}/5, ubicándose en el nivel ${nivel}. Su principal reto identificado es: ${lead.retoPrincipal || "por definir"}. Las dimensiones con mayor oportunidad de mejora requieren intervención estratégica inmediata para elevar la competitividad.`,
                  });
                }
              }}
              placeholder="Selecciona un cliente..."
            />
          </div>
          <div>
            <Label>Deal relacionado</Label>
            <Input
              value={form.servicioForja || ""}
              onChange={(e) => update({ servicioForja: e.target.value })}
              placeholder="Nombre del proyecto o deal"
              className="mt-1"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#1B3A5C]">
              Consultor responsable <span className="text-[#D4881E]">*</span>
            </Label>
            <ConsultorSelect
              value={form.consultor || ""}
              onChange={(val) => update({ consultor: val })}
              allowEmpty={false}
            />
          </div>
          <div>
            <Label>Valor USD</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                type="text"
                inputMode="numeric"
                value={form.valorUSD || ""}
                onChange={(e) =>
                  update({
                    valorUSD: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="0"
                className="pl-7"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>Notas internas</Label>
            <Textarea
              value={form.notasInternas || ""}
              onChange={(e) => update({ notasInternas: e.target.value })}
              placeholder="Notas visibles solo para el equipo (no se envían al cliente)"
              rows={2}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Secciones colapsables */}
      {SECCIONES.map(({ key, titulo, icono: Icono }) => (
        <div
          key={key}
          className="rounded-xl border border-gray-200 bg-white overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleSeccion(key)}
            className="flex w-full items-center gap-3 px-6 py-4 text-left hover:bg-gray-50/50"
          >
            {seccionesAbiertas[key] ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            <Icono className="h-5 w-5 text-[#1B3A5C]" />
            <span className="font-semibold text-[#1B3A5C]">{titulo}</span>
            {tieneContenido(key) && (
              <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
            )}
          </button>
          <AnimatePresence>
            {seccionesAbiertas[key] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="border-t border-gray-100 px-6 py-4">
                  <Textarea
                    value={form[key as keyof Propuesta] as string || ""}
                    onChange={(e) =>
                      update({ [key]: e.target.value } as Partial<Propuesta>)
                    }
                    placeholder={
                      key === "introduccion"
                        ? "Presenta Arquiron, el contexto del cliente y el motivo de esta propuesta..."
                        : key === "diagnostico"
                          ? "Describe el diagnóstico de la situación actual del cliente..."
                          : key === "alcance"
                            ? "Define claramente qué incluye y qué NO incluye esta propuesta..."
                            : key === "entregables"
                              ? "Lista los entregables específicos..."
                              : key === "timeline"
                                ? "Describe las fases y tiempos..."
                                : key === "inversion"
                                  ? "Detalla la estructura de precios..."
                                  : ""
                    }
                    rows={6}
                    className="min-h-[120px] resize-y"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
        <Button
          variant="outline"
          onClick={handleGuardarBorrador}
          disabled={guardando}
          className="rounded-xl border-gray-200"
        >
          <Save className="mr-2 h-4 w-4" />
          {guardando ? "Guardando..." : "Guardar borrador"}
        </Button>
        <Button
          onClick={() => setShowEnviarModal(true)}
          disabled={enviando}
          className="rounded-xl bg-[#1B3A5C] text-white hover:bg-[#33487A]"
        >
          <Send className="mr-2 h-4 w-4" />
          {enviando ? "Enviando..." : "Enviar propuesta"}
        </Button>
      </div>

      {showEnviarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-[#1B3A5C]">
              ¿Enviar propuesta?
            </h3>
            <div className="mt-4 space-y-3 py-4">
              <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-xs text-gray-500">Para:</span>
                  <span className="text-sm font-semibold text-[#1B3A5C]">
                    {form.contacto || "Sin contacto asignado"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-xs text-gray-500">Email:</span>
                  <span className="text-sm text-gray-600">
                    {form.emailCliente || "Sin email asignado"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-xs text-gray-500">Empresa:</span>
                  <span className="text-sm text-gray-600">
                    {form.empresaCliente || "Sin empresa asignada"}
                  </span>
                </div>
              </div>
              {!form.emailCliente && (
                <div className="flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                  <span className="text-sm text-yellow-500">⚠️</span>
                  <p className="text-xs text-yellow-700">
                    No hay email de cliente asignado. Selecciona un cliente
                    antes de enviar la propuesta.
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Se enviará desde{" "}
                <span className="font-medium text-[#1B3A5C]">
                  contacto@arquiron.com
                </span>
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEnviarModal(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarEnviar}
                disabled={!form.emailCliente || enviando}
                className="rounded-xl bg-[#1B3A5C] hover:bg-[#33487A] text-white"
              >
                {enviando ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Enviando...
                  </span>
                ) : (
                  "Enviar ahora"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
