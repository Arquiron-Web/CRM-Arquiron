"use client";

import { useState, useEffect } from "react";
import {
  MessageCircle,
  Mail,
  CalendarPlus,
  MessageSquare,
  Phone,
  Calendar,
  MapPin,
  Monitor,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DimensionBar } from "./DimensionBar";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { EstadoSelect } from "@/components/ui/EstadoSelect";
import { ConsultorSelect } from "@/components/ui/ConsultorSelect";
import {
  getClasificacionColor,
  getPaisLabel,
  DIMENSION_LABELS,
} from "@/lib/pipeline-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/lead";
import type { Interaccion } from "@/types/interaccion";
import { NewInteraccionModal } from "@/components/interacciones/NewInteraccionModal";
import { NewEventoModal } from "@/components/calendario/NewEventoModal";
import { NewTareaModal } from "@/components/tareas/NewTareaModal";

const FUENTE_LABELS: Record<string, string> = {
  Portal_Empresarial: "Portal Web",
  Evaluacion_Madurez: "Evaluación",
};

function getTipoInteraccionBg(tipo: string): string {
  const map: Record<string, string> = {
    Llamada: "bg-blue-500",
    Email: "bg-purple-500",
    Reunión: "bg-green-500",
    WhatsApp: "bg-[#25D366]",
    Visita: "bg-orange-500",
    Demo: "bg-[#8560C0]",
  };
  return map[tipo] || "bg-gray-500";
}

function getTipoInteraccionIcon(tipo: string) {
  const map: Record<string, typeof Phone> = {
    Llamada: Phone,
    Email: Mail,
    Reunión: Calendar,
    WhatsApp: MessageCircle,
    Visita: MapPin,
    Demo: Monitor,
  };
  const Icon = map[tipo] || Mail;
  return <Icon className="h-4 w-4 text-white" />;
}

function getResultadoBadge(resultado: string): string {
  const map: Record<string, string> = {
    Positivo: "bg-green-50 text-green-600",
    Excelente: "bg-teal-50 text-teal-600",
    Neutral: "bg-gray-50 text-gray-600",
    Negativo: "bg-red-50 text-red-500",
    "Sin respuesta": "bg-yellow-50 text-yellow-600",
  };
  return map[resultado] || "bg-gray-50 text-gray-600";
}

function calcularTiempoRelativo(timestamp: string): string {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "";
  const ahora = new Date();
  const diffMs = ahora.getTime() - d.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDias === 0) return "Hoy";
  if (diffDias === 1) return "Ayer";
  if (diffDias < 7) return `Hace ${diffDias} días`;
  if (diffDias < 30) return `Hace ${Math.floor(diffDias / 7)} semanas`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function getFuenteBadge(fuente: string) {
  const isEval = (fuente || "").includes("Evaluacion") || (fuente || "").includes("Evaluación");
  const label = FUENTE_LABELS[fuente as keyof typeof FUENTE_LABELS] || fuente || "-";
  return { icon: isEval ? "📊" : "🌐", label, color: isEval ? "#8560C0" : "#1B3A5C" };
}

function DataRow({
  label,
  value,
  href,
  external,
}: {
  label: string;
  value?: string;
  href?: string;
  external?: boolean;
}) {
  const content = value || "-";
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-gray-900">
        {href ? (
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="text-arquiron-navy hover:underline"
          >
            {content}
          </a>
        ) : (
          content
        )}
      </dd>
    </div>
  );
}

interface LeadDrawerProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (lead: Lead, updates: Partial<Lead>) => Promise<void>;
  onCrearProyecto?: (lead: Lead) => void;
}

export function LeadDrawer({
  lead,
  open,
  onOpenChange,
  onSave,
  onCrearProyecto,
}: LeadDrawerProps) {
  const [estadoLead, setEstadoLead] = useState("");
  const [consultorAsignado, setConsultorAsignado] = useState("");
  const [fechaContacto, setFechaContacto] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [interaccionesDelLead, setInteraccionesDelLead] = useState<Interaccion[]>([]);
  const [showInteraccionModal, setShowInteraccionModal] = useState(false);
  const [showEventoModal, setShowEventoModal] = useState(false);
  const [showTareaModal, setShowTareaModal] = useState(false);

  useEffect(() => {
    if (lead && open) {
      setEstadoLead(lead.estadoLead || "NUEVO");
      setConsultorAsignado(lead.consultorAsignado || "");
      const fc = lead.fechaContacto || "";
      setFechaContacto(fc.includes("T") ? fc.slice(0, 10) : fc);
      setNotas(lead.notas || "");
    }
  }, [lead, open]);

  useEffect(() => {
    if (!lead?.emailCorporativo || !open) return;
    fetch("/api/interacciones")
      .then((r) => r.json())
      .then((data) => {
        const filtradas = (Array.isArray(data) ? data : [])
          .filter(
            (i: Interaccion) =>
              i.emailLead === lead.emailCorporativo ||
              i.empresa === lead.nombreEmpresa
          )
          .slice(0, 3);
        setInteraccionesDelLead(filtradas);
      })
      .catch(() => setInteraccionesDelLead([]));
  }, [lead?.emailCorporativo, lead?.nombreEmpresa, open]);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      await onSave(lead, {
        estadoLead,
        consultorAsignado,
        fechaContacto,
        notas,
      });
      toast.success("Cambios guardados correctamente");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (!lead) return null;

  const fuenteBadge = getFuenteBadge(lead.fuenteFormulario);
  const hasIGM = lead.indiceMadurez && lead.indiceMadurez.trim() !== "";
  const igmValue = parseFloat(lead.indiceMadurez) || 0;

  const dims = [
    { key: "dim1", value: parseFloat(lead.dim1) || 0 },
    { key: "dim2", value: parseFloat(lead.dim2) || 0 },
    { key: "dim3", value: parseFloat(lead.dim3) || 0 },
    { key: "dim4", value: parseFloat(lead.dim4) || 0 },
    { key: "dim5", value: parseFloat(lead.dim5) || 0 },
    { key: "dim6", value: parseFloat(lead.dim6) || 0 },
    { key: "dim7", value: parseFloat(lead.dim7) || 0 },
    { key: "dim8", value: parseFloat(lead.dim8) || 0 },
    { key: "dim9", value: parseFloat(lead.dim9) || 0 },
    { key: "dim10", value: parseFloat(lead.dim10) || 0 },
  ];

  const getIGMColor = () => {
    if (igmValue >= 4) return "text-arquiron-teal";
    if (igmValue >= 3) return "text-arquiron-navy";
    if (igmValue >= 2) return "text-arquiron-purple";
    return "text-arquiron-orange";
  };

  const whatsappUrl = (whatsapp: string) => {
    const num = (whatsapp || "").replace(/\D/g, "");
    return num ? `https://wa.me/${num}` : "#";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="!max-w-[920px] w-[92vw] flex flex-col gap-0 overflow-hidden rounded-2xl p-0 max-h-[92vh]"
        showCloseButton
      >
        <div className="h-1 w-full shrink-0 rounded-t-2xl bg-[#1B3A5C]" />
        <DialogHeader className="shrink-0 border-b border-gray-100 px-8 pb-5 pt-7">
          <DialogTitle className="text-xl font-bold text-arquiron-navy">
            {lead.nombreEmpresa}
          </DialogTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <EstadoBadge estado={lead.estadoLead || "NUEVO"} size="md" />
            <Badge
              className="border-0 font-medium"
              style={{
                backgroundColor: getClasificacionColor(lead.clasificacion),
                color: "white",
              }}
            >
              {(lead.clasificacion || "Sin clasificar").replace(/^[🔴🟠🟡🟢⚪]\s*/, "")}
            </Badge>
            <Badge
              className="border-0 font-medium"
              style={{
                backgroundColor: fuenteBadge.color,
                color: "white",
              }}
            >
              {fuenteBadge.icon} {fuenteBadge.label}
            </Badge>
          </div>
        </DialogHeader>

        {/* Contenido scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          <Tabs defaultValue="perfil" className="flex h-full flex-col">
            <TabsList className="mt-4 shrink-0">
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
              <TabsTrigger value="gestion">Gestión CRM</TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="mt-6 flex-1 space-y-6 pb-6">
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <h4 className="mb-3 font-semibold text-arquiron-navy">Datos de empresa</h4>
                <dl className="space-y-2.5 text-sm">
                  <DataRow label="Sector" value={lead.sector} />
                  <DataRow label="Tamaño" value={lead.tamano} />
                  <DataRow label="País" value={getPaisLabel(lead.pais)} />
                  <DataRow label="Ciudad" value={lead.ciudad} />
                  <DataRow label="Años en operación" value={lead.anosOperacion} />
                  <DataRow label="Ingresos anuales" value={lead.ingresoAnual} />
                  <DataRow label="Exporta" value={lead.exporta} />
                </dl>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <h4 className="mb-3 font-semibold text-arquiron-navy">Datos de contacto</h4>
                <dl className="space-y-2.5 text-sm">
                  <DataRow label="Nombre" value={lead.nombreContacto} />
                  <DataRow label="Cargo" value={lead.cargo} />
                  <DataRow
                    label="Email"
                    value={lead.emailCorporativo}
                    href={lead.emailCorporativo ? `mailto:${lead.emailCorporativo}` : undefined}
                  />
                  <DataRow
                    label="WhatsApp"
                    value={lead.whatsapp}
                    href={lead.whatsapp ? whatsappUrl(lead.whatsapp) : undefined}
                    external
                  />
                  <DataRow label="Cómo nos conoció" value={lead.comoNosConocio} />
                  <DataRow label="Momento de contacto" value={lead.momentoContacto} />
                </dl>
              </div>
            </TabsContent>

          <TabsContent value="evaluacion" className="mt-6 space-y-6 pb-6">
            {!hasIGM ? (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-gray-500">
                Este lead no ha completado la evaluación
              </p>
            ) : (
              <>
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Índice de Madurez Global
                  </p>
                  <p className={`mt-1 text-4xl font-bold ${getIGMColor()}`}>
                    {igmValue.toFixed(1)}
                  </p>
                </div>
                <div className="space-y-4">
                  {dims.map((d) => (
                    <DimensionBar
                      key={d.key}
                      label={DIMENSION_LABELS[d.key as keyof typeof DIMENSION_LABELS] || d.key}
                      value={d.value}
                      max={5}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="gestion" className="mt-6 space-y-4 pb-6">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1B3A5C]">
                Estado del lead
              </Label>
              <EstadoSelect
                value={estadoLead || lead.estadoLead || "NUEVO"}
                onChange={(v) => setEstadoLead(v ?? "NUEVO")}
                className="border-gray-200 focus:border-[#33487A] rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1B3A5C]">
                Consultor asignado
              </Label>
              <ConsultorSelect
                value={consultorAsignado || ""}
                onChange={(val) => setConsultorAsignado(val)}
              />
            </div>
            <div>
              <Label>Fecha de contacto</Label>
              <Input
                type="date"
                value={fechaContacto}
                onChange={(e) => setFechaContacto(e.target.value)}
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas..."
                rows={4}
                className="min-h-[100px]"
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>

            {(estadoLead || lead.estadoLead || "NUEVO") === "GANADO" &&
              onCrearProyecto && (
                <Button
                  onClick={() => {
                    onCrearProyecto(lead);
                    onOpenChange(false);
                  }}
                  className="mt-4 w-full rounded-xl bg-[#1B3A5C] text-white font-semibold hover:bg-[#33487A]"
                >
                  Crear proyecto desde este lead →
                </Button>
              )}

            <Button
              onClick={() => setShowTareaModal(true)}
              variant="outline"
              className="mt-3 w-full rounded-xl border-[#1B3A5C]/30 text-[#1B3A5C] hover:bg-[#1B3A5C]/5"
            >
              Crear tarea para este lead
            </Button>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <p className="mb-3 text-sm font-semibold text-[#1B3A5C]">
                Historial del lead
              </p>
              {interaccionesDelLead.length > 0 ? (
                <div className="mb-4 space-y-2">
                  {interaccionesDelLead.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          getTipoInteraccionBg(i.tipo)
                        )}
                      >
                        {getTipoInteraccionIcon(i.tipo)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[#1B3A5C]">
                          {i.titulo}
                        </p>
                        <p className="text-xs text-gray-400">
                          {calcularTiempoRelativo(i.timestamp)}
                        </p>
                      </div>
                      {i.resultado && (
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                            getResultadoBadge(i.resultado)
                          )}
                        >
                          {i.resultado}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-xs text-gray-400">
                  Sin interacciones registradas
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowInteraccionModal(true)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#1B3A5C]/20 py-2 text-xs font-semibold text-[#1B3A5C] transition-colors hover:bg-[#1B3A5C]/5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Registrar interacción
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventoModal(true)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#D4881E]/20 py-2 text-xs font-semibold text-[#D4881E] transition-colors hover:bg-[#D4881E]/5"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Agendar evento
                </button>
              </div>
            </div>
          </TabsContent>
          </Tabs>
        </div>

        {/* Footer fijo */}
        <DialogFooter className="shrink-0 mx-0 mb-0 flex flex-col items-stretch gap-2 rounded-b-2xl border-t border-gray-100 bg-white px-8 py-5">
          <div className="flex w-full gap-2">
            <a
              href={whatsappUrl(lead.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center rounded-lg border border-input bg-transparent px-4 py-2 text-sm hover:bg-accent"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Escribir por WhatsApp
            </a>
            <a
              href={`mailto:${lead.emailCorporativo}`}
              className="flex flex-1 items-center justify-center rounded-lg border border-input bg-transparent px-4 py-2 text-sm hover:bg-accent"
            >
              <Mail className="mr-2 h-4 w-4" />
              Enviar Email
            </a>
          </div>
          {lead.servicioSugeridoForja && (
            <div
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: "#fff7ed", color: "#D4881E" }}
            >
              <span className="font-medium">Servicio sugerido FORJA:</span>{" "}
              {lead.servicioSugeridoForja}
            </div>
          )}
        </DialogFooter>
      </DialogContent>

      <NewInteraccionModal
        open={showInteraccionModal}
        onClose={() => setShowInteraccionModal(false)}
        onSuccess={() => {
          setShowInteraccionModal(false);
          fetch("/api/interacciones")
            .then((r) => r.json())
            .then((data) => {
              const filtradas = (Array.isArray(data) ? data : [])
                .filter(
                  (i: Interaccion) =>
                    i.emailLead === lead.emailCorporativo ||
                    i.empresa === lead.nombreEmpresa
                )
                .slice(0, 3);
              setInteraccionesDelLead(filtradas);
            });
        }}
        datosPreCargados={{
          empresa: lead.nombreEmpresa,
          contacto: lead.nombreContacto,
          idLead: lead.id,
          emailLead: lead.emailCorporativo,
        }}
      />

      <NewTareaModal
        open={showTareaModal}
        onClose={() => setShowTareaModal(false)}
        onSuccess={() => setShowTareaModal(false)}
        datosPreCargados={
          showTareaModal && lead
            ? {
                relacionadoCon: "Lead",
                idReferencia: lead.id || "",
                empresa: lead.nombreEmpresa || "",
                asignadoA: lead.consultorAsignado || "",
              }
            : undefined
        }
      />

      <NewEventoModal
        open={showEventoModal}
        onClose={() => setShowEventoModal(false)}
        onSuccess={() => {
          setShowEventoModal(false);
          toast.success("Evento creado en tu Google Calendar");
        }}
        datosPreCargados={{
          titulo: "Seguimiento: " + lead.nombreEmpresa,
          tipo: "Seguimiento",
          cliente: lead.nombreEmpresa,
          idLead: lead.id,
          fecha: (() => {
            const m = new Date();
            m.setDate(m.getDate() + 1);
            return m.toISOString().split("T")[0];
          })(),
          horaInicio: "09:00",
          horaFin: "10:00",
          descripcion: "Seguimiento del lead " + lead.nombreEmpresa,
        }}
      />
    </Dialog>
  );
}
