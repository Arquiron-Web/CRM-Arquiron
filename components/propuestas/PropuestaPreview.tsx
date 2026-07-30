"use client";

import { generarHTMLPropuesta } from "@/lib/propuesta-template";
import type { Propuesta } from "@/types/propuesta";

interface PropuestaPreviewProps {
  data: Partial<Propuesta>;
}

export function PropuestaPreview({ data }: PropuestaPreviewProps) {
  const htmlContent = generarHTMLPropuesta(data);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl mb-4">
        <div className="flex items-center justify-between rounded-xl bg-[#1B3A5C] px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <span className="text-sm">👁</span>
            <span className="text-sm font-medium">
              Vista previa — Así verá el cliente esta propuesta
            </span>
          </div>
          <span className="text-xs text-blue-200">
            Solo vista — no se ha enviado aún
          </span>
        </div>
      </div>
      <div
        className="mx-auto max-w-2xl"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
