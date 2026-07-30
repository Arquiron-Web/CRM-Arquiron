"use client";

import { motion } from "framer-motion";
import { LeadCard } from "./LeadCard";
import type { Lead } from "@/types/lead";

interface LeadCardGridProps {
  leads: Lead[];
  onEstadoChange: (lead: Lead, nuevoEstado: string) => void;
  onVerDetalle: (lead: Lead) => void;
}

export function LeadCardGrid({
  leads,
  onEstadoChange,
  onVerDetalle,
}: LeadCardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead, index) => (
        <motion.div
          key={lead.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.08 }}
        >
          <LeadCard
            lead={lead}
            onEstadoChange={onEstadoChange}
            onVerDetalle={onVerDetalle}
          />
        </motion.div>
      ))}
    </div>
  );
}
