"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DollarSign, Loader2, X } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
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
import { EstadoSelect } from "@/components/ui/EstadoSelect";
import { ConsultorSelect } from "@/components/ui/ConsultorSelect";
import { LeadSelect } from "@/components/ui/LeadSelect";
import { toast } from "sonner";

const dealSchema = z.object({
  tituloDeal: z.string().min(2, "Ingresa el título del deal"),
  empresa: z.string().min(2, "Ingresa el nombre de la empresa"),
  valorUSD: z.string().min(1, "Ingresa el valor"),
  estadoLead: z.string().optional(),
  probabilidad: z.string().optional(),
  asignarA: z.string().optional(),
  fechaCierre: z.string().optional(),
  notas: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

const PROBABILIDAD_OPTS = [
  { value: "25", label: "25% - Baja" },
  { value: "40", label: "40% - Media-Baja" },
  { value: "60", label: "60% - Media" },
  { value: "75", label: "75% - Media-Alta" },
  { value: "90", label: "90% - Alta" },
];

interface NewDealModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewDealModal({
  open,
  onClose,
  onSuccess,
}: NewDealModalProps) {
  const [leadSeleccionadoId, setLeadSeleccionadoId] = useState("");
  const { refetch: refetchLeads } = useLeads();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      tituloDeal: "",
      empresa: "",
      valorUSD: "",
      estadoLead: "NUEVO",
      probabilidad: "25",
      asignarA: "",
      fechaCierre: "",
      notas: "",
    },
  });

  const handleClose = () => {
    reset();
    setLeadSeleccionadoId("");
    onClose();
  };

  const onSubmit = async (data: DealFormData) => {
    const valorNum = parseFloat(data.valorUSD.replace(/\D/g, ""));
    if (isNaN(valorNum) || valorNum <= 0) {
      toast.error("Ingresa un valor válido");
      return;
    }

    const consultorFinal = data.asignarA || "";
    const estadoLead = data.estadoLead || "NUEVO";
    const probabilidad = data.probabilidad || "25";
    const probLabel = PROBABILIDAD_OPTS.find((p) => p.value === probabilidad)?.label || probabilidad + "%";
    const notasCompletas = `Valor: $${data.valorUSD} USD | Probabilidad: ${probLabel} | Cierre: ${data.fechaCierre || "No definido"} | ${data.notas || ""}`;

    try {
      const payload = {
        id: "DEAL-" + Date.now(),
        nombreEmpresa: data.empresa.trim(),
        servicioSugeridoForja: data.tituloDeal.trim(),
        estadoLead,
        consultorAsignado: consultorFinal,
        notas: notasCompletas.trim(),
        valor: valorNum,
        scoreLead: probabilidad,
        fuenteFormulario: "CRM_Manual",
        timestamp: new Date().toISOString(),
        sector: "",
        tamano: "",
        pais: "",
        ciudad: "",
        retoPrincipal: "",
        nombreContacto: "",
        cargo: "",
        emailCorporativo: "",
        whatsapp: "",
        momentoContacto: "",
      };

      const res = await fetch("/api/leads/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }

      toast.success("Deal creado correctamente");
      refetchLeads();
      handleClose();
      onSuccess();
    } catch (err) {
      toast.error("Error al crear el deal. Intenta de nuevo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        className="!max-w-[680px] w-[90vw] flex flex-col gap-0 overflow-hidden rounded-2xl p-0 max-h-[92vh]"
        showCloseButton={false}
      >
        <div
          className="h-1 w-full shrink-0 rounded-t-2xl"
          style={{ background: "linear-gradient(90deg, #1B3A5C, #8560C0)" }}
        />
        <DialogHeader className="relative shrink-0 border-b border-gray-100 px-8 pt-7 pb-5 pr-16">
          <DialogTitle className="text-xl font-bold text-[#1B3A5C]">
            Nuevo Deal
          </DialogTitle>
          <DialogClose
            render={
              <Button variant="ghost" size="icon" className="absolute right-0 top-0" />
            }
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6">
        <form id="deal-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#1B3A5C]">
              Lead relacionado
            </Label>
            <LeadSelect
              value={leadSeleccionadoId}
              onChange={(lead) => {
                if (!lead) {
                  setLeadSeleccionadoId("");
                  return;
                }
                setLeadSeleccionadoId(lead.id || lead.emailCorporativo || "");
                setValue("empresa", lead.nombreEmpresa, { shouldValidate: true });
              }}
            />
          </div>
          <div>
            <Label htmlFor="tituloDeal">Título del deal *</Label>
            <Input
              id="tituloDeal"
              placeholder="ej. Implementación CRM"
              className="mt-1 focus-visible:border-[#4CCED5] focus-visible:ring-[#4CCED5]"
              {...register("tituloDeal")}
            />
            {errors.tituloDeal && (
              <p className="mt-0.5 text-xs text-red-500">
                {errors.tituloDeal.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="empresa">Empresa *</Label>
            <Input
              id="empresa"
              placeholder="Nombre de la empresa"
              className="mt-1"
              {...register("empresa")}
            />
            {errors.empresa && (
              <p className="mt-0.5 text-xs text-red-500">
                {errors.empresa.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="valorUSD">Valor (USD) *</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="valorUSD"
                type="text"
                inputMode="numeric"
                placeholder="45000"
                className="pl-9 focus-visible:border-[#4CCED5] focus-visible:ring-[#4CCED5]"
                {...register("valorUSD")}
              />
            </div>
            {errors.valorUSD && (
              <p className="mt-0.5 text-xs text-red-500">
                {errors.valorUSD.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="estadoLead">Estado</Label>
            <EstadoSelect
              value={watch("estadoLead") || "NUEVO"}
              onChange={(v) => setValue("estadoLead", v)}
              excluir={["PERDIDO"]}
              className="mt-1 border-gray-200 focus:border-[#33487A] rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="probabilidad">Probabilidad (%)</Label>
            <Select
              value={watch("probabilidad") || "25"}
              onValueChange={(v) => setValue("probabilidad", v ?? "25")}
            >
              <SelectTrigger className="mt-1">
                <SelectValue>
                  {(val: string | null) =>
                    PROBABILIDAD_OPTS.find((p) => p.value === val)?.label || "25% - Baja"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PROBABILIDAD_OPTS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#1B3A5C]">
              Asignar a
            </Label>
            <ConsultorSelect
              value={watch("asignarA") || ""}
              onChange={(val) => setValue("asignarA", val)}
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="fechaCierre">Fecha estimada de cierre</Label>
            <Input
              id="fechaCierre"
              type="date"
              className="mt-1 w-full"
              {...register("fechaCierre")}
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              placeholder="Detalles adicionales del deal..."
              rows={4}
              className="mt-1 resize-none"
              {...register("notas")}
            />
          </div>
        </form>
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
            form="deal-form"
            disabled={isSubmitting}
            className="rounded-xl bg-[#1B3A5C] px-7 py-2.5 text-sm font-semibold text-white hover:bg-[#33487A] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isSubmitting ? "Creando..." : "Crear deal"}
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
