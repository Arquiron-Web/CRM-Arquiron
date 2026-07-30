"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import {
  Loader2,
  X,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  MapPin,
  Monitor,
  Clock,
  CalendarDays,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
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
import { ConsultorSelect } from "@/components/ui/ConsultorSelect";
import { LeadSelect } from "@/components/ui/LeadSelect";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/lead";
import { useLeads } from "@/hooks/useLeads";

const interaccionSchema = z.object({
  tipo: z.string().min(1, "Selecciona el tipo de interacción"),
  empresa: z.string().min(2, "Ingresa el nombre de la empresa"),
  contacto: z.string().min(2, "Ingresa el nombre del contacto"),
  titulo: z.string().min(3, "Ingresa un título descriptivo"),
  descripcion: z.string().min(10, "Describe la interacción"),
  resultado: z.string().optional(),
  duracion: z.string().optional(),
  fecha: z.string().min(1, "Selecciona la fecha"),
  hora: z.string().min(1, "Selecciona la hora"),
  consultor: z.string().min(2, "Ingresa el nombre del consultor"),
  idLead: z.string().optional(),
  emailLead: z.string().optional(),
  archivos: z.string().optional(),
});

type FormData = z.infer<typeof interaccionSchema>;

const TIPOS = [
  { value: "Llamada", label: "Llamada", icon: Phone },
  { value: "Email", label: "Email", icon: Mail },
  { value: "Reunión", label: "Reunión", icon: Calendar },
  { value: "WhatsApp", label: "WhatsApp", icon: MessageCircle },
  { value: "Visita", label: "Visita", icon: MapPin },
  { value: "Demo", label: "Demo", icon: Monitor },
];

const RESULTADOS = [
  "Excelente",
  "Positivo",
  "Neutral",
  "Negativo",
  "Sin respuesta",
];

const RESULTADO_PLACEHOLDER = "seleccionar";

function getLeadKey(lead: Lead, idx: number): string {
  return lead.id || lead.emailCorporativo || `idx-${idx}`;
}

interface DatosPreCargados {
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

interface NewInteraccionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  datosPreCargados?: DatosPreCargados;
  /** Mostrar banner "Pre-cargado desde Calendario" (solo cuando viene del evento) */
  origenCalendario?: boolean;
}

export function NewInteraccionModal({
  open,
  onClose,
  onSuccess,
  datosPreCargados,
  origenCalendario = false,
}: NewInteraccionModalProps) {
  const { data: session } = useSession();
  const defaultConsultor = session?.user?.name || "";
  const { leads } = useLeads();

  const [leadSeleccionadoId, setLeadSeleccionadoId] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(interaccionSchema),
    defaultValues: {
      tipo: "",
      empresa: "",
      contacto: "",
      titulo: "",
      descripcion: "",
      resultado: "",
      duracion: "",
      fecha: new Date().toISOString().split("T")[0],
      hora: new Date().toTimeString().slice(0, 5),
      consultor: defaultConsultor,
      idLead: "",
      emailLead: "",
      archivos: "",
    },
  });

  const tipo = watch("tipo");
  const watchEmpresa = watch("empresa");
  const watchContacto = watch("contacto");

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const defaults = {
      tipo: "",
      empresa: "",
      contacto: "",
      titulo: "",
      descripcion: "",
      resultado: "",
      duracion: "",
      fecha: now.toISOString().split("T")[0],
      hora: now.toTimeString().slice(0, 5),
      consultor: defaultConsultor,
      idLead: "",
      emailLead: "",
      archivos: "",
    };
    if (datosPreCargados) {
      reset({
        ...defaults,
        tipo: datosPreCargados.tipo ?? "",
        empresa: datosPreCargados.empresa ?? "",
        contacto: datosPreCargados.contacto ?? "",
        titulo: datosPreCargados.titulo ?? "",
        fecha: datosPreCargados.fecha ?? defaults.fecha,
        hora: datosPreCargados.hora ?? defaults.hora,
        consultor: datosPreCargados.consultor ?? defaultConsultor,
        descripcion: datosPreCargados.descripcion ?? "",
        idLead: datosPreCargados.idLead ?? "",
        emailLead: datosPreCargados.emailLead ?? "",
      });
      if (datosPreCargados.empresa && leads.length > 0) {
        const leadEncontrado = leads.find(
          (l, i) =>
            l.nombreEmpresa.toLowerCase().includes(datosPreCargados!.empresa!.toLowerCase()) ||
            l.id === datosPreCargados.idLead ||
            l.emailCorporativo === datosPreCargados.emailLead
        );
        if (leadEncontrado) {
          setLeadSeleccionadoId(getLeadKey(leadEncontrado, leads.indexOf(leadEncontrado)));
        } else {
          setLeadSeleccionadoId("");
        }
      } else if (datosPreCargados.idLead && leads.length > 0) {
        const leadEncontrado = leads.find(
          (l, i) =>
            l.id === datosPreCargados.idLead ||
            l.emailCorporativo === datosPreCargados.emailLead
        );
        if (leadEncontrado) {
          setLeadSeleccionadoId(getLeadKey(leadEncontrado, leads.indexOf(leadEncontrado)));
        } else {
          setLeadSeleccionadoId("");
        }
      } else {
        setLeadSeleccionadoId("");
      }
    } else {
      reset(defaults);
      setLeadSeleccionadoId("");
    }
  }, [open, datosPreCargados, defaultConsultor, reset, leads]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    const lead =
      leadSeleccionadoId && leadSeleccionadoId !== "sin_lead"
        ? leads.find((l, i) => getLeadKey(l, i) === leadSeleccionadoId)
        : null;

    try {
      const payload = {
        idLead: lead?.id || data.idLead || "",
        emailLead: lead?.emailCorporativo || data.emailLead || "",
        empresa: data.empresa.trim(),
        contacto: data.contacto.trim(),
        tipo: data.tipo,
        titulo: data.titulo.trim(),
        descripcion: data.descripcion.trim(),
        resultado: data.resultado || "",
        duracion: data.duracion || "",
        consultor: data.consultor.trim(),
        fecha: data.fecha,
        hora: data.hora,
        archivos: data.archivos || "0",
      };

      const res = await fetch("/api/interacciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }

      toast.success("Interacción registrada correctamente");
      handleClose();
      onSuccess();
    } catch {
      toast.error("Error al registrar. Intenta de nuevo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        className="!max-w-[720px] w-[90vw] flex flex-col gap-0 overflow-hidden rounded-2xl p-0 max-h-[92vh]"
        showCloseButton={false}
      >
        <div
          className="h-1 w-full shrink-0 rounded-t-2xl"
          style={{
            background: "linear-gradient(90deg, #D4881E, #8560C0)",
          }}
        />
        <div className="relative shrink-0 border-b border-gray-100 px-8 pt-6 pb-4">
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-6 top-6"
              />
            }
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </DialogClose>
          <DialogHeader className="mb-0 pr-10">
            <DialogTitle className="text-xl font-bold text-[#1B3A5C]">
              Registrar Interacción
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Registra una comunicación con un prospecto o cliente
            </p>
          </DialogHeader>

          {datosPreCargados && origenCalendario && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#1B3A5C]/20 bg-[#1B3A5C]/8 px-4 py-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-[#1B3A5C]" />
              <p className="text-sm font-medium text-[#1B3A5C]">
                Pre-cargado desde el evento del Calendario
              </p>
            </div>
          )}
        </div>

        <form id="new-interaccion-form" onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="mb-2 block">Tipo de interacción *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setValue("tipo", t.value)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border-2 py-3 px-4 text-sm font-medium transition-colors",
                        tipo === t.value
                          ? "border-[#1B3A5C] bg-[#1B3A5C]/8 text-[#1B3A5C]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      <t.icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  ))}
                </div>
                {errors.tipo && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.tipo.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-[#1B3A5C]">
                  Lead relacionado
                </Label>
                <LeadSelect
                  value={leadSeleccionadoId}
                  onChange={(lead) => {
                    if (!lead) {
                      setLeadSeleccionadoId("");
                      setValue("idLead", "");
                      setValue("emailLead", "");
                      setValue("empresa", "");
                      setValue("contacto", "");
                      return;
                    }
                    setLeadSeleccionadoId(
                      lead.id || lead.emailCorporativo || `idx-${leads.indexOf(lead)}`
                    );
                    setValue("idLead", lead.id || "", { shouldValidate: true });
                    setValue("emailLead", lead.emailCorporativo || "", {
                      shouldValidate: true,
                    });
                    setValue("empresa", lead.nombreEmpresa || "", {
                      shouldValidate: true,
                    });
                    setValue("contacto", lead.nombreContacto || "", {
                      shouldValidate: true,
                    });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="empresa">Empresa *</Label>
                <Input
                  id="empresa"
                  value={watchEmpresa || ""}
                  onChange={(e) => setValue("empresa", e.target.value)}
                  placeholder="Nombre de la empresa"
                  className="mt-1 rounded-xl border-gray-200 focus:border-[#33487A]"
                />
                {errors.empresa && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.empresa.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="contacto">Contacto *</Label>
                <Input
                  id="contacto"
                  value={watchContacto || ""}
                  onChange={(e) => setValue("contacto", e.target.value)}
                  placeholder="Nombre del contacto"
                  className="mt-1 rounded-xl border-gray-200 focus:border-[#33487A]"
                />
                {errors.contacto && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.contacto.message}
                  </p>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <Label htmlFor="titulo">Título de la interacción *</Label>
              <Input
                id="titulo"
                placeholder="Ej: Llamada de seguimiento, Reunión de presentación..."
                className="mt-1 rounded-xl border-gray-200 focus:border-[#33487A]"
                {...register("titulo")}
              />
              {errors.titulo && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.titulo.message}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                placeholder="Describe detalladamente lo que se trató, acuerdos alcanzados, próximos pasos..."
                rows={4}
                className="mt-1 resize-none rounded-xl border-gray-200 focus:border-[#33487A]"
                {...register("descripcion")}
              />
              {errors.descripcion && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.descripcion.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>Resultado</Label>
                <Select
                  value={watch("resultado") || RESULTADO_PLACEHOLDER}
                  onValueChange={(v) =>
                    setValue(
                      "resultado",
                      v === RESULTADO_PLACEHOLDER ? "" : (v ?? "")
                    )
                  }
                >
                  <SelectTrigger className="mt-1 rounded-xl border-gray-200 focus:border-[#33487A]">
                    <SelectValue placeholder="Selecciona el resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RESULTADO_PLACEHOLDER}>
                      Selecciona el resultado
                    </SelectItem>
                    {RESULTADOS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duracion">Duración</Label>
                <div className="relative mt-1">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="duracion"
                    type="text"
                    inputMode="numeric"
                    placeholder="Duración en minutos"
                    className="pl-9 pr-12 rounded-xl border-gray-200 focus:border-[#33487A]"
                    {...register("duracion")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    min
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  className="mt-1 rounded-xl border-gray-200 focus:border-[#33487A]"
                  {...register("fecha")}
                />
                {errors.fecha && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.fecha.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="hora">Hora *</Label>
                <Input
                  id="hora"
                  type="time"
                  className="mt-1 rounded-xl border-gray-200 focus:border-[#33487A]"
                  {...register("hora")}
                />
                {errors.hora && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.hora.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-[#1B3A5C]">
                  Consultor responsable <span className="text-[#D4881E]">*</span>
                </Label>
                <ConsultorSelect
                  value={watch("consultor") || ""}
                  onChange={(val) =>
                    setValue("consultor", val, { shouldValidate: true })
                  }
                  allowEmpty={false}
                />
                {errors.consultor && (
                  <p className="text-xs text-red-500">
                    {errors.consultor.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="archivos">Archivos adjuntos</Label>
                <Input
                  id="archivos"
                  placeholder="Ej: propuesta.pdf, contrato.docx"
                  className="mt-1 rounded-xl border-gray-200 focus:border-[#33487A]"
                  {...register("archivos")}
                />
                <p className="mt-0.5 text-xs text-gray-400">
                  (Solo registro — los archivos se adjuntan por email)
                </p>
              </div>
            </div>
        </div>
        </div>
        <div className="shrink-0 flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-white px-8 py-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-gray-200 px-6 py-2.5 text-sm font-medium hover:bg-gray-50"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-7 py-2.5 rounded-xl bg-[#1B3A5C] hover:bg-[#33487A] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {isSubmitting ? "Registrando..." : "Registrar Interacción"}
          </Button>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
