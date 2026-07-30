"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropuestaForm } from "@/components/propuestas/PropuestaForm";
import { PropuestaPreview } from "@/components/propuestas/PropuestaPreview";
import { generarDiagnosticoDesdeParams } from "@/lib/propuesta-utils";
import type { Propuesta } from "@/types/propuesta";

function NuevaPropuestaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"editar" | "preview">("editar");
  const [version, setVersion] = useState("v1.0");
  const [formData, setFormData] = useState<Partial<Propuesta>>({});
  const [editorSeed, setEditorSeed] = useState<Partial<Propuesta> | undefined>(undefined);

  const propuestaInicial = useMemo(() => {
    const empresa = searchParams.get("empresa");
    const email = searchParams.get("email");
    const igm = searchParams.get("igm");
    const dimDebil = searchParams.get("dimDebil");
    const servicio = searchParams.get("servicio");
    const id = searchParams.get("id");
    const contacto = searchParams.get("contacto");
    const sector = searchParams.get("sector");
    const pais = searchParams.get("pais");
    const tamano = searchParams.get("tamano");
    if (!empresa && !email) return undefined;
    const diagnostico = generarDiagnosticoDesdeParams({
      empresa: empresa ?? undefined,
      igm: igm ?? undefined,
      dimDebil: dimDebil ?? undefined,
    });
    return {
      idLead: id || undefined,
      empresaCliente: empresa || undefined,
      emailCliente: email || undefined,
      contacto: contacto || undefined,
      servicioForja: servicio || undefined,
      diagnostico: diagnostico || undefined,
      notasInternas: [sector, pais, tamano].filter(Boolean).length
        ? `Sector: ${sector || "—"}, País: ${pais || "—"}, Tamaño: ${tamano || "—"}`
        : undefined,
    } as Partial<Propuesta>;
  }, [searchParams]);

  const handleFormChange = useCallback((d: Partial<Propuesta>) => {
    setFormData((prev) => ({ ...prev, ...d }));
  }, []);

  const handleGuardarBorrador = async (data: Partial<Propuesta>) => {
    const payload = {
      ...data,
      id: data.id || "PROP-" + Date.now(),
      estado: "Borrador",
      version: version,
      timestamp: new Date().toISOString(),
    };
    const res = await fetch("/api/propuestas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Error al guardar");
    const result = await res.json();
    router.push(`/propuestas/${result.id || payload.id}/editar`);
  };

  const handleEnviar = async (data: Partial<Propuesta>) => {
    const ahora = new Date().toISOString();
    const payload = {
      ...data,
      id: data.id || "PROP-" + Date.now(),
      estado: "Enviada",
      fechaEnvio: ahora,
      version: version,
      timestamp: ahora,
    };
    const res = await fetch("/api/propuestas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Error al guardar");
    const result = await res.json();
    const resEnviar = await fetch("/api/propuestas/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, id: result.id || payload.id }),
    });
    if (!resEnviar.ok) throw new Error("Error al enviar");
    router.push("/propuestas");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/propuestas"
            className="text-sm text-gray-500 hover:text-[#1B3A5C]"
          >
            Propuestas
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-[#1B3A5C]">
            Nueva propuesta
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => {
                setEditorSeed(formData);
                setTab("editar");
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === "editar"
                  ? "bg-gray-100 text-[#1B3A5C]"
                  : "text-gray-600 hover:text-[#1B3A5C]"
              }`}
            >
              Editar
            </button>
            <button
              onClick={() => setTab("preview")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === "preview"
                  ? "bg-gray-100 text-[#1B3A5C]"
                  : "text-gray-600 hover:text-[#1B3A5C]"
              }`}
            >
              Vista Previa
            </button>
          </div>
          <Select value={version} onValueChange={(v) => setVersion(v ?? "v1.0")}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="v1.0">v1.0</SelectItem>
              <SelectItem value="v1.1">v1.1</SelectItem>
              <SelectItem value="v2.0">v2.0</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {tab === "editar" ? (
        <PropuestaForm
          propuestaInicial={editorSeed ?? propuestaInicial}
          onGuardarBorrador={handleGuardarBorrador}
          onEnviar={handleEnviar}
          onFormChange={handleFormChange}
          version={version}
          isNew={true}
        />
      ) : (
        <PropuestaPreview data={{ ...formData, version }} />
      )}
    </div>
  );
}

export default function NuevaPropuestaPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <NuevaPropuestaContent />
    </Suspense>
  );
}

