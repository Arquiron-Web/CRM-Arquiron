"use client";

import { cn } from "@/lib/utils";

interface DimensionBarProps {
  label: string;
  value: number;
  max?: number;
  className?: string;
}

function getBarColor(value: number): string {
  if (value >= 4) return "bg-arquiron-teal";
  if (value >= 3) return "bg-arquiron-navy";
  if (value >= 2) return "bg-arquiron-purple";
  return "bg-arquiron-orange";
}

export function DimensionBar({
  label,
  value,
  max = 5,
  className,
}: DimensionBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium tabular-nums">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn("h-full rounded-full transition-all duration-300", getBarColor(value))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
