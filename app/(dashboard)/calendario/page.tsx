"use client";

import { useEffect, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import { ChevronLeft, ChevronRight, CalendarX, Clock, Building2, MapPin, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewEventoModal } from "@/components/calendario/NewEventoModal";
import { EventoDetailModal, type DatosInteraccionPreCargados } from "@/components/calendario/EventoDetailModal";
import { NewInteraccionModal } from "@/components/interacciones/NewInteraccionModal";
import { toast } from "sonner";
import { TIPOS_EVENTO } from "@/types/evento";
import type { Evento } from "@/types/evento";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getTipoConfig(tipo: string) {
  return TIPOS_EVENTO.find((t) => t.value === tipo) || TIPOS_EVENTO[5];
}

function extraerHora(iso: string): string {
  if (!iso || iso.length <= 10) return "";
  try {
    const d = parseISO(iso);
    return format(d, "HH:mm");
  } catch {
    return "";
  }
}

function extraerFecha(iso: string): string {
  if (!iso) return "";
  try {
    const d = parseISO(iso);
    return format(d, "d 'de' MMMM", { locale: es });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function CalendarioPage() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error401, setError401] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [slideDir, setSlideDir] = useState(0);
  const [showInteraccionModal, setShowInteraccionModal] = useState(false);
  const [interaccionPreCargada, setInteraccionPreCargada] = useState<DatosInteraccionPreCargados | null>(null);
  const [interacciones, setInteracciones] = useState<{ titulo?: string; empresa?: string; fecha?: string }[]>([]);

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    setError401(false);
    try {
      const res = await fetch(`/api/calendario?mes=${mes}&anio=${anio}`);
      if (res.status === 401) {
        setError401(true);
        setEventos([]);
        return;
      }
      if (!res.ok) throw new Error("Error al cargar eventos");
      const data = await res.json();
      setEventos(data);
    } catch (err) {
      console.error("Error calendario:", err);
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }, [mes, anio]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const fetchInteracciones = useCallback(async () => {
    try {
      const res = await fetch("/api/interacciones");
      if (res.ok) {
        const data = await res.json();
        setInteracciones(Array.isArray(data) ? data : []);
      }
    } catch {
      setInteracciones([]);
    }
  }, []);

  useEffect(() => {
    fetchInteracciones();
  }, [fetchInteracciones]);

  const tieneInteraccion = (evento: Evento): boolean => {
    const fechaEvento = evento.inicio?.split("T")[0] || "";
    return interacciones.some(
      (i) =>
        i.titulo?.includes(evento.titulo) ||
        (i.empresa === evento.cliente && i.fecha === fechaEvento)
    );
  };

  const fechaActual = new Date(anio, mes - 1, 1);
  const inicioMes = startOfMonth(fechaActual);
  const finMes = endOfMonth(fechaActual);
  const dias = eachDayOfInterval({ start: inicioMes, end: finMes });

  const primerDiaSemana = inicioMes.getDay();
  const celdasVaciasInicio = Array(primerDiaSemana).fill(null);
  const diasConPadding = [...celdasVaciasInicio, ...dias];
  const totalCeldas = 42;
  const celdasRestantes = totalCeldas - diasConPadding.length;
  const celdasFinal = [
    ...diasConPadding,
    ...Array(Math.max(0, celdasRestantes)).fill(null),
  ];
  const semanas: (Date | null)[][] = [];
  for (let i = 0; i < celdasFinal.length; i += 7) {
    semanas.push(celdasFinal.slice(i, i + 7));
  }

  const eventosPorDia = (dia: Date) =>
    eventos.filter((e) => {
      const inicio = e.inicio?.slice(0, 10);
      const diaStr = format(dia, "yyyy-MM-dd");
      return inicio === diaStr;
    });

  const proximosEventos = eventos
    .filter((e) => {
      const d = e.inicio ? parseISO(e.inicio) : null;
      return d && d >= new Date(new Date().setHours(0, 0, 0, 0));
    })
    .sort((a, b) => (a.inicio < b.inicio ? -1 : 1))
    .slice(0, 8);

  const handleEventoEliminado = (id: string) => {
    setEventos((prev) => prev.filter((e) => e.id !== id));
    setEventoSeleccionado(null);
  };

  const handleEventoActualizado = () => {
    fetchEventos();
    setEventoSeleccionado(null);
  };

  const handleEventoCreado = () => {
    fetchEventos();
    setShowNewModal(false);
  };

  const nombreMes = format(fechaActual, "MMMM", { locale: es });
  const nombreMesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Calendario</h1>
          <p className="text-sm text-gray-500">
            Gestiona reuniones y eventos con clientes
          </p>
        </div>
        <Button
          onClick={() => setShowNewModal(true)}
          className="rounded-xl bg-[#1B3A5C] text-white hover:bg-[#33487A]"
        >
          + Nuevo Evento
        </Button>
      </div>

      {error401 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Tu sesión necesita actualizarse para acceder al calendario. Cierra
            sesión y vuelve a entrar para continuar.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Cerrar sesión
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSlideDir(-1);
                    const d = subMonths(new Date(anio, mes - 1), 1);
                    setMes(d.getMonth() + 1);
                    setAnio(d.getFullYear());
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSlideDir(1);
                    const d = addMonths(new Date(anio, mes - 1), 1);
                    setMes(d.getMonth() + 1);
                    setAnio(d.getFullYear());
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-lg font-semibold text-[#1B3A5C]">
                {nombreMesCapitalizado} De {anio}
              </h2>
            </div>

            {loading ? (
              <Skeleton className="h-[400px] w-full rounded-xl" />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${mes}-${anio}`}
                  initial={{ opacity: 0, x: slideDir === 1 ? 40 : slideDir === -1 ? -40 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slideDir === 1 ? -40 : 40 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-7 gap-px">
                    {DIAS_SEMANA.map((d) => (
                      <div
                        key={d}
                        className="py-2 text-center text-xs font-medium uppercase text-gray-400"
                      >
                        {d}
                      </div>
                    ))}
                    {semanas.flat().map((dia, idx) => {
                      if (!dia) {
                        return <div key={`empty-${idx}`} className="min-h-[100px]" />;
                      }
                      const eventosDia = eventosPorDia(dia);
                      const esHoy = isToday(dia);
                      return (
                        <motion.div
                          key={dia.toISOString()}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="min-h-[100px] border border-gray-50 p-2"
                        >
                          <div
                            className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                              esHoy ? "bg-[#1B3A5C] text-white" : "text-gray-700"
                            }`}
                          >
                            {format(dia, "d")}
                          </div>
                          <div className="space-y-1">
                            {eventosDia.slice(0, 3).map((ev) => {
                              const cfg = getTipoConfig(ev.tipo);
                              return (
                                <button
                                  key={ev.id}
                                  type="button"
                                  onClick={() => setEventoSeleccionado(ev)}
                                  className={`flex w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-left text-xs font-medium ${cfg.bgClass} ${cfg.textClass} cursor-pointer hover:opacity-90`}
                                >
                                  <span className="truncate">{ev.titulo}</span>
                                  {tieneInteraccion(ev) && (
                                    <span
                                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500"
                                      title="Interacción registrada"
                                    />
                                  )}
                                </button>
                              );
                            })}
                            {eventosDia.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{eventosDia.length - 3} más
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {!loading && eventos.length === 0 && !error401 && (
              <div className="flex flex-col items-center justify-center py-16">
                <CalendarX className="h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Sin eventos este mes</p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => setShowNewModal(true)}
                >
                  + Crear primer evento
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-80">
          <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-4">
            <h3 className="text-base font-semibold text-[#1B3A5C]">
              Próximos Eventos
            </h3>
            {loading ? (
              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {proximosEventos.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay eventos próximos</p>
                ) : (
                  proximosEventos.map((ev) => {
                    const cfg = getTipoConfig(ev.tipo);
                    return (
                      <div
                        key={ev.id}
                        className="border-b border-gray-50 pb-4 last:border-0 last:pb-0"
                      >
                        <p className="font-semibold text-[#1B3A5C]">{ev.titulo}</p>
                        <span
                          className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${cfg.bgClass} ${cfg.textClass}`}
                        >
                          {ev.tipo}
                        </span>
                        <p className="mt-1 text-sm text-gray-500">
                          {extraerFecha(ev.inicio)}
                        </p>
                        {!ev.todoElDia && (
                          <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="h-3.5 w-3.5" />
                            {extraerHora(ev.inicio)} - {extraerHora(ev.fin)}
                          </p>
                        )}
                        {ev.cliente && (
                          <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-600">
                            <Building2 className="h-3.5 w-3.5" />
                            {ev.cliente}
                          </p>
                        )}
                        {(ev.link || ev.ubicacion) && (
                          <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                            {ev.link?.startsWith("http") ? (
                              <Video className="h-3.5 w-3.5" />
                            ) : (
                              <MapPin className="h-3.5 w-3.5" />
                            )}
                            {ev.link?.startsWith("http")
                              ? "Link disponible"
                              : ev.ubicacion}
                          </p>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => setEventoSeleccionado(ev)}
                        >
                          Ver
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <NewEventoModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={handleEventoCreado}
      />

      <EventoDetailModal
        evento={eventoSeleccionado}
        open={!!eventoSeleccionado}
        onClose={() => setEventoSeleccionado(null)}
        onEliminado={handleEventoEliminado}
        onActualizado={handleEventoActualizado}
        onRegistrarInteraccion={(datos) => {
          setEventoSeleccionado(null);
          setInteraccionPreCargada(datos);
          setShowInteraccionModal(true);
        }}
      />

      <NewInteraccionModal
        open={showInteraccionModal}
        onClose={() => {
          setShowInteraccionModal(false);
          setInteraccionPreCargada(null);
        }}
        onSuccess={() => {
          setShowInteraccionModal(false);
          setInteraccionPreCargada(null);
          toast.success("Interacción registrada correctamente");
          fetchInteracciones();
        }}
        datosPreCargados={interaccionPreCargada ?? undefined}
        origenCalendario={!!interaccionPreCargada}
      />
    </div>
  );
}
