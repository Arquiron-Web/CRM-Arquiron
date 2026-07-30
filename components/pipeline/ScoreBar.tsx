"use client";

import { cn } from "@/lib/utils";

interface ScoreBarProps {
  value: number;
  max?: number;
  className?: string;
}

export function ScoreBar({ value, max = 100, className }: ScoreBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="w-8 text-right text-sm font-medium tabular-nums">
        {value}
      </span>
      <div className="h-2 flex-1 min-w-[60px] overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-arquiron-navy transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
