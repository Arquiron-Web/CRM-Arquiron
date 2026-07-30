"use client";

import { cn } from "@/lib/utils";

export type ChipFilter =
  | "all"
  | "Oportunidad Inmediata"
  | "Oportunidad Alta"
  | "Portal Web"
  | "Evaluación"
  | "Con IGM"
  | "Sin contactar";

interface FilterChipsProps {
  active: ChipFilter;
  onSelect: (filter: ChipFilter) => void;
  counts: Record<ChipFilter, number>;
}

const CHIP_ORDER: ChipFilter[] = [
  "all",
  "Oportunidad Inmediata",
  "Oportunidad Alta",
  "Portal Web",
  "Evaluación",
  "Con IGM",
  "Sin contactar",
];

const CHIP_LABELS: Record<ChipFilter, string> = {
  all: "Todos",
  "Oportunidad Inmediata": "Oportunidad Inmediata",
  "Oportunidad Alta": "Oportunidad Alta",
  "Portal Web": "Portal Web",
  "Evaluación": "Evaluación",
  "Con IGM": "Con IGM",
  "Sin contactar": "Sin contactar",
};

export function FilterChips({ active, onSelect, counts }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIP_ORDER.map((filter) => {
        const count = counts[filter] ?? 0;
        const isActive = active === filter;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onSelect(filter)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-[#1B3A5C] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {CHIP_LABELS[filter]} ({count})
          </button>
        );
      })}
    </div>
  );
}
