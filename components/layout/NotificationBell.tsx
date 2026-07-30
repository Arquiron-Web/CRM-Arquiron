"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Bell,
  Users,
  FileText,
  GitBranch,
  TrendingUp,
  Eye,
  UserPlus,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONO_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  "file-text": FileText,
  "git-branch": GitBranch,
  "trending-up": TrendingUp,
  eye: Eye,
  "user-plus": UserPlus,
};

const TIPO_ESTILOS = {
  critica: {
    dot: "bg-red-500",
    badge: "bg-red-50 border-red-200 text-red-700",
    ring: "ring-red-100",
  },
  alta: {
    dot: "bg-orange-500",
    badge: "bg-orange-50 border-orange-200 text-orange-700",
    ring: "ring-orange-100",
  },
  media: {
    dot: "bg-yellow-500",
    badge: "bg-yellow-50 border-yellow-200 text-yellow-700",
    ring: "ring-yellow-100",
  },
  info: {
    dot: "bg-blue-500",
    badge: "bg-blue-50 border-blue-200 text-blue-600",
    ring: "ring-blue-100",
  },
};

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  detalle: string;
  accion: string;
  href: string;
  icono: string;
  tiempo: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [leidas, setLeidas] = useState<Set<string>>(new Set());
  const [animarCampana, setAnimarCampana] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const cargarNotificaciones = async () => {
      try {
        const res = await fetch("/api/notificaciones");
        const data = await res.json();
        setNotifs(Array.isArray(data) ? data : []);
      } catch {
        setNotifs([]);
      } finally {
        setLoading(false);
      }
    };
    cargarNotificaciones();
    const intervalo = setInterval(cargarNotificaciones, 5 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const tieneCriticas = notifs.some((n) => n.tipo === "critica");
    if (tieneCriticas) {
      setAnimarCampana(true);
      const t = setTimeout(() => setAnimarCampana(false), 3000);
      return () => clearTimeout(t);
    }
  }, [notifs]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const res = await fetch("/api/notificaciones");
      const data = await res.json();
      setNotifs(Array.isArray(data) ? data : []);
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  };

  const noLeidas = notifs.filter((n) => !leidas.has(n.id)).length;
  const marcarTodas = () => setLeidas(new Set(notifs.map((n) => n.id)));

  const handleAccion = (notif: Notificacion) => {
    setLeidas((prev) => new Set([...prev, notif.id]));
    setOpen(false);
    router.push(notif.href);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        animate={
          animarCampana
            ? { rotate: [0, -15, 15, -10, 10, -5, 5, 0] }
            : { rotate: 0 }
        }
        transition={{ duration: 0.6 }}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative h-9 w-9 flex items-center justify-center rounded-xl",
          "transition-colors duration-150",
          open ? "bg-[#1B3A5C]/10 text-[#1B3A5C]" : "text-gray-500 hover:bg-gray-100"
        )}
      >
        <Bell className="h-5 w-5" />
        {noLeidas > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {noLeidas > 9 ? "9+" : noLeidas}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-96 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-[#1B3A5C]">
                  Notificaciones
                </h3>
                <p className="text-xs text-gray-400">
                  {noLeidas > 0 ? `${noLeidas} sin leer` : "Todo al día"}
                </p>
              </div>
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodas}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#1B3A5C] transition-colors hover:text-[#33487A]"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar todas
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading && (
                <div className="py-8 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#1B3A5C]/20 border-t-[#1B3A5C]" />
                  <p className="mt-2 text-xs text-gray-400">
                    Verificando alertas...
                  </p>
                </div>
              )}

              {!loading && notifs.length === 0 && (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                    <CheckCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="text-sm font-semibold text-[#1B3A5C]">
                    ¡Todo en orden!
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    No hay tareas urgentes pendientes
                  </p>
                </div>
              )}

              {!loading &&
                notifs.map((notif, idx) => {
                  const Icono = ICONO_MAP[notif.icono] || Bell;
                  const estilos =
                    TIPO_ESTILOS[
                      notif.tipo as keyof typeof TIPO_ESTILOS
                    ] || TIPO_ESTILOS.info;
                  const leida = leidas.has(notif.id);

                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleAccion(notif)}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 px-5 py-4 transition-colors",
                        "border-b border-gray-50 last:border-0 hover:bg-gray-50/80",
                        leida && "opacity-60"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                          estilos.badge
                        )}
                      >
                        <Icono className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm font-semibold leading-tight text-[#1B3A5C]",
                              leida && "font-normal"
                            )}
                          >
                            {notif.titulo}
                          </p>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {!leida && (
                              <div
                                className={cn(
                                  "h-2 w-2 shrink-0 rounded-full",
                                  estilos.dot
                                )}
                              />
                            )}
                          </div>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                          {notif.detalle}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs font-medium",
                              estilos.badge
                            )}
                          >
                            {notif.tiempo}
                          </span>
                          <span className="text-xs font-medium text-[#1B3A5C] hover:underline">
                            {notif.accion} →
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            {notifs.length > 0 && (
              <div className="border-t border-gray-50 bg-gray-50/50 px-5 py-3">
                <button
                  onClick={() => {
                    cargarNotificaciones();
                  }}
                  className="w-full text-center text-xs text-gray-400 transition-colors hover:text-[#1B3A5C]"
                >
                  Actualizar notificaciones
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
