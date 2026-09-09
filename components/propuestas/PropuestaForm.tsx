"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart2,
  Target,
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
import { generarCodigoPropuesta } from "@/lib/propuesta-codigo";
import { calcularInversion, formatCOP, formatUSD } from "@/lib/propuesta-finanzas";
import { toast } from "sonner";
import type { Propuesta } from "@/types/propuesta";

function hoyISO(): string {
  return new Date().toISOString().split("T")[0];
}

function masDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split("T")[0];
}

const FORM_DEFAULT: Partial<Propuesta> = {
  titulo: "",
  subtitulo: "",
  plantilla: "Estándar",
  idLead: "",
  emailCliente: "",
  empresaCliente: "",
  contacto: "",
  cargoContacto: "",
  sectorCliente: "",
  ciudadPais: "",
  nitCliente: "",
  consultor: "",
  servicioForja: "",
  codigoPropuesta: "",
  fechaCreacion: hoyISO(),
  fechaValidez: masDias(30),
  fraseClave: "",
  retoDescripcion: "",
  duracionMeses: "6",
  contextoNegocio: "",
  retosIdentificados: "",
  exclusionesAdicionales: "",
  hito1Meses: "Mes 1",
  hito2Meses: "Meses 2 y 3",
  hito3Meses: "Mes 4",
  hito4Meses: "Meses 5 y 6",
  horasSemanales: "",
  anticipoCOP: "",
  honorarioFase1COP: "",
  honorarioFase2COP: "",
  bonoPorHitoCOP: "",
  trmValor: "",
  trmFecha: hoyISO(),
  notasAdicionales: "",
  notasInternas: "",
  version: "v1.0",
  estado: "Borrador",
};

interface PropuestaFormProps {
  propuestaInicial?: Partial<Propuesta> | null;
  onGuardarBorrador: (data: Partial<Propuesta>) => Promise<void>;
  onEnviar: (data: Partial<Propuesta>) => Promise<void>;
  onFormChange?: (data: Partial<Propuesta>) => void;
  version?: string;
  isNew?: boolean;
}

function SeccionColapsable({
  titulo,
  icono: Icono,
  tieneContenido,
  abierta,
  onToggle,
  children,
}: {
  titulo: string;
  icono: React.ComponentType<{ className?: string }>;
  tieneContenido: boolean;
  abierta: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-6 py-4 text-left hover:bg-gray-50/50"
      >
        {abierta ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500" />
        )}
        <Icono className="h-5 w-5 text-[#1B3A5C]" />
        <span className="font-semibold text-[#1B3A5C]">{titulo}</span>
        {tieneContenido && <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />}
      </button>
      <AnimatePresence>
        {abierta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-6 py-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
    ...propuestaInicial,
  });

  useEffect(() => {
    onFormChange?.(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({
    resumen: true,
    entendimiento: true,
    alcance: false,
    hojaRuta: false,
    inversion: true,
    notas: false,
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
      fraseClave: contenido.fraseClave || prev.fraseClave,
      retoDescripcion: contenido.retoDescripcion || prev.retoDescripcion,
      contextoNegocio: contenido.contextoNegocio || prev.contextoNegocio,
      retosIdentificados: contenido.retosIdentificados || prev.retosIdentificados,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.name]);

  useEffect(() => {
    if (!form.codigoPropuesta && (form.titulo || form.empresaCliente)) {
      update({
        codigoPropuesta: generarCodigoPropuesta(
          form.id || Math.random().toString(36).slice(2),
          form.fechaCreacion ? new Date(form.fechaCreacion) : new Date()
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.titulo, form.empresaCliente]);

  const tieneContenido = (...keys: (keyof Propuesta)[]) =>
    keys.some((k) => {
      const v = form[k];
      return typeof v === "string" && v.trim().length > 0;
    });

  const inversionCalculada = calcularInversion({
    duracionMeses: form.duracionMeses,
    anticipoCOP: form.anticipoCOP,
    honorarioFase1COP: form.honorarioFase1COP,
    honorarioFase2COP: form.honorarioFase2COP,
    bonoPorHitoCOP: form.bonoPorHitoCOP,
    trmValor: form.trmValor,
  });

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
      await onGuardarBorrador({ ...form, estado: form.estado || "Borrador", version });
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
      await onEnviar({ ...form, version });
      toast.success(`Propuesta enviada exitosamente a ${form.emailCliente}`);
    } catch {
      toast.error("Error al enviar. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const numInput = (
    label: string,
    key: keyof Propuesta,
    placeholder = "0"
  ) => (
    <div>
      <Label>{label}</Label>
      <div className="relative mt-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <Input
          type="text"
          inputMode="numeric"
          value={(form[key] as string) || ""}
          onChange={(e) => update({ [key]: e.target.value.replace(/\D/g, "") } as Partial<Propuesta>)}
          placeholder={placeholder}
          className="pl-7"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Datos generales */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-[#1B3A5C]">Datos generales</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Nombre del proyecto *</Label>
            <Input
              value={form.titulo || ""}
              onChange={(e) => update({ titulo: e.target.value })}
              placeholder="ej. Estructuración del Modelo Operativo — TechStart SAS"
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Subtítulo / foco estratégico</Label>
            <Input
              value={form.subtitulo || ""}
              onChange={(e) => update({ subtitulo: e.target.value })}
              placeholder="ej. Diagnóstico, diseño operativo y hoja de ruta de crecimiento"
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
          <div>
            <Label>Código de propuesta</Label>
            <Input
              value={form.codigoPropuesta || ""}
              onChange={(e) => update({ codigoPropuesta: e.target.value })}
              placeholder="ARQ-2026-00001"
              className="mt-1"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
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
                setLeadSeleccionadoId(lead.id || lead.emailCorporativo || "");
                update({
                  idLead: lead.id || lead.emailCorporativo || "",
                  emailCliente: lead.emailCorporativo || "",
                  empresaCliente: lead.nombreEmpresa || "",
                  contacto: lead.nombreContacto || "",
                  cargoContacto: lead.cargo || form.cargoContacto,
                  sectorCliente: lead.sector || form.sectorCliente,
                  ciudadPais: [lead.ciudad, lead.pais].filter(Boolean).join(", ") || form.ciudadPais,
                  servicioForja: lead.servicioSugeridoForja || form.servicioForja,
                });
                const igm = parseFloat(lead.indiceMadurez || "0");
                if (igm > 0) {
                  const nivel =
                    igm < 2 ? "Inicial" : igm < 3 ? "Básico" : igm < 3.5 ? "Definido" : igm < 4.5 ? "Gestionado" : "Optimizado";
                  update({
                    retoDescripcion: `El diagnóstico de madurez empresarial de ${lead.nombreEmpresa} arroja un Índice Global de Madurez (IGM) de ${igm.toFixed(2)}/5, ubicándose en el nivel ${nivel}. Su principal reto identificado es: ${lead.retoPrincipal || "por definir"}.`,
                  });
                }
              }}
              placeholder="Selecciona un cliente..."
            />
          </div>
          <div>
            <Label>Cargo del interlocutor</Label>
            <Input
              value={form.cargoContacto || ""}
              onChange={(e) => update({ cargoContacto: e.target.value })}
              placeholder="ej. Gerente General"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Sector del cliente</Label>
            <Input
              value={form.sectorCliente || ""}
              onChange={(e) => update({ sectorCliente: e.target.value })}
              placeholder="ej. Retail"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Ciudad, país</Label>
            <Input
              value={form.ciudadPais || ""}
              onChange={(e) => update({ ciudadPais: e.target.value })}
              placeholder="ej. Bogotá, Colombia"
              className="mt-1"
            />
          </div>
          <div>
            <Label>C.C. / NIT del cliente</Label>
            <Input
              value={form.nitCliente || ""}
              onChange={(e) => update({ nitCliente: e.target.value })}
              placeholder="900.XXX.XXX-X"
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
            <Label>Deal relacionado</Label>
            <Input
              value={form.servicioForja || ""}
              onChange={(e) => update({ servicioForja: e.target.value })}
              placeholder="Nombre del proyecto o deal"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Duración (meses)</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={form.duracionMeses || ""}
              onChange={(e) => update({ duracionMeses: e.target.value.replace(/\D/g, "") })}
              placeholder="6"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Fecha de emisión</Label>
            <Input
              type="date"
              value={form.fechaCreacion || ""}
              onChange={(e) => update({ fechaCreacion: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Válida hasta</Label>
            <Input
              type="date"
              value={form.fechaValidez || ""}
              onChange={(e) => update({ fechaValidez: e.target.value })}
              className="mt-1"
            />
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

      {/* Resumen ejecutivo */}
      <SeccionColapsable
        titulo="Resumen ejecutivo"
        icono={FileText}
        tieneContenido={tieneContenido("fraseClave", "retoDescripcion")}
        abierta={seccionesAbiertas.resumen}
        onToggle={() => toggleSeccion("resumen")}
      >
        <div>
          <Label>Frase clave del reto (cita textual del cliente, o promesa central)</Label>
          <Input
            value={form.fraseClave || ""}
            onChange={(e) => update({ fraseClave: e.target.value })}
            placeholder='"Necesitamos crecer con orden, sin perder lo que nos hace fuertes."'
            className="mt-1"
          />
        </div>
        <div>
          <Label>Descripción del reto (2-3 frases)</Label>
          <Textarea
            value={form.retoDescripcion || ""}
            onChange={(e) => update({ retoDescripcion: e.target.value })}
            rows={4}
            className="mt-1 min-h-[100px] resize-y"
          />
        </div>
      </SeccionColapsable>

      {/* Entendimiento del reto */}
      <SeccionColapsable
        titulo="Entendimiento del reto"
        icono={BarChart2}
        tieneContenido={tieneContenido("contextoNegocio", "retosIdentificados")}
        abierta={seccionesAbiertas.entendimiento}
        onToggle={() => toggleSeccion("entendimiento")}
      >
        <div>
          <Label>Contexto de negocio (una idea por línea)</Label>
          <Textarea
            value={form.contextoNegocio || ""}
            onChange={(e) => update({ contextoNegocio: e.target.value })}
            placeholder={"Crecimiento sostenido con oportunidad de escalar\nModelo operativo dependiente de los fundadores"}
            rows={4}
            className="mt-1 min-h-[100px] resize-y"
          />
        </div>
        <div>
          <Label>Retos identificados (una idea por línea)</Label>
          <Textarea
            value={form.retosIdentificados || ""}
            onChange={(e) => update({ retosIdentificados: e.target.value })}
            placeholder={"Falta de procesos documentados\nDependencia crítica de personas clave"}
            rows={4}
            className="mt-1 min-h-[100px] resize-y"
          />
        </div>
      </SeccionColapsable>

      {/* Alcance */}
      <SeccionColapsable
        titulo="Alcance — exclusiones adicionales"
        icono={Target}
        tieneContenido={tieneContenido("exclusionesAdicionales")}
        abierta={seccionesAbiertas.alcance}
        onToggle={() => toggleSeccion("alcance")}
      >
        <p className="text-sm text-gray-500">
          El alcance estándar de ARQUIRON (qué sí y qué no incluye el acompañamiento) ya viene
          definido en la plantilla. Usa este campo solo si este proyecto excluye algo adicional.
        </p>
        <div>
          <Label>Otras exclusiones específicas del proyecto (una por línea)</Label>
          <Textarea
            value={form.exclusionesAdicionales || ""}
            onChange={(e) => update({ exclusionesAdicionales: e.target.value })}
            rows={3}
            className="mt-1 min-h-[80px] resize-y"
          />
        </div>
      </SeccionColapsable>

      {/* Hoja de ruta */}
      <SeccionColapsable
        titulo="Hoja de ruta"
        icono={Calendar}
        tieneContenido={tieneContenido("horasSemanales")}
        abierta={seccionesAbiertas.hojaRuta}
        onToggle={() => toggleSeccion("hojaRuta")}
      >
        <div>
          <Label>Horas semanales comprometidas por el cliente</Label>
          <Input
            type="text"
            inputMode="numeric"
            value={form.horasSemanales || ""}
            onChange={(e) => update({ horasSemanales: e.target.value.replace(/\D/g, "") })}
            placeholder="10"
            className="mt-1 max-w-[160px]"
          />
        </div>
        <p className="text-sm text-gray-500">
          Etiqueta de mes(es) de cada hito FORJA® (se usan también para armar el cronograma):
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Hito 1 — FIJAR</Label>
            <Input value={form.hito1Meses || ""} onChange={(e) => update({ hito1Meses: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Hito 2 — ORIENTAR + REDISEÑAR</Label>
            <Input value={form.hito2Meses || ""} onChange={(e) => update({ hito2Meses: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Hito 3 — JUSTIFICAR</Label>
            <Input value={form.hito3Meses || ""} onChange={(e) => update({ hito3Meses: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Hito 4 — ACOMPAÑAR</Label>
            <Input value={form.hito4Meses || ""} onChange={(e) => update({ hito4Meses: e.target.value })} className="mt-1" />
          </div>
        </div>
      </SeccionColapsable>

      {/* Inversión */}
      <SeccionColapsable
        titulo="Inversión"
        icono={DollarSign}
        tieneContenido={tieneContenido("anticipoCOP", "honorarioFase1COP", "honorarioFase2COP", "bonoPorHitoCOP")}
        abierta={seccionesAbiertas.inversion}
        onToggle={() => toggleSeccion("inversion")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {numInput("Anticipo a la firma (COP)", "anticipoCOP")}
          {numInput(`Honorario fase intensiva / mes (COP)`, "honorarioFase1COP")}
          {numInput(`Honorario fase acompañamiento / mes (COP)`, "honorarioFase2COP")}
          {numInput("Bono por hito (COP, ×4 hitos)", "bonoPorHitoCOP")}
          <div>
            <Label>TRM de referencia (COP por USD)</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={form.trmValor || ""}
              onChange={(e) => update({ trmValor: e.target.value.replace(/\D/g, "") })}
              placeholder="4000"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Fecha de la TRM</Label>
            <Input
              type="date"
              value={form.trmFecha || ""}
              onChange={(e) => update({ trmFecha: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div className="rounded-xl bg-[#f8faff] border border-[#e0e7ff] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Resumen calculado
          </p>
          <div className="grid grid-cols-2 gap-y-1.5 text-sm sm:grid-cols-4">
            <span className="text-gray-500">Subtotal fijo</span>
            <span className="font-semibold text-[#1B3A5C]">{formatCOP(inversionCalculada.subtotalFijoCOP)}</span>
            <span className="text-gray-500">IVA (19%)</span>
            <span className="font-semibold text-[#1B3A5C]">{formatCOP(inversionCalculada.ivaCOP)}</span>
            <span className="text-gray-500">Total con IVA</span>
            <span className="font-bold text-[#D4881E]">{formatCOP(inversionCalculada.totalConIvaCOP)}</span>
            <span className="text-gray-500">Equivalente USD</span>
            <span className="font-semibold text-[#1B3A5C]">
              {form.trmValor ? formatUSD(inversionCalculada.totalUSD) : "—"}
            </span>
          </div>
        </div>
      </SeccionColapsable>

      {/* Notas adicionales */}
      <SeccionColapsable
        titulo="Notas adicionales"
        icono={FileText}
        tieneContenido={tieneContenido("notasAdicionales")}
        abierta={seccionesAbiertas.notas}
        onToggle={() => toggleSeccion("notas")}
      >
        <p className="text-sm text-gray-500">
          El resto del documento (metodología FORJA®, equipo, gobierno, factores de éxito y
          condiciones comerciales) usa el contenido estándar de ARQUIRON. Si este proyecto
          necesita alguna aclaración o desviación puntual, agrégala aquí — aparecerá como una nota
          adicional en la Sección 10 del PDF.
        </p>
        <Textarea
          value={form.notasAdicionales || ""}
          onChange={(e) => update({ notasAdicionales: e.target.value })}
          rows={4}
          className="mt-1 min-h-[100px] resize-y"
        />
      </SeccionColapsable>

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
            <h3 className="text-xl font-bold text-[#1B3A5C]">¿Enviar propuesta?</h3>
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
                    No hay email de cliente asignado. Selecciona un cliente antes de enviar la
                    propuesta.
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Se enviará (con el PDF adjunto) desde{" "}
                <span className="font-medium text-[#1B3A5C]">contacto@arquiron.com</span>
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEnviarModal(false)} className="rounded-xl">
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
