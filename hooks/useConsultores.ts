import { useState, useEffect } from "react";

export interface Consultor {
  id: string;
  nombre: string;
  email: string;
  cargo: string;
  especialidad: string;
  pais: string;
  ciudad: string;
  fechaIngreso: string;
}

let cacheConsultores: Consultor[] | null = null;
let cargandoConsultores = false;
const listeners: Array<() => void> = [];

export function useConsultores() {
  const [consultores, setConsultores] = useState<Consultor[]>(
    cacheConsultores || []
  );
  const [loading, setLoading] = useState(!cacheConsultores);

  useEffect(() => {
    if (cacheConsultores) {
      setConsultores(cacheConsultores);
      setLoading(false);
      return;
    }

    if (cargandoConsultores) {
      const onLoad = () => {
        setConsultores(cacheConsultores || []);
        setLoading(false);
      };
      listeners.push(onLoad);
      return () => {
        const idx = listeners.indexOf(onLoad);
        if (idx > -1) listeners.splice(idx, 1);
      };
    }

    cargandoConsultores = true;
    fetch("/api/configuracion/consultores")
      .then((r) => r.json())
      .then((data) => {
        cacheConsultores = Array.isArray(data) ? data : [];
        setConsultores(cacheConsultores);
        setLoading(false);
        listeners.forEach((fn) => fn());
        listeners.length = 0;
      })
      .catch(() => setLoading(false))
      .finally(() => {
        cargandoConsultores = false;
      });
  }, []);

  const refetch = () => {
    cacheConsultores = null;
    cargandoConsultores = false;
    setLoading(true);
    fetch("/api/configuracion/consultores")
      .then((r) => r.json())
      .then((data) => {
        cacheConsultores = Array.isArray(data) ? data : [];
        setConsultores(cacheConsultores);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return { consultores, loading, refetch };
}
