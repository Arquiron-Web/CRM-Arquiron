"use client";

import { ESTADOS_PROPUESTA } from "@/types/propuesta";
import { cn } from "@/lib/utils";

function getEstadoPropuesta(estado: string) {
  return (
    ESTADOS_PROPUESTA.find((e) => e.value === estado) || ESTADOS_PROPUESTA[0]
  );
}

interface PropuestaBadgeProps {
  estado: string;
  size?: "sm" | "md";
  className?: string;
}

export function PropuestaBadge({
  estado,
  size = "md",
  className,
}: PropuestaBadgeProps) {
  const e = getEstadoPropuesta(estado);

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs",
        e.bgClass,
        e.textClass,
        e.borderClass,
        className
      )}
    >
      {e.label}
    </span>
  );
}
