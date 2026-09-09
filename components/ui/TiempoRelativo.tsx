"use client";

import { useEffect, useState } from "react";
import { calcularTiempoRelativo } from "@/lib/utils";

interface TiempoRelativoProps {
  timestamp: string;
  className?: string;
}

/**
 * calcularTiempoRelativo() depende de `new Date()` — el "ahora" del instante
 * exacto en que se ejecuta. Llamarlo directo en el JSX hacía que el server
 * (SSR) y el cliente (hidratación) lo evaluaran en momentos distintos, y en
 * cuanto el texto no coincidía ("Hace 3 min" vs "Hace 4 min", "Hoy" vs
 * "Ayer"...) React tiraba "Hydration failed" (error #418) y regeneraba todo
 * el árbol. Este componente renderiza vacío en el primer paso — igual en
 * servidor y cliente, sin nada que discrepe — y calcula el texto real en un
 * efecto, ya montado: una actualización normal post-hidratación, no un
 * desajuste de hidratación.
 */
export function TiempoRelativo({ timestamp, className }: TiempoRelativoProps) {
  const [texto, setTexto] = useState("");

  useEffect(() => {
    setTexto(calcularTiempoRelativo(timestamp));
  }, [timestamp]);

  if (!texto) return null;
  return <span className={className}>{texto}</span>;
}
