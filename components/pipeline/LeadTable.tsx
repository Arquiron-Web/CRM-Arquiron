"use client";

import { MessageCircle, Mail, Eye, ChevronUp, ChevronDown } from "lucide-react";
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
import { ScoreBar } from "./ScoreBar";
import {
  getClasificacionColor,
  getRetoLabel,
  getPaisLabel,
  formatRelativeDate,
} from "@/lib/pipeline-utils";
import type { Lead } from "@/types/lead";

const FUENTE_LABELS: Record<string, string> = {
  Portal_Empresarial: "Portal Web",
  Evaluacion_Madurez: "Evaluación",
};

function getFuenteBadge(fuente: string) {
  const isEval = (fuente || "").includes("Evaluacion") || (fuente || "").includes("Evaluación");
  const label = FUENTE_LABELS[fuente as keyof typeof FUENTE_LABELS] || fuente || "-";
  return {
    icon: isEval ? "📊" : "🌐",
    label,
    color: isEval ? "#8560C0" : "#1B3A5C",
  };
}

function getBorderClass(clasificacion: string): string {
  if ((clasificacion || "").includes("Oportunidad Inmediata"))
    return "border-l-4 border-l-red-500";
  if ((clasificacion || "").includes("Oportunidad Alta"))
    return "border-l-4 border-l-arquiron-orange";
  return "";
}

interface LeadTableProps {
  leads: Lead[];
  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
  onEstadoChange: (lead: Lead, nuevoEstado: string) => void;
  onVerDetalle: (lead: Lead) => void;
}

export function LeadTable({
  leads,
  page,
  perPage,
  onPageChange,
  onEstadoChange,
  onVerDetalle,
}: LeadTableProps) {
  const start = (page - 1) * perPage;
  const paginatedLeads = leads.slice(start, start + perPage);
  const totalPages = Math.ceil(leads.length / perPage);

  const whatsappUrl = (whatsapp: string) => {
    const num = (whatsapp || "").replace(/\D/g, "");
    return num ? `https://wa.me/${num}` : "#";
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-white sticky top-0 border-b">
              <TableHead className="w-[200px]">Empresa</TableHead>
              <TableHead className="w-[220px]">Contacto</TableHead>
              <TableHead className="w-[120px]">Fuente</TableHead>
              <TableHead className="w-[160px]">Reto</TableHead>
              <TableHead className="w-[100px]">Score</TableHead>
              <TableHead className="w-[140px]">Clasificación</TableHead>
              <TableHead className="w-[140px]">Estado</TableHead>
              <TableHead className="w-[60px]">IGM</TableHead>
              <TableHead className="w-[100px]">Fecha</TableHead>
              <TableHead className="w-[140px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.map((lead, idx) => {
              const fuenteBadge = getFuenteBadge(lead.fuenteFormulario);
              const score = parseFloat(lead.scoreLead) || 0;
              return (
                <TableRow
                  key={lead.id}
                  className={`hover:bg-gray-50 ${getBorderClass(lead.clasificacion)}`}
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
                          className="text-xs text-arquiron-navy hover:underline"
                        >
                          {lead.emailCorporativo}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: fuenteBadge.color,
                        color: "white",
                        border: "none",
                      }}
                    >
                      {fuenteBadge.icon} {fuenteBadge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {getRetoLabel(lead.retoPrincipal)}
                  </TableCell>
                  <TableCell>
                    <ScoreBar value={score} />
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
                  <TableCell className="text-sm tabular-nums">
                    {lead.indiceMadurez
                      ? parseFloat(lead.indiceMadurez).toFixed(1)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatRelativeDate(lead.timestamp)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <a
                        href={whatsappUrl(lead.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </a>
                      <a href={`mailto:${lead.emailCorporativo}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Email"
                        >
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
                        Ver detalle
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronUp className="h-4 w-4 rotate-90" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Siguiente
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
