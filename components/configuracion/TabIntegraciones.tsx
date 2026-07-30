"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

function maskEndpoint(url: string): string {
  if (!url || url.length < 50) return url || "-";
  return url.slice(0, 40) + "...";
}

type StatusData = Record<string, string | null> & { spreadsheetUrl?: string | null };

export default function TabIntegraciones() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const [status, setStatus] = useState<StatusData | null>(null);
  const [appsScriptStatus, setAppsScriptStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");

  useEffect(() => {
    fetch("/api/configuracion/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({}));
  }, []);

  const endpoint = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT || "";
  const hasCalendarScope = !!(session?.user as { accessToken?: string })?.accessToken;

  const testAppsScript = async () => {
    setAppsScriptStatus("testing");
    try {
      const res = await fetch(endpoint, { method: "GET" });
      setAppsScriptStatus(res.ok ? "ok" : "error");
      if (res.ok) {
        (await import("sonner")).toast.success("Conexión exitosa");
      } else {
        (await import("sonner")).toast.error("El endpoint no respondió correctamente");
      }
    } catch (e) {
      setAppsScriptStatus("error");
      (await import("sonner")).toast.error("Error de conexión: " + (e as Error).message);
    }
  };

  const cards = [
    {
      icon: "🗄️",
      title: "PostgreSQL — Base de datos",
      estado: status?.baseDatosConectada === "conectado" ? "Conectado" : "Sin configurar",
      estadoClass:
        status?.baseDatosConectada === "conectado"
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-600",
      info: "Leads, Consultores, Propuestas, Proyectos, Tareas e Interacciones",
      action: null,
    },
    {
      icon: "📅",
      title: "Google Calendar — Agenda",
      estado: hasCalendarScope && session ? "Conectado" : "Sin configurar",
      estadoClass: hasCalendarScope && session ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600",
      info: "Sincronizado con contacto@arquiron.com",
      action: (
        <Link href="/calendario">
          <Button variant="outline" size="sm">
            Ver calendario
          </Button>
        </Link>
      ),
    },
    {
      icon: "⚡",
      title: "Google Apps Script — Automatización de emails",
      estado: endpoint ? "Configurado" : "Sin configurar",
      estadoClass: endpoint ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600",
      info: endpoint ? maskEndpoint(endpoint) : "Variable no configurada",
      action: endpoint ? (
        <Button
          variant="outline"
          size="sm"
          onClick={testAppsScript}
          disabled={appsScriptStatus === "testing"}
        >
          {appsScriptStatus === "testing"
            ? "Probando..."
            : appsScriptStatus === "ok"
              ? "Activo"
              : appsScriptStatus === "error"
                ? "Error"
                : "Probar conexión"}
        </Button>
      ) : null,
    },
    {
      icon: "🌐",
      title: "Portal Web — Formulario de contacto",
      estado: "Activo",
      estadoClass: "bg-green-100 text-green-700",
      info: "arquiron.com — Captura leads automáticamente",
      action: (
        <a
          href="https://www.arquiron.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button variant="outline" size="sm">
            Ver portal
          </Button>
        </a>
      ),
    },
    {
      icon: "📊",
      title: "Evaluación de Madurez Empresarial",
      estado: "Activo",
      estadoClass: "bg-green-100 text-green-700",
      info: "evaluacion.arquiron.com — Genera leads calificados",
      action: (
        <a
          href="https://evaluacion.arquiron.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button variant="outline" size="sm">
            Ver herramienta
          </Button>
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-[#1B3A5C]">
        Conexiones y APIs activas
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{card.icon}</span>
                <div>
                  <h3 className="font-semibold text-[#1B3A5C]">{card.title}</h3>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${card.estadoClass}`}
                  >
                    {card.estado}
                  </span>
                </div>
              </div>
              {card.action}
            </div>
            <p className="mt-3 text-sm text-gray-500">{card.info}</p>
          </motion.div>
        ))}
      </div>

      {/* Variables de entorno — solo administradores */}
      {isAdmin && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">
            Configuración técnica
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Solo visible para el administrador
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Variable
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {status &&
                  Object.entries(status)
                    .filter(([k]) => k !== "spreadsheetUrl")
                    .map(([key, val]) => (
                    <tr key={key} className="border-b">
                      <td className="px-4 py-3 font-mono text-gray-700">{key}</td>
                      <td className="px-4 py-3 text-gray-600">{val}</td>
                      <td className="px-4 py-3">
                        {val && val !== "no configurado" ? (
                          <span className="text-green-600">✅ Configurado</span>
                        ) : (
                          <span className="text-gray-400">❌</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
