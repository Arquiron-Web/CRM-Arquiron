"use client";

import { ESTADOS_LEAD, getEstado } from "@/lib/estados";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EstadoSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  excluir?: string[];
  id?: string;
}

export function EstadoSelect({
  value,
  onChange,
  disabled,
  className,
  excluir = [],
  id,
}: EstadoSelectProps) {
  const estadoActual = getEstado(value);
  const opciones = ESTADOS_LEAD.filter((e) => !excluir.includes(e.value));

  return (
    <Select
      value={value || opciones[0]?.value}
      onValueChange={(v) => onChange(v ?? "")}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue>
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              estadoActual.textClass
            )}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: estadoActual.color }}
            />
            {estadoActual.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {opciones.map((estado) => (
          <SelectItem key={estado.value} value={estado.value}>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: estado.color }}
              />
              <div>
                <p className="text-sm font-medium">{estado.label}</p>
                <p className="text-xs text-gray-400">{estado.descripcion}</p>
              </div>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
