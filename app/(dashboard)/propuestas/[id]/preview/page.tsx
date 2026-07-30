"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropuestaPreview } from "@/components/propuestas/PropuestaPreview";
import type { Propuesta } from "@/types/propuesta";

export default function PreviewPropuestaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [propuesta, setPropuesta] = useState<Propuesta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/propuestas")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Propuesta[]) => {
        const p = list.find((x) => x.id === id);
        setPropuesta(p || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1B3A5C] border-t-transparent" />
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/propuestas"
            className="text-sm text-gray-500 hover:text-[#1B3A5C]"
          >
            Propuestas
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-[#1B3A5C]">
            Vista previa — {propuesta.titulo}
          </span>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/propuestas/${id}/editar`)}
          className="rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a editar
        </Button>
      </div>

      <PropuestaPreview data={propuesta} />
    </div>
  );
}
