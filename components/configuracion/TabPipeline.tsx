"use client";

import { ESTADOS_LEAD } from "@/lib/estados";

const ETAPAS = [
  { nombre: "Prospección", color: "#3b82f6", emoji: "🔵", estados: ["NUEVO", "CONTACTADO"] },
  { nombre: "Calificación", color: "#8560C0", emoji: "🟠", estados: ["CALIFICADO"] },
  { nombre: "Propuesta", color: "#eab308", emoji: "🟡", estados: ["PROPUESTA"] },
  { nombre: "Negociación", color: "#f97316", emoji: "🟤", estados: ["NEGOCIACION"] },
  { nombre: "Ganado", color: "#22c55e", emoji: "🟢", estados: ["GANADO"] },
  { nombre: "En Espera", color: "#9ca3af", emoji: "⚪", estados: ["EN_ESPERA"] },
];

const SCORING = [
  { variable: "Momento de contacto", peso: 25, desc: "Urgencia de la necesidad" },
  { variable: "Brecha IGM vs autopercepción", peso: 25, desc: "Consciencia del problema" },
  { variable: "IGM actual", peso: 20, desc: "Nivel de madurez actual" },
  { variable: "Tamaño de empresa", peso: 15, desc: "Capacidad de inversión" },
  { variable: "Reto principal", peso: 10, desc: "Alineación con portafolio" },
  { variable: "Canal de captación", peso: 3, desc: "Calidad del lead" },
  { variable: "Años de operación", peso: 2, desc: "Madurez del negocio" },
];

const CLASIFICACION = [
  { pts: "≥75", label: "Oportunidad Inmediata", emoji: "🔴" },
  { pts: "≥55", label: "Oportunidad Alta", emoji: "🟠" },
  { pts: "≥35", label: "Oportunidad Media", emoji: "🟡" },
  { pts: "≥15", label: "Oportunidad Baja", emoji: "🟢" },
  { pts: "<15", label: "Sin Oportunidad", emoji: "⚪" },
];

export default function TabPipeline() {
  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold text-[#1B3A5C]">
        Configuración del proceso comercial
      </h2>

      {/* Etapas */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">
          Etapas del proceso comercial
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Define las columnas de tu kanban de Pipeline
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ETAPAS.map((e) => (
            <div
              key={e.nombre}
              className="rounded-xl border border-gray-100 bg-white p-4 flex items-start gap-3"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: e.color }}
              />
              <div>
                <p className="font-medium text-[#1B3A5C]">
                  {e.emoji} {e.nombre}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Estados: {e.estados.join(", ")}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            La personalización avanzada de etapas estará disponible en la próxima
            versión del CRM.
          </p>
        </div>
      </div>

      {/* Estados */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          Estados del ciclo de vida del lead
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Color
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Etapa en Pipeline
                </th>
              </tr>
            </thead>
            <tbody>
              {ESTADOS_LEAD.map((est) => (
                <tr key={est.value} className="border-b">
                  <td className="px-4 py-3 font-medium">{est.label}</td>
                  <td className="px-4 py-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: est.color }}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {est.descripcion}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {est.kanban || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scoring */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          Modelo de puntuación de leads
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-100 mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Variable
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Peso
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody>
              {SCORING.map((s) => (
                <tr key={s.variable} className="border-b">
                  <td className="px-4 py-3 font-medium">{s.variable}</td>
                  <td className="px-4 py-3">{s.peso} pts</td>
                  <td className="px-4 py-3 text-gray-600">{s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 mb-4">Total: 100 puntos</p>
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Puntos
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Clasificación
                </th>
              </tr>
            </thead>
            <tbody>
              {CLASIFICACION.map((c) => (
                <tr key={c.label} className="border-b">
                  <td className="px-4 py-3 font-medium">{c.pts} pts</td>
                  <td className="px-4 py-3">
                    {c.emoji} {c.label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            El modelo de scoring se calcula automáticamente en Google Sheets mediante
            fórmulas. Los pesos pueden ajustarse directamente en la hoja LEADS.
          </p>
        </div>
      </div>
    </div>
  );
}
