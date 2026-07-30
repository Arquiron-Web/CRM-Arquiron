"use client";

import { useLeads } from "@/hooks/useLeads";
import type { Lead } from "@/types/lead";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function getLeadValue(lead: Lead, idx: number): string {
  return lead.id || lead.emailCorporativo || `idx-${idx}`;
}

interface LeadSelectProps {
  value: string;
  onChange: (lead: Lead | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  soloEvaluados?: boolean;
}

export function LeadSelect({
  value,
  onChange,
  placeholder = "Seleccionar lead...",
  className,
  disabled,
  allowEmpty = true,
  soloEvaluados = false,
}: LeadSelectProps) {
  const { leads, loading } = useLeads();

  const leadsOpciones = soloEvaluados
    ? leads.filter((l) => l.indiceMadurez && parseFloat(l.indiceMadurez) > 0)
    : leads;

  const handleChange = (val: string | null) => {
    if (!val || val === "sin_lead") {
      onChange(null);
      return;
    }
    const lead = leads.find((l, i) => getLeadValue(l, i) === val);
    onChange(lead || null);
  };

  return (
    <Select
      value={value || (allowEmpty ? "sin_lead" : "")}
      onValueChange={handleChange}
      disabled={disabled || loading}
    >
      <SelectTrigger
        className={cn(
          "rounded-xl border-gray-200 focus:border-[#33487A]",
          className
        )}
      >
        <SelectValue placeholder={loading ? "Cargando leads..." : placeholder}>
          {(val: string | null) => {
            if (loading) return "Cargando leads...";
            if (val === "sin_lead") return "Sin lead asociado";
            if (!val) return placeholder;
            const lead = leads.find((l, i) => getLeadValue(l, i) === val);
            return lead?.nombreEmpresa || placeholder;
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72 overflow-y-auto">
        {allowEmpty && (
          <SelectItem value="sin_lead">
            <span className="text-gray-400">Sin lead asociado</span>
          </SelectItem>
        )}
        {leadsOpciones.length === 0 && !loading && (
          <SelectItem value="_vacio" disabled>
            No hay leads disponibles
          </SelectItem>
        )}
        {leadsOpciones.map((lead, idx) => (
          <SelectItem
            key={`lead-${getLeadValue(lead, idx)}`}
            value={getLeadValue(lead, idx)}
          >
            <div className="flex flex-col py-0.5">
              <span className="text-sm font-medium text-[#1B3A5C]">
                {lead.nombreEmpresa}
              </span>
              <span className="text-xs text-gray-400">
                {lead.nombreContacto} · {lead.emailCorporativo}
                {lead.indiceMadurez && parseFloat(lead.indiceMadurez) > 0
                  ? ` · IGM ${parseFloat(lead.indiceMadurez).toFixed(1)}`
                  : ""}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
