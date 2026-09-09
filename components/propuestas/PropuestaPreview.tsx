"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Propuesta } from "@/types/propuesta";

interface PropuestaPreviewProps {
  data: Partial<Propuesta>;
}

/**
 * Muestra el PDF real de la propuesta (el mismo que se adjunta en el
 * correo) generado por /api/propuestas/pdf, en un iframe. Así la vista
 * previa es el documento que se va a enviar, no una aproximación.
 */
export function PropuestaPreview({ data }: PropuestaPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);

    fetch("/api/propuestas/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || err.error || "No se pudo generar el PDF");
        }
        return res.blob();
      })
      .then((blob) => {
        if (cancelado) return;
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const nuevoUrl = URL.createObjectURL(blob);
        blobUrlRef.current = nuevoUrl;
        setUrl(nuevoUrl);
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : "Error al generar el PDF");
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[600px] flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl bg-[#1B3A5C] px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="text-sm">📄</span>
          <span className="text-sm font-medium">
            Vista previa del PDF — así se verá y se enviará al cliente
          </span>
        </div>
        <span className="text-xs text-blue-200">Solo vista — no se ha enviado aún</span>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Generando PDF...</span>
          </div>
        )}
        {!loading && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-gray-500">
            <span className="text-sm text-red-500">{error}</span>
          </div>
        )}
        {url && (
          <iframe
            src={url}
            title="Vista previa de la propuesta"
            className="h-full w-full border-0"
          />
        )}
      </div>
    </div>
  );
}
