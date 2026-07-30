"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Building2,
  MapPin,
  Video,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { TIPOS_EVENTO, type TipoEvento } from "@/types/evento";
import type { Evento } from "@/types/evento";
import type { Lead } from "@/types/lead";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useSession } from "next-auth/react";

function generarDescripcionSugerida(tipo: string, titulo: string): string {
  const sugerencias: Record<string, string> = {
    Llamada:
      "Durante la llamada se discutió: \n\nPróximos pasos acordados: ",
    Reunión:
      "Temas tratados en la reunión: \n\nAcuerdos y compromisos: \n\nPróximos pasos: ",
    Demo:
      "Se realizó demo de los servicios Arquiron.\nReacción del cliente: \n\nIntereses identificados: \n\nSiguiente paso: ",
    Seguimiento:
      "Seguimiento realizado sobre: \n\nEstado actual: \n\nAcciones definidas: ",
    Propuesta:
      "Se presentó la propuesta comercial.\nFeedback del cliente: \n\nObjeciones: \n\nDecisión esperada para: ",
  };
  return sugerencias[tipo] || "Descripción de la interacción: ";
}

export interface DatosInteraccionPreCargados {
  tipo?: string;
  empresa?: string;
  contacto?: string;
  titulo?: string;
  fecha?: string;
  hora?: string;
  consultor?: string;
  descripcion?: string;
  idLead?: string;
  emailLead?: string;
}

interface EventoDetailModalProps {
  evento: Evento | null;
  open: boolean;
  onClose: () => void;
  onEliminado: (id: string) => void;
  onActualizado: () => void;
  onRegistrarInteraccion?: (datos: DatosInteraccionPreCargados) => void;
}

function getTipoConfig(tipo: string) {
  return TIPOS_EVENTO.find((t) => t.value === tipo) || TIPOS_EVENTO[5];
}

function extraerHora(iso: string): string {
  if (!iso || iso.length <= 10) return "";
  try {
    const d = parseISO(iso);
    return format(d, "HH:mm");
  } catch {
    return "";
  }
}

export function EventoDetailModal({
  evento,
  open,
  onClose,
  onEliminado,
  onActualizado,
  onRegistrarInteraccion,
}: EventoDetailModalProps) {
  const { data: session } = useSession();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [showConfirmEliminar, setShowConfirmEliminar] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoEvento>("Evento");
  const [cliente, setCliente] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    if (!evento || !open) return;

    setTitulo(evento.titulo);
    setTipo((evento.tipo as TipoEvento) || "Evento");
    setCliente(evento.cliente);
    setUbicacion(evento.ubicacion);
    setDescripcion(evento.descripcion || "");

    if (evento.inicio) {
      try {
        const d = parseISO(evento.inicio);
        setFecha(format(d, "yyyy-MM-dd"));
        if (evento.inicio.length > 10) {
          setHoraInicio(format(d, "HH:mm"));
        }
      } catch {
        setFecha(evento.inicio.slice(0, 10));
      }
    }
    if (evento.fin && evento.fin.length > 10) {
      try {
        const d = parseISO(evento.fin);
        setHoraFin(format(d, "HH:mm"));
      } catch {}
    }

    setModoEdicion(false);
    setShowConfirmEliminar(false);

    fetch("/api/leads")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const mapa = new Map<string, Lead>();
        (Array.isArray(data) ? data : []).forEach((lead: Lead) => {
          const key = lead.id || lead.emailCorporativo;
          if (key && !mapa.has(key)) mapa.set(key, lead);
        });
        setLeads(Array.from(mapa.values()));
      })
      .catch(() => {});
  }, [evento, open]);

  const handleGuardarEdicion = async () => {
    if (!evento) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/calendario/${evento.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          tipo,
          cliente: cliente || undefined,
          fecha,
          horaInicio: horaInicio || "09:00",
          horaFin: horaFin || "10:00",
          ubicacion: ubicacion || undefined,
          descripcion: descripcion || undefined,
          todoElDia: !horaInicio && !horaFin,
        }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      toast.success("Evento actualizado");
      setModoEdicion(false);
      onActualizado();
    } catch {
      toast.error("Error al actualizar el evento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegistrarInteraccion = () => {
    if (!evento || !onRegistrarInteraccion) return;
    const fechaEvento = new Date(evento.inicio);
    const fecha = fechaEvento.toISOString().split("T")[0];
    const hora = fechaEvento.toTimeString().slice(0, 5);

    onRegistrarInteraccion({
      tipo: evento.tipo,
      empresa: evento.cliente || "",
      titulo: "Seguimiento: " + evento.titulo,
      fecha,
      hora,
      consultor: session?.user?.name || "",
      descripcion: generarDescripcionSugerida(evento.tipo, evento.titulo),
    });
    onClose();
  };

  const handleEliminar = async () => {
    if (!evento) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/calendario/${evento.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Evento eliminado");
      onEliminado(evento.id);
      onClose();
    } catch {
      toast.error("Error al eliminar el evento");
    } finally {
      setSubmitting(false);
      setShowConfirmEliminar(false);
    }
  };

  if (!evento) return null;

  const cfg = getTipoConfig(evento.tipo);
  const fechaLarga = evento.inicio
    ? format(parseISO(evento.inicio), "EEEE, d 'de' MMMM 'de' yyyy", {
        locale: es,
      })
    : "";
  const fechaLargaCapitalizada =
    fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1);

  return (
    <>
    <Dialog open={open && !showConfirmEliminar} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="!max-w-[620px] w-[88vw] flex flex-col gap-0 overflow-hidden rounded-2xl p-0 max-h-[88vh]"
        showCloseButton={true}
      >
        <div
          className="h-1 w-full shrink-0 rounded-t-2xl"
          style={{ background: "linear-gradient(90deg, #33487A, #4CCED5)" }}
        />
        <DialogHeader className="shrink-0 border-b border-gray-100 px-8 pt-7 pb-5">
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${cfg.bgClass} ${cfg.textClass}`}
            >
              {evento.tipo}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-[#1B3A5C] mt-2">
            {evento.titulo}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {!modoEdicion ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#1B3A5C]">Fecha</p>
                  <p className="text-sm text-gray-600">{fechaLargaCapitalizada}</p>
                </div>
              </div>
              {!evento.todoElDia && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#1B3A5C]">Hora</p>
                    <p className="text-sm text-gray-600">
                      {extraerHora(evento.inicio)} - {extraerHora(evento.fin)}
                    </p>
                  </div>
                </div>
              )}
              {evento.cliente && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#1B3A5C]">Cliente</p>
                    <p className="text-sm text-gray-600">{evento.cliente}</p>
                  </div>
                </div>
              )}
              {(evento.link || evento.ubicacion) && (
                <div className="flex items-start gap-3">
                  {evento.link?.startsWith("http") ? (
                    <Video className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  ) : (
                    <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-[#1B3A5C]">
                      {evento.link?.startsWith("http")
                        ? "Reunión"
                        : "Ubicación"}
                    </p>
                    {evento.link?.startsWith("http") ? (
                      <a
                        href={evento.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#4CCED5] hover:underline"
                      >
                        Unirse a la reunión
                      </a>
                    ) : (
                      <p className="text-sm text-gray-600">{evento.ubicacion}</p>
                    )}
                  </div>
                </div>
              )}
              {evento.descripcion && (
                <div>
                  <p className="text-sm font-medium text-[#1B3A5C] mb-1">
                    Descripción
                  </p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {evento.descripcion}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as TipoEvento)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_EVENTO.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Input
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Hora inicio</Label>
                  <Input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Hora fin</Label>
                  <Input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Ubicación</Label>
                <Input
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  className="mt-1 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-wrap items-center justify-end gap-2 rounded-b-2xl border-t border-gray-100 bg-white px-8 py-4">
            {!modoEdicion ? (
              <>
                {new Date(evento.inicio) < new Date() && onRegistrarInteraccion && (
                  <Button
                    onClick={handleRegistrarInteraccion}
                    className="rounded-xl bg-[#D4881E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#EC8E48]"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Registrar interacción
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="rounded-xl border-gray-200 hover:bg-gray-50"
                  onClick={() => setModoEdicion(true)}
                >
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => setShowConfirmEliminar(true)}
                  disabled={submitting}
                >
                  Eliminar
                </Button>
                {evento.htmlLink && (
                  <a
                    href={evento.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto"
                  >
                    <Button
                      variant="outline"
                      className="rounded-xl border-gray-200 hover:bg-gray-50"
                      type="button"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir en Google Calendar
                    </Button>
                  </a>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="rounded-xl border-gray-200 hover:bg-gray-50"
                  onClick={() => setModoEdicion(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="rounded-xl bg-[#1B3A5C] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#33487A]"
                  onClick={handleGuardarEdicion}
                  disabled={submitting}
                >
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
              </>
            )}
        </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={showConfirmEliminar} onOpenChange={setShowConfirmEliminar}>
      <DialogContent className="!max-w-[480px] w-[88vw] rounded-2xl p-0 overflow-hidden" showCloseButton={true}>
        <div className="h-1 w-full rounded-t-2xl bg-[#ef4444]" />
        <div className="px-8 pt-7 pb-5">
        <DialogHeader>
          <DialogTitle>¿Eliminar este evento?</DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            Esta acción no se puede deshacer y eliminará el evento de tu Google
            Calendar.
          </p>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowConfirmEliminar(false)}
            className="rounded-xl px-6"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl px-6 bg-red-500 hover:bg-red-600"
            onClick={handleEliminar}
            disabled={submitting}
          >
            Eliminar
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
