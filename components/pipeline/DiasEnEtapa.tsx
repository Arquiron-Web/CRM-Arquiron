"use client";

import { useEffect, useState } from "react";

interface DiasEnEtapaProps {
  timestamp: string;
}

function getDiasDesdeRegistro(timestamp: string): number {
  if (!timestamp) return 0;
  const fecha = new Date(timestamp);
  const ahora = new Date();
  return Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Depende de `new Date()` — mismo motivo que TiempoRelativo (ver ese
 * componente): se calcula post-montaje para que el SSR y la primera
 * hidratación coincidan (ambos renderizan vacío) y el valor real llegue en
 * una actualización posterior al montaje, no en la reconciliación de
 * hidratación.
 */
export function DiasEnEtapa({ timestamp }: DiasEnEtapaProps) {
  const [dias, setDias] = useState<number | null>(null);

  useEffect(() => {
    setDias(getDiasDesdeRegistro(timestamp));
  }, [timestamp]);

  if (dias === null) return null;
  return <>{dias}d en etapa</>;
}
