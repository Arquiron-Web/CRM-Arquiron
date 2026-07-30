"use client"

import { useState, useEffect }     from "react"
import { useSession }              from "next-auth/react"
import { useForm }                 from "react-hook-form"
import { zodResolver }             from "@hookform/resolvers/zod"
import { z }                       from "zod"
import { Dialog, DialogContent }   from "@/components/ui/dialog"
import { ConfirmDialog }           from "@/components/ui/ConfirmDialog"
import { toast }                   from "sonner"
import { useLeads }                from "@/hooks/useLeads"
import { useConsultores }          from "@/hooks/useConsultores"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"

const schema = z.object({
  nombre:          z.string().min(2, "Ingresa el nombre del proyecto"),
  idLead:          z.string().optional(),
  empresaCliente:  z.string().min(1, "Ingresa la empresa"),
  contacto:        z.string().optional(),
  emailCliente:    z.string().email("Email inválido").optional().or(z.literal("")),
  consultor:       z.string().min(1, "Selecciona un consultor"),
  servicioForja:   z.string().min(1, "Selecciona el servicio"),
  valorUSD:        z.string().min(1, "Ingresa el valor"),
  fechaInicio:     z.string().min(1, "Selecciona la fecha de inicio"),
  fechaCierreEst:  z.string().optional(),
  igmInicial:      z.string().optional(),
  etapaForja:      z.string().optional(),
  estadoPago:      z.string().optional(),
  fechaProximaAccion: z.string().optional(),
  entregables:     z.string().optional(),
})

type FormData = z.infer<typeof schema>

const ETAPAS = [
  { letra: "F", nombre: "Fijar",     color: "#1B3A5C" },
  { letra: "O", nombre: "Orientar",  color: "#33487A" },
  { letra: "R", nombre: "Rediseñar", color: "#8560C0" },
  { letra: "J", nombre: "Justificar",color: "#D4881E" },
  { letra: "A", nombre: "Acompañar", color: "#22c55e" },
]

const SERVICIOS = [
  "ADN Estratégico — Diagnóstico Estratégico FORJA",
  "ADN Estratégico — Gobierno Corporativo PYME",
  "ADN Estratégico — Hoja de Ruta ASG",
  "Motor Operativo — Arquitectura Financiera",
  "Motor Operativo — Gestión del Talento",
  "Motor Operativo — Arquitectura de Procesos",
  "Inteligencia Digital — Estrategia Tecnológica",
  "Inteligencia Digital — Inteligencia de Datos",
  "Inteligencia Digital — Innovación y Agilidad",
  "Enfoque al Cliente — Arquitectura de CX",
]

interface Props {
  open:      boolean
  onClose:   () => void
  onSuccess: () => void
  datosPreCargados?: {
    idLead?: string
    empresaCliente?: string
    contacto?: string
    emailCliente?: string
    servicioForja?: string
    valorUSD?: string
    consultor?: string
  }
}

export function NewProyectoModal({ open, onClose, onSuccess, datosPreCargados }: Props) {
  const { data: session }     = useSession()
  const { leads }             = useLeads()
  const { consultores }       = useConsultores()
  const [saving, setSaving]   = useState(false)
  const [etapa, setEtapa]     = useState("Fijar")

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isDirty } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        etapaForja: "Fijar",
        estadoPago: "PENDIENTE",
      },
    })

  useEffect(() => {
    if (open) {
      setEtapa("Fijar")
      const hoy = new Date().toISOString().split("T")[0]
      // reset(valores) fija estos valores como la nueva línea base:
      // así el precargado desde un lead no cuenta como "cambio sin guardar".
      reset({
        etapaForja: "Fijar",
        estadoPago: "PENDIENTE",
        fechaInicio: hoy,
        consultor: datosPreCargados?.consultor || session?.user?.name || "",
        idLead: datosPreCargados?.idLead || "",
        empresaCliente: datosPreCargados?.empresaCliente || "",
        contacto: datosPreCargados?.contacto || "",
        emailCliente: datosPreCargados?.emailCliente || "",
        servicioForja: datosPreCargados?.servicioForja || "",
        valorUSD: datosPreCargados?.valorUSD || "",
      })
    }
  }, [open, session?.user?.name, datosPreCargados, reset])

  const [showConfirmDescartar, setShowConfirmDescartar] = useState(false)

  const handleClose = () => {
    if (isDirty) {
      setShowConfirmDescartar(true)
      return
    }
    onClose()
  }

  const confirmarDescarte = () => {
    setShowConfirmDescartar(false)
    onClose()
  }

  const handleLeadSelect = (leadId: string | null) => {
    if (leadId === "sin_lead" || !leadId) {
      setValue("idLead", "")
      setValue("empresaCliente", "", { shouldValidate: true })
      setValue("contacto", "")
      setValue("emailCliente", "")
      setValue("servicioForja", "")
      setValue("igmInicial", "")
      return
    }
    const lead = leads.find((l, i) => (l.id || l.emailCorporativo || `l${i}`) === leadId)
    if (!lead) return
    setValue("idLead",         lead.id || lead.emailCorporativo || "")
    setValue("empresaCliente", lead.nombreEmpresa || "",     { shouldValidate: true })
    setValue("contacto",       lead.nombreContacto || "")
    setValue("emailCliente",   lead.emailCorporativo || "")
    setValue("servicioForja",  lead.servicioSugeridoForja || "")
    if (lead.indiceMadurez && parseFloat(lead.indiceMadurez) > 0) {
      setValue("igmInicial", parseFloat(lead.indiceMadurez).toFixed(2))
    }
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload = {
        ...data,
        etapaForja: etapa,
        estadoProyecto: "ACTIVO",
        entregablesPendientes: data.entregables ?? "",
      }
      const res = await fetch("/api/proyectos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Error al crear")
      toast.success("Proyecto creado correctamente")
      onClose()
      onSuccess()
    } catch (e) {
      toast.error("Error al crear el proyecto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <Dialog open={open && !showConfirmDescartar} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="!max-w-[720px] w-[90vw] rounded-2xl p-0 gap-0 max-h-[92vh] flex flex-col overflow-hidden">

        <div className="h-1 rounded-t-2xl shrink-0" style={{ background: "linear-gradient(90deg,#1D1A70,#8560C0,#4CCED5)" }} />

        <div className="px-8 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-[#1B3A5C]">Nuevo Proyecto</h2>
          <p className="text-sm text-gray-500 mt-0.5">Registra un proyecto de consultoría activo</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 min-h-0">

            <div>
              <label className="text-sm font-semibold text-[#1B3A5C]">Nombre del proyecto *</label>
              <input {...register("nombre")}
                placeholder="ej. Implementación CRM — TechStart"
                className="mt-1.5 w-full h-10 px-4 rounded-xl border border-gray-200 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none bg-white" />
              {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#1B3A5C]">Lead / Cliente</label>
                <Select onValueChange={handleLeadSelect} value={watch("idLead") || "sin_lead"}>
                  <SelectTrigger className="mt-1.5 w-full border-gray-200 rounded-xl h-10 text-sm">
                    <SelectValue placeholder="Seleccionar lead...">
                      {(val: string | null) => {
                        if (val === "sin_lead") return "Sin lead asociado";
                        if (!val) return "Seleccionar lead...";
                        const l = leads.find(
                          (x, i) => (x.id || x.emailCorporativo || `l${i}`) === val
                        );
                        return l ? `${l.nombreEmpresa} · ${l.nombreContacto}` : "Seleccionar lead...";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60" alignItemWithTrigger={false}>
                    <SelectItem value="sin_lead"><span className="text-gray-400">Sin lead asociado</span></SelectItem>
                    {leads.map((l, i) => (
                      <SelectItem key={l.id || l.emailCorporativo || i} value={l.id || l.emailCorporativo || `l${i}`}>
                        <span className="text-sm">{l.nombreEmpresa} · {l.nombreContacto}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1B3A5C]">Servicio FORJA *</label>
                <Select value={watch("servicioForja") || ""} onValueChange={v => setValue("servicioForja", v ?? "", { shouldValidate: true })}>
                  <SelectTrigger className="mt-1.5 w-full border-gray-200 rounded-xl h-10 text-sm">
                    <SelectValue placeholder="Seleccionar servicio..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60" alignItemWithTrigger={false}>
                    {SERVICIOS.map(s => (
                      <SelectItem key={s} value={s}><span className="text-sm">{s}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.servicioForja && <p className="text-xs text-red-500 mt-1">{errors.servicioForja.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#1B3A5C]">Empresa *</label>
                <input {...register("empresaCliente")}
                  placeholder="Nombre de la empresa"
                  className="mt-1.5 w-full h-10 px-4 rounded-xl border border-gray-200 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none bg-white" />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1B3A5C]">Contacto</label>
                <input {...register("contacto")}
                  placeholder="Nombre del contacto"
                  className="mt-1.5 w-full h-10 px-4 rounded-xl border border-gray-200 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#1B3A5C]">Email cliente</label>
                <input {...register("emailCliente")}
                  placeholder="email@empresa.com"
                  className="mt-1.5 w-full h-10 px-4 rounded-xl border border-gray-200 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none bg-white" />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1B3A5C]">Consultor responsable *</label>
                <Select
                  value={watch("consultor") || ""}
                  onValueChange={v => setValue("consultor", v ?? "", { shouldValidate: true })}
                >
                  <SelectTrigger className="mt-1.5 w-full border-gray-200 rounded-xl h-10 text-sm">
                    <SelectValue placeholder="Seleccionar consultor..." />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {consultores.map(c => (
                      <SelectItem key={c.id || c.email} value={c.nombre}>
                        {c.nombre} {c.cargo ? `— ${c.cargo}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.consultor && <p className="text-xs text-red-500 mt-1">{errors.consultor.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#1B3A5C]">Valor USD *</label>
                <input {...register("valorUSD")} type="number"
                  placeholder="0"
                  className="mt-1.5 w-full h-10 px-4 rounded-xl border border-gray-200 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none bg-white" />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1B3A5C]">Fecha de inicio *</label>
                <input {...register("fechaInicio")} type="date"
                  className="mt-1.5 w-full h-10 px-4 rounded-xl border border-gray-200 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#1B3A5C]">Fecha cierre estimada</label>
                <input {...register("fechaCierreEst")} type="date"
                  className="mt-1.5 w-full h-10 px-4 rounded-xl border border-gray-200 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none bg-white" />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1B3A5C]">IGM Inicial</label>
                <input {...register("igmInicial")} type="number" step="0.1" min="1" max="5"
                  placeholder="Ej: 2.4"
                  className="mt-1.5 w-full h-10 px-4 rounded-xl border border-gray-200 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none bg-white" />
                <p className="text-xs text-gray-400 mt-1">
                  Se completa solo si el lead seleccionado ya tiene una evaluación en el módulo de Madurez. Si no la tiene, es opcional: déjalo en blanco o ingrésalo manualmente.
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#1B3A5C]">Etapa FORJA inicial</label>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {ETAPAS.map(e => (
                  <button key={e.letra} type="button"
                    onClick={() => { setEtapa(e.nombre); setValue("etapaForja", e.nombre) }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                    style={etapa === e.nombre
                      ? { background: e.color, borderColor: e.color, color: "#fff" }
                      : { background: "white", borderColor: "#e5e7eb", color: "#6b7280" }
                    }
                  >
                    <span className="font-black">{e.letra}</span> {e.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#1B3A5C]">Estado de pago inicial</label>
                <Select
                  value={watch("estadoPago") || "PENDIENTE"}
                  onValueChange={v => setValue("estadoPago", v ?? "PENDIENTE")}
                >
                  <SelectTrigger className="mt-1.5 border-gray-200 rounded-xl h-10 text-sm">
                    <SelectValue>
                      {(val: string | null) =>
                        ({ PENDIENTE: "Pendiente", PARCIAL: "50% recibido", COMPLETO: "Pago completo" } as Record<string, string>)[val || ""] || "Pendiente"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="PARCIAL">50% recibido</SelectItem>
                    <SelectItem value="COMPLETO">Pago completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1B3A5C]">Fecha próxima acción</label>
                <input {...register("fechaProximaAccion")} type="date"
                  className="mt-1.5 w-full h-10 px-4 rounded-xl border border-gray-200 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none bg-white" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#1B3A5C]">Entregables del proyecto</label>
              <textarea {...register("entregables")} rows={3}
                placeholder="• Diagnóstico estratégico&#10;• Roadmap 90 días&#10;• Manual de procesos"
                className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1B3A5C] focus:border-[#33487A] focus:outline-none resize-none bg-white" />
            </div>

          </div>

          <div className="px-8 py-4 border-t border-gray-100 bg-white shrink-0 flex items-center justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={handleClose}
              className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-7 py-2.5 rounded-xl bg-[#1B3A5C] hover:bg-[#33487A] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? "Creando..." : "Crear proyecto"}
            </button>
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
  )
}
