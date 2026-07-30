"use client"

import { useConsultores }    from "@/hooks/useConsultores"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn }                from "@/lib/utils"

interface ConsultorSelectProps {
  value:       string
  onChange:    (value: string) => void
  placeholder?: string
  className?:  string
  disabled?:   boolean
  allowEmpty?: boolean
  id?: string
}

export function ConsultorSelect({
  value,
  onChange,
  placeholder = "Seleccionar consultor",
  className,
  disabled,
  allowEmpty = true,
  id,
}: ConsultorSelectProps) {
  const { consultores, loading } = useConsultores()
  const valorSeguro = value || ""

  return (
    <Select
      value={valorSeguro}
      onValueChange={v => onChange(v === "sin_asignar" ? "" : v ?? "")}
      disabled={disabled || loading}
    >
      <SelectTrigger id={id} className={cn(
        "border-gray-200 focus:border-[#33487A] rounded-xl h-10",
        className
      )}>
        <SelectValue placeholder={loading ? "Cargando..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && (
          <SelectItem value="sin_asignar">
            <span className="text-gray-400 text-sm">Sin asignar</span>
          </SelectItem>
        )}
        {consultores.map((c, i) => (
          <SelectItem key={c.id || c.email || i} value={c.nombre || c.id}>
            <div className="flex items-center gap-2 py-0.5">
              <div className="w-6 h-6 rounded-full bg-[#1B3A5C] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(c.nombre || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1B3A5C]">{c.nombre}</p>
                {c.cargo && <p className="text-xs text-gray-400">{c.cargo}</p>}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
