"use client";

import { useLeads } from "@/hooks/useLeads";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TabReferidos() {
  const { leads } = useLeads();

  const totalReferidos = leads.filter((l) => l.comoNosConocio === "referido").length;
  const referidosConvertidos = leads.filter(
    (l) => l.comoNosConocio === "referido" && l.estadoLead === "GANADO"
  ).length;
  const tasaReferidos =
    totalReferidos > 0
      ? Math.round((referidosConvertidos / totalReferidos) * 100)
      : 0;

  const leadsGanados = leads.filter((l) => l.estadoLead === "GANADO");
  const embajadores: { lead: (typeof leads)[0]; count: number }[] = leadsGanados.map(
    (lead) => {
      const empresaLabel = `${lead.nombreEmpresa} (${lead.nombreContacto})`;
      const count = leads.filter(
        (l) =>
          l.comoNosConocio === "referido" &&
          l.notas?.includes(`Referido por: ${empresaLabel}`)
      ).length;
      return { lead, count };
    }
  );
  const topEmbajadores = embajadores
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#1B3A5C]">
          Programa de Referidos
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Gestiona y visualiza el canal de referidos
        </p>
      </div>

      {/* Estadísticas */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="mb-4 font-semibold text-[#1B3A5C]">
          Estadísticas del canal
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-center">
            <p className="text-2xl font-black text-[#1B3A5C]">
              {totalReferidos}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Total referidos captados
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-center">
            <p className="text-2xl font-black text-green-600">
              {referidosConvertidos}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Referidos convertidos
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-center">
            <p className="text-2xl font-black text-[#D4881E]">
              {tasaReferidos}%
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Tasa de conversión referidos
            </p>
          </div>
        </div>
      </div>

      {/* Top embajadores */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="mb-4 font-semibold text-[#1B3A5C]">
          Top embajadores
        </h3>
        {topEmbajadores.length > 0 ? (
          <div className="space-y-3">
            {topEmbajadores.map(({ lead, count }) => (
              <div
                key={lead.id || lead.emailCorporativo}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-4"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  )}
                  style={{ backgroundColor: "#1B3A5C" }}
                >
                  {(lead.nombreEmpresa || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#1B3A5C]">
                    {lead.nombreEmpresa}
                  </p>
                  <p className="text-xs text-gray-500">
                    {count} referido{count > 1 ? "s" : ""} generado
                    {count > 1 ? "s" : ""}
                  </p>
                </div>
                {count >= 2 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-bold text-yellow-600 border border-yellow-200">
                    <Star className="h-3 w-3" />
                    Top embajador
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
            <Star className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-600">
              Todavía no tienes referidos registrados.
            </p>
            <p className="mt-2 max-w-md mx-auto text-xs text-gray-500">
              Según el Plan de Lanzamiento, en la Fase 3 deberías tener 5+
              referidos de clientes satisfechos. Después de cada proyecto
              exitoso, pide activamente una recomendación a tu cliente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
