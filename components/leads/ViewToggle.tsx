"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "cards" | "list";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-lg border border-gray-200 p-0.5">
      <button
        type="button"
        onClick={() => onChange("cards")}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          value === "cards"
            ? "bg-[#1B3A5C] text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Vista Cards
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          value === "list"
            ? "bg-[#1B3A5C] text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        )}
      >
        <List className="h-4 w-4" />
        Vista Lista
      </button>
    </div>
  );
}
