"use client";

import { MessageCircle, Mail, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EstadoSelect } from "@/components/ui/EstadoSelect";
import {
  getClasificacionColor,
  getRetoLabel,
  getPaisLabel,
} from "@/lib/pipeline-utils";
import type { Lead } from "@/types/lead";

const FUENTE_LABELS: Record<string, string> = {
  Portal_Empresarial: "Portal Web",
  Evaluacion_Madurez: "Evaluación",
};

function getFuenteBadge(fuente: string) {
  const isEval = (fuente || "").includes("Evaluacion") || (fuente || "").includes("Evaluación");
  const label = FUENTE_LABELS[fuente as keyof typeof FUENTE_LABELS] || fuente || "-";
  const color = isEval ? "#8560C0" : "#1B3A5C";
  return { label, color };
}

interface CompactListProps {
  leads: Lead[];
  onEstadoChange: (lead: Lead, nuevoEstado: string) => void;
  onVerDetalle: (lead: Lead) => void;
}

export function CompactList({
  leads,
  onEstadoChange,
  onVerDetalle,
}: CompactListProps) {
  const whatsappUrl = (whatsapp: string) => {
    const num = (whatsapp || "").replace(/\D/g, "");
    return num ? `https://wa.me/${num}` : "#";
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow className="border-b bg-white hover:bg-transparent">
            <TableHead className="font-medium">Empresa</TableHead>
            <TableHead className="font-medium">Contacto</TableHead>
            <TableHead className="font-medium">Score</TableHead>
            <TableHead className="font-medium">Clasificación</TableHead>
            <TableHead className="font-medium">Estado</TableHead>
            <TableHead className="text-right font-medium">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead, idx) => {
            const fuenteBadge = getFuenteBadge(lead.fuenteFormulario);
            const score = parseFloat(lead.scoreLead) || 0;
            return (
              <TableRow
                key={lead.id ?? `lead-${idx}`}
                className="hover:bg-gray-50"
              >
                <TableCell>
                  <div>
                    <p className="font-semibold">{lead.nombreEmpresa || "-"}</p>
                    <p className="text-xs text-gray-500">
                      {lead.ciudad && lead.pais
                        ? `${lead.ciudad}, ${getPaisLabel(lead.pais)}`
                        : lead.ciudad || getPaisLabel(lead.pais) || "-"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p>{lead.nombreContacto || "-"}</p>
                    {lead.cargo && (
                      <p className="text-xs text-gray-500">{lead.cargo}</p>
                    )}
                    {lead.emailCorporativo && (
                      <a
                        href={`mailto:${lead.emailCorporativo}`}
                        className="text-xs text-[#1B3A5C] hover:underline"
                      >
                        {lead.emailCorporativo}
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className="font-semibold tabular-nums"
                    style={{
                      color:
                        score >= 75
                          ? "#ef4444"
                          : score >= 55
                            ? "#D4881E"
                            : score >= 35
                              ? "#eab308"
                              : score >= 15
                                ? "#22c55e"
                                : "#9ca3af",
                    }}
                  >
                    {score || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    style={{
                      backgroundColor: getClasificacionColor(lead.clasificacion),
                      color: "white",
                      border: "none",
                    }}
                  >
                    {(lead.clasificacion || "Sin clasificar").replace(
                      /^[🔴🟠🟡🟢⚪]\s*/,
                      ""
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <EstadoSelect
                    value={lead.estadoLead || "NUEVO"}
                    onChange={(v) => onEstadoChange(lead, v)}
                    className="h-8 w-[130px] border-gray-200"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <a
                      href={whatsappUrl(lead.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </a>
                    <a href={`mailto:${lead.emailCorporativo}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => onVerDetalle(lead)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Ver más
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
