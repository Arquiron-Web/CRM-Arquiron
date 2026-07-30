"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAISES = [
  { value: "Colombia", label: "Colombia" },
  { value: "Ecuador", label: "Ecuador" },
  { value: "Perú", label: "Perú" },
  { value: "Chile", label: "Chile" },
  { value: "México", label: "México" },
  { value: "Otro", label: "Otro" },
];

const MONEDAS = [
  { value: "USD", label: "USD" },
  { value: "COP", label: "COP" },
  { value: "EUR", label: "EUR" },
];

const ZONAS = [
  { value: "America/Bogota", label: "America/Bogota — UTC-5" },
  { value: "America/Guayaquil", label: "America/Guayaquil — UTC-5" },
  { value: "America/Lima", label: "America/Lima — UTC-5" },
  { value: "America/Santiago", label: "America/Santiago — UTC-3/4" },
  { value: "America/Mexico_City", label: "America/Mexico_City — UTC-6" },
];

type Config = Record<string, string>;

export default function TabEmpresa() {
  const [config, setConfig] = useState<Config>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/configuracion/empresa")
      .then((r) => r.json())
      .then((d) => setConfig(d))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/configuracion/empresa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.updatedAt) setConfig(data);
        toast.success("Configuración guardada correctamente");
      } else {
        toast.error(data?.error || "Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 rounded-lg bg-gray-100" />;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-[#1B3A5C]">
        Información de la empresa
      </h2>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Columna izquierda */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Identidad</h3>
            <div>
              <Label>Nombre de la empresa *</Label>
              <Input
                value={config.nombreEmpresa ?? ""}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, nombreEmpresa: e.target.value }))
                }
                placeholder="Arquiron"
              />
            </div>
            <div>
              <Label>Slogan / Tagline</Label>
              <Input
                value={config.slogan ?? ""}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, slogan: e.target.value }))
                }
                placeholder="Arquitectura Empresarial para PYMEs"
              />
            </div>
            <div>
              <Label>Descripción corta</Label>
              <textarea
                value={config.descripcion ?? ""}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, descripcion: e.target.value }))
                }
                placeholder="Una línea sobre qué hace Arquiron"
                rows={3}
                className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Contacto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email corporativo *</Label>
                <Input
                  type="email"
                  value={config.email ?? ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, email: e.target.value }))
                  }
                  placeholder="contacto@arquiron.com"
                />
              </div>
              <div>
                <Label>Teléfono / WhatsApp</Label>
                <Input
                  value={config.telefono ?? ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, telefono: e.target.value }))
                  }
                  placeholder="+57 300 000 0000"
                />
              </div>
              <div>
                <Label>Sitio web</Label>
                <Input
                  type="url"
                  value={config.website ?? ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, website: e.target.value }))
                  }
                  placeholder="https://www.arquiron.com"
                />
              </div>
              <div>
                <Label>País</Label>
                <select
                  value={config.pais ?? "Colombia"}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, pais: e.target.value }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {PAISES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input
                value={config.ciudad ?? ""}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, ciudad: e.target.value }))
                }
                placeholder="Bogotá"
              />
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Moneda y región</h3>
            <div>
              <Label>Moneda principal</Label>
              <select
                value={config.moneda ?? "USD"}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, moneda: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {MONEDAS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Zona horaria</Label>
              <select
                value={config.zonaHoraria ?? "America/Bogota"}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, zonaHoraria: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {ZONAS.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Marca</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color primario</Label>
                <div className="flex gap-2 items-center mt-1.5">
                  <input
                    type="color"
                    value={config.colorPrimario ?? "#1B3A5C"}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        colorPrimario: e.target.value,
                      }))
                    }
                    className="h-10 w-14 rounded border cursor-pointer"
                  />
                  <Input
                    value={config.colorPrimario ?? "#1B3A5C"}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        colorPrimario: e.target.value,
                      }))
                    }
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <Label>Color de acento (CTA)</Label>
                <div className="flex gap-2 items-center mt-1.5">
                  <input
                    type="color"
                    value={config.colorSecundario ?? "#D4881E"}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        colorSecundario: e.target.value,
                      }))
                    }
                    className="h-10 w-14 rounded border cursor-pointer"
                  />
                  <Input
                    value={config.colorSecundario ?? "#D4881E"}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        colorSecundario: e.target.value,
                      }))
                    }
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Estos colores se usan en los emails de propuestas
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Logo</h3>
            <div>
              <Label>URL del logo</Label>
              <Input
                value={config.logoUrl ?? ""}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, logoUrl: e.target.value }))
                }
                placeholder="https://..."
              />
              {config.logoUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={config.logoUrl}
                    alt="Logo preview"
                    className="h-12 w-auto object-contain rounded"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Sube el logo a tu hosting y pega la URL aquí
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1B3A5C] text-white rounded-xl hover:bg-[#1e2747]"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
        <span className="text-xs text-gray-400">
          Última actualización:{" "}
          {config.updatedAt
            ? new Date(config.updatedAt).toLocaleString("es-CO")
            : "-"}
        </span>
      </div>
    </div>
  );
}
