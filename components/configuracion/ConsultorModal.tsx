"use client";

import { useState, useEffect } from "react";
import { useConsultores } from "@/hooks/useConsultores";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAIS_OPTS = [
  { value: "colombia", label: "🇨🇴 Colombia" },
  { value: "ecuador", label: "🇪🇨 Ecuador" },
  { value: "peru", label: "🇵🇪 Perú" },
  { value: "chile", label: "🇨🇱 Chile" },
  { value: "mexico", label: "🇲🇽 México" },
];

const CARGO_OPTS = [
  "CEO / Fundador",
  "Consultor Senior",
  "Consultor Junior",
  "Arquitecto Empresarial",
  "Especialista en Estrategia",
  "Especialista en Operaciones",
  "Especialista en Finanzas",
  "Especialista en Talento",
  "Especialista en Tecnología",
  "Especialista en Datos",
  "Especialista en CX",
  "Especialista en Innovación",
  "Marketing Digital",
  "Gestor Comercial",
];

const ESPECIALIDADES = [
  {
    pilar: "🏛 ADN Estratégico",
    color: "#1B3A5C",
    opciones: [
      "Estrategia y Dirección",
      "Gobierno Empresarial",
      "Sostenibilidad ASG",
    ],
  },
  {
    pilar: "⚙️ Motor Operativo",
    color: "#33487A",
    opciones: [
      "Operaciones y Supply Chain",
      "Finanzas y Rentabilidad",
      "Talento y Cultura",
    ],
  },
  {
    pilar: "🧠 Inteligencia Digital",
    color: "#8560C0",
    opciones: [
      "Estrategia Tecnológica",
      "Inteligencia de Datos",
      "Innovación y Agilidad",
    ],
  },
  {
    pilar: "💡 Enfoque al Cliente",
    color: "#D4881E",
    opciones: [
      "Experiencia del Cliente (CX)",
      "Estrategia Comercial",
    ],
  },
];

const TODAS_ESPECIALIDADES = ESPECIALIDADES.flatMap((g) => g.opciones);

export type ConsultorForm = {
  id?: string;
  nombre: string;
  email: string;
  cargo: string;
  especialidad: string;
  pais: string;
  ciudad: string;
  fechaIngreso: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: ConsultorForm | null;
};

export default function ConsultorModal({
  open,
  onClose,
  onSuccess,
  editData,
}: Props) {
  const { refetch } = useConsultores();
  const isEdit = !!editData?.id;
  const [form, setForm] = useState<ConsultorForm>({
    nombre: "",
    email: "",
    cargo: "",
    especialidad: "",
    pais: "colombia",
    ciudad: "",
    fechaIngreso: new Date().toISOString().slice(0, 10),
  });
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleEspecialidad = (valor: string) => {
    setEspecialidades((prev) =>
      prev.includes(valor) ? prev.filter((e) => e !== valor) : [...prev, valor]
    );
  };

  useEffect(() => {
    if (open) {
      if (editData) {
        setForm({
          id: editData.id,
          nombre: editData.nombre ?? "",
          email: editData.email ?? "",
          cargo: editData.cargo ?? "",
          especialidad: editData.especialidad ?? "",
          pais: editData.pais || "colombia",
          ciudad: editData.ciudad ?? "",
          fechaIngreso: editData.fechaIngreso || new Date().toISOString().slice(0, 10),
        });
        const partes = (editData.especialidad ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const seleccionadas = TODAS_ESPECIALIDADES.filter(
          (op) =>
            partes.includes(op) ||
            partes.some((p) => op.includes(p) || p.includes(op))
        );
        setEspecialidades(seleccionadas);
      } else {
        setForm({
          nombre: "",
          email: "",
          cargo: "",
          especialidad: "",
          pais: "colombia",
          ciudad: "",
          fechaIngreso: new Date().toISOString().slice(0, 10),
        });
        setEspecialidades([]);
      }
    }
  }, [open, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre?.trim() || !form.email?.trim()) {
      toast.error("Nombre y email son requeridos");
      return;
    }
    setSaving(true);
    try {
      const url = "/api/configuracion/consultores";
      if (isEdit) {
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: form.id,
            nombre: form.nombre,
            email: form.email,
            cargo: form.cargo,
            especialidad: especialidades.join(", "),
            pais: form.pais,
            ciudad: form.ciudad,
            fechaIngreso: form.fechaIngreso,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          refetch();
          toast.success("Consultor actualizado");
          onSuccess();
          onClose();
        } else {
          toast.error(data?.error || "Error al actualizar");
        }
      } else {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre,
            email: form.email,
            cargo: form.cargo,
            especialidad: especialidades.join(", "),
            pais: form.pais,
            ciudad: form.ciudad,
            fechaIngreso: form.fechaIngreso,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          refetch();
          toast.success("Consultor agregado");
          onSuccess();
          onClose();
        } else {
          toast.error(data?.error || "Error al guardar");
        }
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="!max-w-[620px] w-[88vw] flex flex-col gap-0 overflow-hidden rounded-2xl p-0 max-h-[88vh]"
        showCloseButton
      >
        <div className="h-1 w-full shrink-0 rounded-t-2xl bg-[#1B3A5C]" />
        <div className="shrink-0 border-b border-gray-100 px-8 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold text-[#1B3A5C]">
            {isEdit ? "Editar consultor" : "Agregar consultor"}
          </DialogTitle>
        </div>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre completo *</Label>
              <Input
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="juan@arquiron.com"
                disabled={isEdit}
              />
            </div>
            <div>
              <Label>Cargo *</Label>
              <Select
                value={form.cargo || ""}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, cargo: val ?? "" }))
                }
              >
                <SelectTrigger className="w-full mt-1.5 border-gray-200 focus:border-[#33487A] rounded-xl h-10">
                  <SelectValue placeholder="Selecciona un cargo" />
                </SelectTrigger>
                <SelectContent>
                  {CARGO_OPTS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  {isEdit &&
                    form.cargo &&
                    !CARGO_OPTS.includes(form.cargo) && (
                      <SelectItem value={form.cargo}>
                        {form.cargo}
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-sm font-semibold text-[#1B3A5C]">
                Especialidad
              </Label>
              <div className="space-y-3">
                {ESPECIALIDADES.map((grupo) => (
                  <div key={grupo.pilar}>
                    <p className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                      {grupo.pilar}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {grupo.opciones.map((opcion) => {
                        const seleccionado = especialidades.includes(opcion);
                        return (
                          <button
                            key={opcion}
                            type="button"
                            onClick={() => toggleEspecialidad(opcion)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-medium",
                              "border transition-all duration-150",
                              seleccionado
                                ? "text-white border-transparent"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                            )}
                            style={
                              seleccionado
                                ? {
                                    background: grupo.color,
                                    borderColor: grupo.color,
                                  }
                                : {}
                            }
                          >
                            {seleccionado && (
                              <span className="mr-1">✓</span>
                            )}
                            {opcion}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {especialidades.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Seleccionadas: {especialidades.join(" · ")}
                </p>
              )}
            </div>
            <div>
              <Label>País</Label>
              <select
                value={form.pais}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pais: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PAIS_OPTS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input
                value={form.ciudad}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ciudad: e.target.value }))
                }
                placeholder="Bogotá"
              />
            </div>
            <div>
              <Label>Fecha de ingreso</Label>
              <Input
                type="date"
                value={form.fechaIngreso}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fechaIngreso: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-white px-8 py-4">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-gray-200 px-6 py-2.5 text-sm font-medium hover:bg-gray-50">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#1B3A5C] px-7 py-2.5 text-sm font-semibold text-white hover:bg-[#33487A] transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar consultor"}
          </Button>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
