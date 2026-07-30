import { getEstado } from "@/lib/estados";
import { cn } from "@/lib/utils";

interface EstadoBadgeProps {
  estado: string;
  size?: "sm" | "md";
  className?: string;
}

export function EstadoBadge({
  estado,
  size = "md",
  className,
}: EstadoBadgeProps) {
  const e = getEstado(estado);

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
