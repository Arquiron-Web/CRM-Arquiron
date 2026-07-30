"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function exportarCSV(datos: Record<string, unknown>[], nombreArchivo: string) {
  if (!datos.length) return;
  const headers = Object.keys(datos[0]).join(",");
  const filas = datos
    .map((row) =>
      Object.values(row)
        .map((v) =>
          typeof v === "string" && v.includes(",") ? `"${v}"` : String(v ?? "")
        )
        .join(",")
    )
    .join("\n");
  const csv = headers + "\n" + filas;
  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TabDatos() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalPropuestas: 0,
    totalInteracciones: 0,
    totalConsultores: 0,
  });
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/configuracion/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const handleExport = async (
    type: "leads" | "propuestas" | "interacciones",
    url: string,
    fileName: string
  ) => {
    setExporting(type);
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const fecha = new Date().toISOString().slice(0, 10);
        exportarCSV(data, `arquiron-${fileName}-${fecha}.csv`);
        (await import("sonner")).toast.success(`Exportado: ${fileName}`);
      } else {
        (await import("sonner")).toast.error("Error al exportar");
      }
    } catch {
      (await import("sonner")).toast.error("Error de conexión");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold text-[#1B3A5C]">
        Gestión de información
      </h2>

      {/* Estadísticas */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          Estadísticas del sistema
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Total registros en LEADS", value: stats.totalLeads },
            {
              label: "Total propuestas generadas",
              value: stats.totalPropuestas,
            },
            {
              label: "Total interacciones registradas",
              value: stats.totalInteracciones,
            },
            { label: "Total consultores activos", value: stats.totalConsultores },
          ].map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className="rounded-xl border border-gray-100 bg-white p-4"
            >
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-[#1B3A5C]">
                {s.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Exportación */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Exportar datos</h3>
        <p className="text-sm text-gray-500 mb-4">
          Descarga tus datos en formato CSV
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() =>
              handleExport("leads", "/api/leads", "leads")
            }
            disabled={!!exporting}
          >
            {exporting === "leads" ? "Exportando..." : "Exportar Leads"}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              handleExport("propuestas", "/api/propuestas", "propuestas")
            }
            disabled={!!exporting}
          >
            {exporting === "propuestas" ? "Exportando..." : "Exportar Propuestas"}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              handleExport(
                "interacciones",
                "/api/interacciones",
                "interacciones"
              )
            }
            disabled={!!exporting}
          >
            {exporting === "interacciones"
              ? "Exportando..."
              : "Exportar Interacciones"}
          </Button>
        </div>
      </div>

      {/* Información del sistema */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Información del sistema
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>Versión del CRM: 1.0.0 — Marzo 2026</li>
          <li>Stack tecnológico: Next.js · TypeScript · PostgreSQL · Prisma</li>
          <li>Desarrollado con: Cursor AI + Claude (Anthropic)</li>
          <li>Dominio CRM: crm.arquiron.com</li>
          <li>
            Última sincronización:{" "}
            {new Date().toLocaleString("es-CO")}
          </li>
        </ul>
      </div>
    </div>
  );
}
