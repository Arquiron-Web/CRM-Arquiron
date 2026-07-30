"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
import { mapRetoPrincipalToServicio } from "@/lib/crm-utils";
import { toast } from "sonner";

const schema = z.object({
  nombreEmpresa: z.string().min(2, "Ingresa el nombre de la empresa"),
  sector: z.string().min(1, "Selecciona el sector"),
  tamano: z.string().min(1, "Selecciona el tamaño"),
  pais: z.string().min(1, "Selecciona el país"),
  ciudad: z.string().min(2, "Ingresa la ciudad"),
  retoPrincipal: z.string().min(1, "Selecciona el reto principal"),
  nombreContacto: z.string().min(2, "Ingresa el nombre completo"),
  cargo: z.string().min(2, "Ingresa el cargo"),
  emailCorporativo: z.string().email("Ingresa un email válido"),
  whatsapp: z.string().min(7, "Ingresa un número válido"),
  momentoContacto: z.string().min(1, "Selecciona cuándo contactarte"),
  consultorAsignado: z.string().optional(),
  estadoLead: z.string().optional(),
  notas: z.string().optional(),
  comoNosConocio: z.string().optional(),
  referidoPor: z.string().optional(),
}).refine(
  (data) =>
    data.comoNosConocio !== "referido" || (data.referidoPor && data.referidoPor.trim().length > 0),
  { message: "Selecciona quién refirió al lead", path: ["referidoPor"] }
);

type FormData = z.infer<typeof schema>;

const SECTOR_OPTS = [
  { value: "comercio_retail", label: "Comercio / Retail" },
  { value: "manufactura", label: "Manufactura y Agroindustria" },
  { value: "servicios_profesionales", label: "Servicios Profesionales y Consultoría" },
  { value: "tecnologia_digital", label: "Tecnología e Innovación Digital" },
  { value: "salud_bienestar", label: "Salud y Bienestar" },
  { value: "educacion", label: "Educación y Formación" },
  { value: "construccion", label: "Construcción e Inmobiliario" },
  { value: "agro", label: "Agro y Agricultura" },
  { value: "logistica", label: "Logística y Transporte" },
  { value: "turismo", label: "Turismo y Hotelería" },
  { value: "financiero_fintech", label: "Financiero / Fintech" },
  { value: "otro", label: "Otro sector" },
];

const TAMANO_OPTS = [
  { value: "micro", label: "Micro (1–10 empleados)" },
  { value: "pequena", label: "Pequeña (11–50 empleados)" },
  { value: "mediana", label: "Mediana (51–200 empleados)" },
  { value: "grande", label: "Grande (200+ empleados)" },
];

const PAIS_OPTS = [
  { value: "colombia", label: "🇨🇴 Colombia" },
  { value: "ecuador", label: "🇪🇨 Ecuador" },
  { value: "peru", label: "🇵🇪 Perú" },
  { value: "chile", label: "🇨🇱 Chile" },
  { value: "mexico", label: "🇲🇽 México" },
  { value: "panama", label: "🇵🇦 Panamá" },
  { value: "costa_rica", label: "🇨🇷 Costa Rica" },
  { value: "otro_latam", label: "🌎 Otro país LATAM" },
];

const RETO_OPTS = [
  { value: "sin_estrategia", label: "No tenemos una estrategia clara y ejecutable" },
  { value: "desalineamiento", label: "La tecnología no conecta con nuestros procesos" },
  { value: "financiero", label: "Flujo de caja, rentabilidad o acceso a crédito" },
  { value: "brecha_digital", label: "No hemos podido digitalizar nuestras operaciones" },
  { value: "talento", label: "Atraer, retener o desarrollar talento clave" },
  { value: "clientes", label: "Perdemos clientes y no sabemos cómo retenerlos" },
  { value: "normativo", label: "La carga regulatoria nos desborda" },
  { value: "productividad", label: "Operamos de forma manual, baja productividad" },
  { value: "otro", label: "Otro reto" },
];

const MOMENTO_OPTS = [
  { value: "urgente", label: "⚡ Lo antes posible" },
  { value: "semana", label: "📅 Esta semana" },
  { value: "mes", label: "🗓 En el próximo mes" },
  { value: "explorando", label: "🔍 Solo estoy explorando" },
];

interface NewLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewLeadModal({ open, onClose, onSuccess }: NewLeadModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombreEmpresa: "",
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
      consultorAsignado: "",
      estadoLead: "NUEVO",
      notas: "",
      comoNosConocio: "",
      referidoPor: "",
    },
  });

  const momentoContacto = watch("momentoContacto");
  const watchComoConocio = watch("comoNosConocio");
  const { leads, refetch: refetchLeads } = useLeads();
  const leadsGanados = leads.filter(
    (l) => l.estadoLead === "GANADO" || l.estadoLead === "Ganado"
  );

  const [showConfirmDescartar, setShowConfirmDescartar] = useState(false);

  const handleClose = () => {
    if (isDirty) {
      setShowConfirmDescartar(true);
      return;
    }
    reset();
    onClose();
  };

  const confirmarDescarte = () => {
    setShowConfirmDescartar(false);
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        nombreEmpresa: data.nombreEmpresa,
        sector: data.sector,
        tamano: data.tamano,
        pais: data.pais,
        ciudad: data.ciudad,
        retoPrincipal: data.retoPrincipal,
        nombreContacto: data.nombreContacto,
        cargo: data.cargo,
        emailCorporativo: data.emailCorporativo,
        whatsapp: data.whatsapp,
        momentoContacto: data.momentoContacto,
        consultorAsignado: data.consultorAsignado ?? "",
        comoNosConocio: data.comoNosConocio ?? "",
        referidoPor: data.referidoPor ?? "",
        notas: data.notas ?? "",
        servicioSugeridoForja: mapRetoPrincipalToServicio(data.retoPrincipal),
        estadoLead: data.estadoLead ?? "NUEVO",
        fuenteFormulario: "CRM_Manual",
        timestamp: new Date().toISOString(),
        id: "LEAD-" + Date.now(),
      };

      const res = await fetch("/api/leads/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("Respuesta del servidor:", result);

      if (!res.ok) {
        console.error("Error del servidor:", result);
        toast.error(
          result.detail || result.error || "Error al crear el lead"
        );
        return;
      }

      toast.success("Lead registrado correctamente");
      refetchLeads();
      handleClose();
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error de conexión";
      console.error("Error de red:", err);
      toast.error(message);
    }
  };

  return (
    <>
    <Dialog open={open && !showConfirmDescartar} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        className="!max-w-[720px] w-[90vw] flex flex-col gap-0 overflow-hidden rounded-2xl p-0 max-h-[92vh]"
        showCloseButton={false}
      >
        <div className="h-1 w-full shrink-0 rounded-t-2xl bg-[#1B3A5C]" />
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
          <DialogHeader className="pr-10">
            <DialogTitle className="text-xl font-bold text-[#1B3A5C]">
              Registrar Nuevo Lead
            </DialogTitle>
            <p className="mt-1 text-sm text-gray-500">
              Ingresa los datos del prospecto manualmente
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
              {/* Columna 1 — Tu Empresa */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B3A5C] text-xs font-bold text-white">
                    1
                  </div>
                  <span className="font-semibold text-[#1B3A5C]">Tu Empresa</span>
                  <div className="ml-2 h-px flex-1 bg-gray-100" />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombreEmpresa">Nombre de la empresa *</Label>
                    <Input
                      id="nombreEmpresa"
                      placeholder="Ej: TechStart SAS, Distribuidora Andina Ltda."
                      className="mt-1"
                      {...register("nombreEmpresa")}
                    />
                    {errors.nombreEmpresa && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.nombreEmpresa.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="sector">Sector *</Label>
                    <Controller
                      name="sector"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v ?? "")}
                        >
                          <SelectTrigger id="sector" className="mt-1">
                            <SelectValue placeholder="Selecciona tu sector">
                            {(val: string | null) =>
                              SECTOR_OPTS.find((o) => o.value === val)?.label || "Selecciona tu sector"
                            }
                          </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {SECTOR_OPTS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.sector && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.sector.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="tamano">Tamaño *</Label>
                    <Controller
                      name="tamano"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v ?? "")}
                        >
                          <SelectTrigger id="tamano" className="mt-1">
                            <SelectValue placeholder="Selecciona el tamaño">
                            {(val: string | null) =>
                              TAMANO_OPTS.find((o) => o.value === val)?.label || "Selecciona el tamaño"
                            }
                          </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {TAMANO_OPTS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.tamano && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.tamano.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="pais">País *</Label>
                    <Controller
                      name="pais"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v ?? "")}
                        >
                          <SelectTrigger id="pais" className="mt-1">
                            <SelectValue placeholder="Selecciona tu país">
                            {(val: string | null) =>
                              PAIS_OPTS.find((o) => o.value === val)?.label || "Selecciona tu país"
                            }
                          </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {PAIS_OPTS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.pais && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.pais.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="ciudad">Ciudad *</Label>
                    <Input
                      id="ciudad"
                      placeholder="Ej: Bogotá, Medellín, Lima"
                      className="mt-1"
                      {...register("ciudad")}
                    />
                    {errors.ciudad && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.ciudad.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="retoPrincipal">
                      ¿Cuál es tu mayor reto empresarial? *
                    </Label>
                    <Controller
                      name="retoPrincipal"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v ?? "")}
                        >
                          <SelectTrigger id="retoPrincipal" className="mt-1">
                            <SelectValue placeholder="Selecciona el reto principal">
                            {(val: string | null) =>
                              RETO_OPTS.find((o) => o.value === val)?.label || "Selecciona el reto principal"
                            }
                          </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {RETO_OPTS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.retoPrincipal && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.retoPrincipal.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna 2 — Tus Datos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B3A5C] text-xs font-bold text-white">
                    2
                  </div>
                  <span className="font-semibold text-[#1B3A5C]">Tus Datos</span>
                  <div className="ml-2 h-px flex-1 bg-gray-100" />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombreContacto">Nombre completo *</Label>
                    <Input
                      id="nombreContacto"
                      placeholder="Tu nombre completo"
                      className="mt-1"
                      {...register("nombreContacto")}
                    />
                    {errors.nombreContacto && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.nombreContacto.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cargo">Cargo *</Label>
                    <Input
                      id="cargo"
                      placeholder="Ej: CEO, Gerente General, Director de Operaciones"
                      className="mt-1"
                      {...register("cargo")}
                    />
                    {errors.cargo && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.cargo.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="emailCorporativo">Email corporativo *</Label>
                    <Input
                      id="emailCorporativo"
                      type="email"
                      placeholder="tu@empresa.com"
                      className="mt-1"
                      {...register("emailCorporativo")}
                    />
                    {errors.emailCorporativo && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.emailCorporativo.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp *</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="+57 300 123 4567"
                      className="mt-1"
                      {...register("whatsapp")}
                    />
                    {errors.whatsapp && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.whatsapp.message}
                      </p>
                    )}
                  </div>

                  <div role="group" aria-labelledby="momentoContacto-label">
                    <Label id="momentoContacto-label">¿Cuándo podemos contactarte? *</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {MOMENTO_OPTS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setValue("momentoContacto", o.value)}
                          className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                            momentoContacto === o.value
                              ? "border-[#D4881E] bg-[#D4881E]/10 text-[#1B3A5C]"
                              : "border-gray-200 text-gray-600 hover:border-[#33487A]"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    {errors.momentoContacto && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.momentoContacto.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="consultorAsignado">
                      Consultor asignado (opcional)
                    </Label>
                    <ConsultorSelect
                      id="consultorAsignado"
                      value={watch("consultorAsignado") || ""}
                      onChange={(val) =>
                        setValue("consultorAsignado", val, {
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="comoNosConocio">¿Cómo nos conoció?</Label>
                    <Controller
                      name="comoNosConocio"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={(v) => {
                            field.onChange(v ?? "");
                            if (v !== "referido") setValue("referidoPor", "");
                          }}
                        >
                          <SelectTrigger id="comoNosConocio" className="mt-1 border-gray-200 rounded-xl">
                            <SelectValue placeholder="Seleccionar...">
                            {(val: string | null) =>
                              ({
                                portal: "Portal Web",
                                evaluacion: "Evaluación de Madurez",
                                linkedin: "LinkedIn",
                                referido: "Referido por un cliente",
                                otro: "Otro",
                              } as Record<string, string>)[val || ""] || "Seleccionar..."
                            }
                          </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portal">Portal Web</SelectItem>
                            <SelectItem value="evaluacion">Evaluación de Madurez</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="referido">Referido por un cliente</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {watchComoConocio === "referido" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="referidoPor" className="text-sm font-semibold text-[#1B3A5C]">
                        ¿Quién lo refirió? *
                      </Label>
                      <Controller
                        name="referidoPor"
                        control={control}
                        rules={watchComoConocio === "referido" ? { required: "Selecciona el cliente" } : {}}
                        render={({ field }) => (
                          <Select
                            value={field.value || "_ninguno"}
                            onValueChange={(v) => field.onChange(v === "_ninguno" || v === "_vacio" ? "" : v ?? "")}
                          >
                            <SelectTrigger id="referidoPor" className="border-gray-200 rounded-xl h-10 mt-1.5">
                              <SelectValue placeholder="Seleccionar el cliente que refirió..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-64 overflow-y-auto">
                              <SelectItem value="_ninguno">
                                <span className="text-gray-400">Seleccionar cliente...</span>
                              </SelectItem>
                              {leadsGanados.map((lead, idx) => (
                                <SelectItem
                                  key={`ref-${lead.id || idx}`}
                                  value={`${lead.nombreEmpresa} (${lead.nombreContacto})`}
                                >
                                  <div className="flex flex-col py-0.5">
                                    <span className="font-medium text-[#1B3A5C] text-sm">
                                      {lead.nombreEmpresa}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {lead.nombreContacto}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                              {leadsGanados.length === 0 && (
                                <SelectItem value="_vacio" disabled>
                                  No hay clientes con estado Ganado aún
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.referidoPor && (
                        <p className="text-xs text-red-500">{errors.referidoPor.message}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Solo aparecen clientes con estado &quot;Ganado&quot;
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="estadoLead">Estado inicial</Label>
                    <EstadoSelect
                      id="estadoLead"
                      value={watch("estadoLead") || "NUEVO"}
                      onChange={(v) => setValue("estadoLead", v)}
                      className="mt-1 border-gray-200 focus:border-[#33487A] rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notas">Notas iniciales (opcional)</Label>
                    <Textarea
                      id="notas"
                      placeholder="Contexto adicional sobre este prospecto..."
                      rows={3}
                      className="mt-1 resize-none"
                      {...register("notas")}
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Footer fijo — siempre visible */}
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
                className="rounded-xl bg-[#1B3A5C] px-7 py-2.5 text-sm font-semibold text-white hover:bg-[#33487A] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isSubmitting ? "Guardando..." : "Crear lead"}
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={showConfirmDescartar}
      title="¿Descartar cambios?"
      description="Se perderá la información que ingresaste en este formulario."
      confirmLabel="Descartar"
      cancelLabel="Seguir editando"
      onConfirm={confirmarDescarte}
      onCancel={() => setShowConfirmDescartar(false)}
    />
    </>
  );
}
