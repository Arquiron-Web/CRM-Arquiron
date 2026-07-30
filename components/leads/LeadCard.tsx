"use client";

import { User, Mail, Phone, Target, Briefcase, MessageCircle, Mail as MailIcon, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EstadoSelect } from "@/components/ui/EstadoSelect";
import {
  getClasificacionColor,
  getRetoLabel,
  getPaisLabel,
  formatRelativeDate,
} from "@/lib/pipeline-utils";
import type { Lead } from "@/types/lead";

function getClasificacionBarColor(clasificacion: string): string {
  const c = clasificacion || "";
  if (c.includes("Oportunidad Inmediata")) return "#ef4444";
  if (c.includes("Oportunidad Alta")) return "#D4881E";
  if (c.includes("Oportunidad Media")) return "#eab308";
  if (c.includes("Oportunidad Baja")) return "#22c55e";
  if (c.includes("Sin Oportunidad")) return "#9ca3af";
  return "#9ca3af";
}

function getScoreColor(score: number): string {
  if (score >= 75) return "#ef4444";
  if (score >= 55) return "#D4881E";
  if (score >= 35) return "#eab308";
  if (score >= 15) return "#22c55e";
  return "#9ca3af";
}

function getIGMColor(igm: number): string {
  if (igm >= 4) return "#4CCED5";
  if (igm >= 3) return "#1B3A5C";
  if (igm >= 2) return "#8560C0";
  return "#D4881E";
}

function getFuenteBadge(fuente: string) {
  const isEval = (fuente || "").includes("Evaluacion") || (fuente || "").includes("Evaluación");
  const label = isEval ? "Evaluación" : "Portal Web";
  const bg = isEval ? "bg-[#8560C0]/10 text-[#8560C0]" : "bg-[#1B3A5C]/10 text-[#1B3A5C]";
  return { label, bg };
}

interface LeadCardProps {
  lead: Lead;
  onEstadoChange: (lead: Lead, nuevoEstado: string) => void;
  onVerDetalle: (lead: Lead) => void;
}

export function LeadCard({ lead, onEstadoChange, onVerDetalle }: LeadCardProps) {
  const barColor = getClasificacionBarColor(lead.clasificacion);
  const fuenteBadge = getFuenteBadge(lead.fuenteFormulario);
  const score = parseFloat(lead.scoreLead) || 0;
  const igm = parseFloat(lead.indiceMadurez) || 0;
  const hasScore = lead.scoreLead && lead.scoreLead.trim() !== "";
  const hasIGM = lead.indiceMadurez && lead.indiceMadurez.trim() !== "";

  const whatsappUrl = (whatsapp: string) => {
    const num = (whatsapp || "").replace(/\D/g, "");
    return num ? `https://wa.me/${num}` : "#";
  };

  const ciudadPais = [lead.ciudad, getPaisLabel(lead.pais)].filter(Boolean).join(", ") || "-";

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-[#1B3A5C] hover:shadow-lg"
    >
      {/* Header con banda de color */}
      <div className="relative">
        <div
          className="h-1 w-full"
          style={{ backgroundColor: barColor }}
        />
        <div className="absolute left-3 top-3">
          <Badge className={fuenteBadge.bg + " border-0 text-xs"}>
            {fuenteBadge.label}
          </Badge>
        </div>
        <div className="absolute right-3 top-3">
          <Badge
            className="border-0 text-xs font-medium text-white"
            style={{ backgroundColor: getClasificacionColor(lead.clasificacion) }}
          >
            {(lead.clasificacion || "Sin clasificar").replace(/^[🔴🟠🟡🟢⚪]\s*/, "")}
          </Badge>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1B3A5C]">
            {lead.nombreEmpresa || "-"}
          </h3>
          <p className="text-sm text-gray-500">{ciudadPais}</p>
        </div>

        <hr className="border-gray-100" />

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="font-medium">{lead.nombreContacto || "-"}</span>
          </div>
          {lead.cargo && (
            <p className="pl-6 text-sm text-gray-500">{lead.cargo}</p>
          )}
          {lead.emailCorporativo && (
            <a
              href={`mailto:${lead.emailCorporativo}`}
              className="flex items-center gap-2 pl-6 text-sm text-[#1B3A5C] hover:underline"
            >
              <Mail className="h-4 w-4 shrink-0" />
              {lead.emailCorporativo}
            </a>
          )}
          {lead.whatsapp && (
            <a
              href={whatsappUrl(lead.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 pl-6 text-sm text-[#1B3A5C] hover:underline"
            >
              <Phone className="h-4 w-4 shrink-0" />
              {lead.whatsapp}
            </a>
          )}
        </div>

        {lead.retoPrincipal && (
          <div className="flex items-start gap-2">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-500">Reto principal</p>
              <p className="text-sm">{getRetoLabel(lead.retoPrincipal)}</p>
            </div>
          </div>
        )}

        {lead.servicioSugeridoForja && (
          <div className="flex items-start gap-2">
            <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[#D4881E]" />
            <div>
              <p className="text-xs font-medium text-[#D4881E]">Servicio sugerido FORJA</p>
              <p className="text-sm text-[#D4881E]">{lead.servicioSugeridoForja}</p>
            </div>
          </div>
        )}

        {/* Score */}
        {hasScore && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Score</span>
              <span
                className="font-bold"
                style={{ color: getScoreColor(score) }}
              >
                {score}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, score)}%`,
                  backgroundColor: getScoreColor(score),
                }}
              />
            </div>
          </div>
        )}

        {/* IGM */}
        {hasIGM && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">IGM</span>
              <span
                className="font-bold"
                style={{ color: getIGMColor(igm) }}
              >
                {igm.toFixed(1)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(igm / 5) * 100}%`,
                  backgroundColor: getIGMColor(igm),
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50/50 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <EstadoSelect
            value={lead.estadoLead || "NUEVO"}
            onChange={(v) => onEstadoChange(lead, v)}
            className="h-8 w-full min-w-0 border-gray-200"
          />
        </div>
        <p className="mb-3 text-xs text-gray-500">
          Registrado {formatRelativeDate(lead.timestamp)}
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappUrl(lead.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </a>
          <a href={`mailto:${lead.emailCorporativo}`}>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <MailIcon className="h-4 w-4" />
              Email
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() => onVerDetalle(lead)}
          >
            <Eye className="h-4 w-4" />
            Ver más
          </Button>
        </div>
      </div>
    </div>
  );
}
