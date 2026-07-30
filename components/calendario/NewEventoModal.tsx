"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
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
import { useLeads } from "@/hooks/useLeads";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { TIPOS_EVENTO, type TipoEvento } from "@/types/evento";

interface DatosPreCargados {
  titulo?: string;
  tipo?: string;
  cliente?: string;
  idLead?: string;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  descripcion?: string;
}

interface NewEventoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  datosPreCargados?: DatosPreCargados;
  /** Mostrar banner "Seguimiento creado desde Interacciones" */
  origenInteracciones?: boolean;
}

const hoy = () => new Date().toISOString().slice(0, 10);

export function NewEventoModal({
  open,
  onClose,
  onSuccess,
  datosPreCargados,
  origenInteracciones = false,
}: NewEventoModalProps) {
  const { leads } = useLeads();
  const [submitting, setSubmitting] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoEvento>("Reunión");
  const [leadSeleccionadoId, setLeadSeleccionadoId] = useState("");
  const [cliente, setCliente] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("10:00");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    if (!open) return;
    if (datosPreCargados) {
      if (datosPreCargados.titulo) setTitulo(datosPreCargados.titulo);
      if (datosPreCargados.tipo) setTipo(datosPreCargados.tipo as TipoEvento);
      if (datosPreCargados.cliente) setCliente(datosPreCargados.cliente);
      if (datosPreCargados.idLead) setLeadSeleccionadoId(datosPreCargados.idLead);
      if (datosPreCargados.fecha) setFecha(datosPreCargados.fecha);
      if (datosPreCargados.horaInicio) setHoraInicio(datosPreCargados.horaInicio);
      if (datosPreCargados.horaFin) setHoraFin(datosPreCargados.horaFin);
      if (datosPreCargados.descripcion) setDescripcion(datosPreCargados.descripcion);
      if (datosPreCargados.cliente && leads.length > 0) {
        const leadEncontrado = leads.find((l) =>
          l.nombreEmpresa.toLowerCase().includes(datosPreCargados!.cliente!.toLowerCase())
        );
        if (leadEncontrado) {
          setLeadSeleccionadoId(
            leadEncontrado.id || leadEncontrado.emailCorporativo || ""
          );
          setCliente(leadEncontrado.nombreEmpresa || "");
        }
      }
    } else {
      setTitulo("");
      setTipo("Reunión");
      setLeadSeleccionadoId("");
      setCliente("");
      setFecha(hoy());
      setHoraInicio("09:00");
      setHoraFin("10:00");
      setUbicacion("");
      setDescripcion("");
    }
  }, [open, datosPreCargados, leads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("El título es requerido");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/calendario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          tipo,
          cliente: cliente || undefined,
          idLead: leadSeleccionadoId || undefined,
          fecha,
          horaInicio,
          horaFin,
          ubicacion: ubicacion || undefined,
          descripcion: descripcion || undefined,
          todoElDia: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || "Error al crear");
      }

      toast.success("Evento creado exitosamente");
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al crear el evento"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="!max-w-[620px] w-[88vw] flex flex-col gap-0 overflow-hidden rounded-2xl p-0 max-h-[88vh]"
        showCloseButton={true}
      >
        <div
          className="h-1 w-full shrink-0 rounded-t-2xl"
          style={{
            background: "linear-gradient(90deg, #33487A, #4CCED5)",
          }}
        />
        <div className="shrink-0 border-b border-gray-100 px-8 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold text-[#1B3A5C]">
            Nuevo Evento
          </DialogTitle>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {datosPreCargados && origenInteracciones && (
          <div className="flex items-center gap-2 rounded-xl border border-[#D4881E]/20 bg-[#D4881E]/8 px-4 py-3">
            <MessageSquare className="h-4 w-4 shrink-0 text-[#D4881E]" />
            <p className="text-sm font-medium text-[#D4881E]">
              Seguimiento creado desde Interacciones
            </p>
          </div>
        )}

          <div>
            <Label>Título del evento *</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="ej. Demo con cliente"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de evento</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoEvento)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_EVENTO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span
                        className="inline-block h-2 w-2 rounded-full mr-2"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[#1B3A5C]">
                Cliente / Lead
              </Label>
              <LeadSelect
                value={leadSeleccionadoId}
                onChange={(lead) => {
                  if (!lead) {
                    setLeadSeleccionadoId("");
                    setCliente("");
                    return;
                  }
                  setLeadSeleccionadoId(
                    lead.id || lead.emailCorporativo || ""
                  );
                  setCliente(lead.nombreEmpresa || "");
                }}
                placeholder="Seleccionar cliente (opcional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Hora inicio *</Label>
              <Input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Hora fin *</Label>
              <Input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Ubicación / Link</Label>
            <Input
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="ej. Google Meet, Zoom, Oficina cliente"
              className="mt-1"
            />
            {["Reunión", "Demo"].includes(tipo) && (
              <p className="mt-1 text-xs text-[#4CCED5]">
                Se creará un link de Google Meet automáticamente
              </p>
            )}
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Agenda, temas a tratar, preparación necesaria..."
              rows={3}
              className="mt-1 resize-none"
            />
          </div>

        </div>
        <div className="shrink-0 flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-white px-8 py-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-gray-200 px-6 py-2.5 text-sm font-medium hover:bg-gray-50"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#1B3A5C] px-7 py-2.5 text-sm font-semibold text-white hover:bg-[#33487A] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {submitting ? "Creando..." : "Crear evento"}
          </Button>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
