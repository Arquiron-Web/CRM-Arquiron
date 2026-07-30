import { useState, useEffect } from "react";
import type { Lead } from "@/types/lead";

let cacheLeads: Lead[] | null = null;
let cargandoLeads = false;
const listeners: Array<() => void> = [];

/** Invalida el caché compartido para que el próximo componente que use useLeads() vuelva a pedir la lista. */
export function invalidateLeadsCache() {
  cacheLeads = null;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>(cacheLeads || []);
  const [loading, setLoading] = useState(!cacheLeads);

  useEffect(() => {
    if (cacheLeads) {
      setLeads(cacheLeads);
      setLoading(false);
      return;
    }

    if (cargandoLeads) {
      const onLoad = () => {
        setLeads(cacheLeads || []);
        setLoading(false);
      };
      listeners.push(onLoad);
      return () => {
        const idx = listeners.indexOf(onLoad);
        if (idx > -1) listeners.splice(idx, 1);
      };
    }

    cargandoLeads = true;
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => {
        const mapaLeads = new Map<string, Lead>();
        (Array.isArray(data) ? data : []).forEach((lead: Lead) => {
          const key = lead.id || lead.emailCorporativo;
          if (key && !mapaLeads.has(key)) mapaLeads.set(key, lead);
        });
        cacheLeads = Array.from(mapaLeads.values());
        setLeads(cacheLeads);
        setLoading(false);
        listeners.forEach((fn) => fn());
        listeners.length = 0;
      })
      .catch(() => setLoading(false))
      .finally(() => {
        cargandoLeads = false;
      });
  }, []);

  const refetch = () => {
    cacheLeads = null;
    cargandoLeads = false;
    setLoading(true);
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => {
        const mapaLeads = new Map<string, Lead>();
        (Array.isArray(data) ? data : []).forEach((lead: Lead) => {
          const key = lead.id || lead.emailCorporativo;
          if (key && !mapaLeads.has(key)) mapaLeads.set(key, lead);
        });
        cacheLeads = Array.from(mapaLeads.values());
        setLeads(cacheLeads);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return { leads, loading, refetch };
}
