"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  GitBranch,
  Zap,
  Database,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TabEmpresa from "@/components/configuracion/TabEmpresa";
import TabConsultores from "@/components/configuracion/TabConsultores";
import TabPipeline from "@/components/configuracion/TabPipeline";
import TabIntegraciones from "@/components/configuracion/TabIntegraciones";
import TabDatos from "@/components/configuracion/TabDatos";
import TabReferidos from "@/components/configuracion/TabReferidos";

const TABS = [
  { id: "empresa", label: "Perfil de la Empresa", icon: Building2 },
  { id: "referidos", label: "Programa de Referidos", icon: Star },
  { id: "consultores", label: "Equipo y Consultores", icon: Users },
  { id: "pipeline", label: "Pipeline y Estados", icon: GitBranch },
  { id: "integraciones", label: "Integraciones", icon: Zap },
  { id: "datos", label: "Datos y Exportación", icon: Database },
];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState("empresa");

  return (
    <div className="flex gap-8">
      {/* Columna izquierda - Navegación */}
      <aside className="w-56 shrink-0 sticky top-24 self-start">
        <nav className="space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-[#1B3A5C] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <t.icon className="h-5 w-5 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Columna derecha - Contenido */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl border border-gray-100 bg-white p-8">
          <AnimatePresence mode="wait">
            {tab === "referidos" && (
              <motion.div
                key="referidos"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabReferidos />
              </motion.div>
            )}
            {tab === "empresa" && (
              <motion.div
                key="empresa"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabEmpresa />
              </motion.div>
            )}
            {tab === "consultores" && (
              <motion.div
                key="consultores"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabConsultores />
              </motion.div>
            )}
            {tab === "pipeline" && (
              <motion.div
                key="pipeline"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabPipeline />
              </motion.div>
            )}
            {tab === "integraciones" && (
              <motion.div
                key="integraciones"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabIntegraciones />
              </motion.div>
            )}
            {tab === "datos" && (
              <motion.div
                key="datos"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabDatos />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
