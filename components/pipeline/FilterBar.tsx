"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ESTADOS_LEAD } from "@/lib/estados";
import { getPaisLabel } from "@/lib/pipeline-utils";

const CLASIFICACION_OPTS = [
  { value: "all", label: "Todas las clasificaciones" },
  { value: "Oportunidad Inmediata", label: "Oportunidad Inmediata" },
  { value: "Oportunidad Alta", label: "Oportunidad Alta" },
  { value: "Oportunidad Media", label: "Oportunidad Media" },
  { value: "Oportunidad Baja", label: "Oportunidad Baja" },
  { value: "Sin Oportunidad", label: "Sin Oportunidad" },
];

const FUENTE_OPTS = [
  { value: "all", label: "Todas las fuentes" },
  { value: "Portal_Empresarial", label: "Portal Web" },
  { value: "Evaluacion_Madurez", label: "Evaluación" },
];

const ESTADO_OPTS = [
  { value: "all", label: "Todos los estados" },
  ...ESTADOS_LEAD.map((e) => ({ value: e.value, label: e.label })),
];

const SORT_OPTS = [
  { value: "recent", label: "Más recientes primero" },
  { value: "oldest", label: "Más antiguos primero" },
  { value: "score-desc", label: "Mayor score primero" },
  { value: "score-asc", label: "Menor score primero" },
  { value: "empresa", label: "Por empresa A-Z" },
];

export interface PipelineFilters {
  search: string;
  clasificacion: string;
  fuente: string;
  pais: string;
  estado: string;
  sort: string;
}

interface FilterBarProps {
  filters: PipelineFilters;
  onFiltersChange: (f: PipelineFilters) => void;
  paisesDisponibles: string[];
  totalLeads: number;
  filteredCount: number;
}

export function FilterBar({
  filters,
  onFiltersChange,
  paisesDisponibles,
  totalLeads,
  filteredCount,
}: FilterBarProps) {
  const hasActiveFilters =
    filters.clasificacion !== "all" ||
    filters.fuente !== "all" ||
    filters.pais !== "all" ||
    filters.estado !== "all";

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      clasificacion: "all",
      fuente: "all",
      pais: "all",
      estado: "all",
    });
  };

  const paisOptions = [
    { value: "all", label: "Todos los países" },
    ...paisesDisponibles.map((p) => ({
      value: p,
      label: getPaisLabel(p),
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Fila 1 - Búsqueda y filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por empresa, contacto o email..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-9"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Clasificación</label>
          <Select
            value={filters.clasificacion}
            onValueChange={(v) =>
              onFiltersChange({ ...filters, clasificacion: v ?? "all" })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas las clasificaciones">
                {(val: string | null) =>
                  CLASIFICACION_OPTS.find((o) => o.value === val)?.label ||
                  "Todas las clasificaciones"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CLASIFICACION_OPTS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Fuente</label>
          <Select
            value={filters.fuente}
            onValueChange={(v) =>
              onFiltersChange({ ...filters, fuente: v ?? "all" })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Todas las fuentes">
                {(val: string | null) =>
                  FUENTE_OPTS.find((o) => o.value === val)?.label || "Todas las fuentes"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FUENTE_OPTS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">País</label>
          <Select
            value={filters.pais}
            onValueChange={(v) =>
              onFiltersChange({ ...filters, pais: v ?? "all" })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Todos los países">
                {(val: string | null) =>
                  paisOptions.find((o) => o.value === val)?.label || "Todos los países"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {paisOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Estado</label>
          <Select
            value={filters.estado}
            onValueChange={(v) =>
              onFiltersChange({ ...filters, estado: v ?? "all" })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Todos los estados">
                {(val: string | null) =>
                  ESTADO_OPTS.find((o) => o.value === val)?.label || "Todos los estados"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ESTADO_OPTS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-red-500"
            onClick={clearFilters}
          >
            <X className="mr-1 h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Fila 2 - Contador y ordenamiento */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Mostrando {filteredCount} de {totalLeads} leads
        </p>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Ordenar por</label>
          <Select
            value={filters.sort}
            onValueChange={(v) =>
              onFiltersChange({ ...filters, sort: v ?? "recent" })
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Más recientes primero">
                {(val: string | null) =>
                  SORT_OPTS.find((o) => o.value === val)?.label || "Más recientes primero"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
