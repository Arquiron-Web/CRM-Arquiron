"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  FileText,
  MessageSquare,
  Briefcase,
  X,
  Command,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONO_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  "file-text": FileText,
  "message-square": MessageSquare,
  briefcase: Briefcase,
};

const TIPO_LABEL: Record<string, string> = {
  lead: "Lead",
  propuesta: "Propuesta",
  interaccion: "Interacción",
  proyecto: "Proyecto",
};

const TIPO_COLOR: Record<string, string> = {
  lead: "text-blue-600 bg-blue-50 border-blue-200",
  propuesta: "text-purple-600 bg-purple-50 border-purple-200",
  interaccion: "text-orange-500 bg-orange-50 border-orange-200",
  proyecto: "text-green-600 bg-green-50 border-green-200",
};

function resaltar(texto: string, query: string): React.ReactNode {
  if (!query || !texto) return <span>{texto}</span>;
  const idx = texto.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{texto}</span>;
  return (
    <span>
      {texto.slice(0, idx)}
      <mark className="rounded bg-yellow-200 px-0.5 not-italic text-yellow-900">
        {texto.slice(idx, idx + query.length)}
      </mark>
      {texto.slice(idx + query.length)}
    </span>
  );
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<
    Array<{
      tipo: string;
      id: string;
      titulo: string;
      subtitulo: string;
      detalle: string;
      extra: string;
      href: string;
      icono: string;
      score: number;
    }>
  >([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buscar = useCallback((q: string) => {
    clearTimeout(timerRef.current);
    if (q.length < 2) {
      setResultados([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/busqueda?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResultados(data.resultados || []);
        setTotal(data.total || 0);
        setSelected(-1);
      } catch {
        setResultados([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    buscar(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || resultados.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((prev) => Math.min(prev + 1, resultados.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((prev) => Math.max(prev - 1, 0));
    }
    if (e.key === "Enter" && selected >= 0) {
      e.preventDefault();
      navegarA(resultados[selected]);
    }
  };

  const navegarA = (resultado: (typeof resultados)[0]) => {
    setOpen(false);
    setQuery("");
    router.push(resultado.href);
  };

  const limpiar = () => {
    setQuery("");
    setResultados([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const grupos = resultados.reduce<Record<string, (typeof resultados)[0][]>>(
    (acc, r) => {
      if (!acc[r.tipo]) acc[r.tipo] = [];
      acc[r.tipo].push(r);
      return acc;
    },
    {}
  );

  return (
    <div className="relative max-w-md flex-1" ref={wrapRef}>
      <div
        className={cn(
          "flex h-9 items-center gap-2 rounded-xl border bg-gray-50 px-3 transition-all duration-150",
          open ? "border-[#1B3A5C] bg-white shadow-sm" : "border-gray-200 hover:border-gray-300"
        )}
      >
        {loading ? (
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#1B3A5C]/20 border-t-[#1B3A5C]" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar leads, propuestas, proyectos..."
          className="min-w-0 flex-1 bg-transparent text-sm text-[#1B3A5C] outline-none placeholder:text-gray-400"
        />
        {query && (
          <button type="button" onClick={limpiar} className="shrink-0">
            <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
        {!query && (
          <kbd className="hidden shrink-0 items-center gap-0.5 font-mono text-[10px] text-gray-400 sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        )}
      </div>

      <AnimatePresence>
        {open && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-11 z-50 max-h-[480px] overflow-y-auto overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
          >
            {!loading && resultados.length === 0 && (
              <div className="py-10 text-center">
                <Search className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">
                  Sin resultados para &quot;{query}&quot;
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Intenta con otro término
                </p>
              </div>
            )}

            {resultados.length > 0 && (
              <>
                {Object.entries(grupos).map(([tipo, items]) => (
                  <div key={tipo}>
                    <div className="sticky top-0 flex items-center justify-between bg-gray-50/80 px-4 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {TIPO_LABEL[tipo] || tipo}s
                      </span>
                      <span className="text-xs text-gray-400">{items.length}</span>
                    </div>

                    {items.map((r, idx) => {
                      const globalIdx = resultados.indexOf(r);
                      const Icono = ICONO_MAP[r.icono] || Search;
                      const isActive = selected === globalIdx;

                      return (
                        <button
                          key={`${r.tipo}-${r.id}-${idx}`}
                          type="button"
                          onClick={() => navegarA(r)}
                          onMouseEnter={() => setSelected(globalIdx)}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                            "border-b border-gray-50 last:border-0",
                            isActive ? "bg-[#1B3A5C]/5" : "hover:bg-gray-50"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs",
                              TIPO_COLOR[r.tipo]
                            )}
                          >
                            <Icono className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#1B3A5C]">
                              {resaltar(r.titulo, query)}
                            </p>
                            <p className="truncate text-xs text-gray-400">
                              {resaltar(r.subtitulo, query)}
                              {r.detalle && ` · ${r.detalle}`}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {r.extra && (
                              <span className="max-w-[80px] truncate text-xs text-gray-400">
                                {r.extra}
                              </span>
                            )}
                            <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}

                {total > 15 && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                    <p className="text-center text-xs text-gray-400">
                      Mostrando 15 de {total} resultados. Agrega más términos
                      para afinar la búsqueda.
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
