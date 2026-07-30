"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { PropuestaForm } from "@/components/propuestas/PropuestaForm";
import { PropuestaPreview } from "@/components/propuestas/PropuestaPreview";
import type { Propuesta } from "@/types/propuesta";

export default function EditarPropuestaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [propuesta, setPropuesta] = useState<Propuesta | null>(null);
  const [tab, setTab] = useState<"editar" | "preview">("editar");
  const [version, setVersion] = useState("v1.0");
  const [formData, setFormData] = useState<Partial<Propuesta>>({});
  const [editorSeed, setEditorSeed] = useState<Partial<Propuesta> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const propRes = await fetch("/api/propuestas");
        if (propRes.status === 401) {
          window.location.href = "/login";
          return;
        }
        const propuestas = await propRes.json();
        const p = propuestas.find((x: Propuesta) => x.id === id);
        setPropuesta(p || null);
        if (p) {
          setVersion(p.version || "v1.0");
          setFormData(p);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleGuardarBorrador = async (data: Partial<Propuesta>) => {
    if (!propuesta?.id) throw new Error("Sin id");
    const payload = { ...data, id: propuesta.id, estado: "Borrador" };
    const res = await fetch("/api/propuestas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Error al guardar");
    setPropuesta((prev) => (prev ? { ...prev, ...data } : null));
  };

  const handleEnviar = async (data: Partial<Propuesta>) => {
    if (!propuesta?.id) throw new Error("Sin id");
    const ahora = new Date().toISOString();
    const payload = {
      ...data,
      id: propuesta.id,
      estado: "Enviada",
      fechaEnvio: ahora,
    };
    const resPut = await fetch("/api/propuestas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resPut.ok) throw new Error("Error al guardar");
    const resEnviar = await fetch("/api/propuestas/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, ...data }),
    });
    if (!resEnviar.ok) throw new Error("Error al enviar");
    router.push("/propuestas");
  };

  const handleFormChange = useCallback((d: Partial<Propuesta>) => setFormData(d), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!propuesta) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-gray-600">Propuesta no encontrada</p>
        <Button onClick={() => router.push("/propuestas")} variant="outline">
          Volver a propuestas
        </Button>
      </div>
    );
  }

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
            {propuesta.titulo || "Editar propuesta"}
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
          propuestaInicial={editorSeed ?? propuesta}
          onGuardarBorrador={handleGuardarBorrador}
          onEnviar={handleEnviar}
          onFormChange={handleFormChange}
          version={version}
          isNew={false}
        />
      ) : (
        <PropuestaPreview data={{ ...formData, version }} />
      )}
    </div>
  );
}
