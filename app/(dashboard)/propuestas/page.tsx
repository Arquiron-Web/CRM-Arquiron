"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  X,
  FileText,
  MoreHorizontal,
  Pencil,
  Eye,
  Send,
  Copy,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PropuestaBadge } from "@/components/ui/PropuestaBadge";
import { ESTADOS_PROPUESTA } from "@/types/propuesta";
import { toast } from "sonner";
import type { Propuesta } from "@/types/propuesta";
import type { Consultor } from "@/types/consultor";

const PER_PAGE = 10;

function formatFechaCorta(fecha: string): string {
  if (!fecha) return "-";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function PropuestasPage() {
  const router = useRouter();
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroConsultor, setFiltroConsultor] = useState("todos");
  const [page, setPage] = useState(1);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [confirmarEnvio, setConfirmarEnvio] = useState<Propuesta | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [propRes, consRes] = await Promise.all([
        fetch("/api/propuestas"),
        fetch("/api/consultores"),
      ]);
      if (propRes.status === 401 || consRes.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!propRes.ok) throw new Error("Error al cargar propuestas");
      if (!consRes.ok) throw new Error("Error al cargar consultores");
      const [propData, consData] = await Promise.all([
        propRes.json(),
        consRes.json(),
      ]);
      setPropuestas(propData);
      setConsultores(consData);
    } catch {
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPropuestas = useMemo(() => {
    let result = [...propuestas];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.titulo || "").toLowerCase().includes(q) ||
          (p.empresaCliente || "").toLowerCase().includes(q) ||
          (p.contacto || "").toLowerCase().includes(q)
      );
    }
    if (filtroEstado !== "todos") {
      result = result.filter((p) => (p.estado || "Borrador") === filtroEstado);
    }
    if (filtroConsultor !== "todos") {
      result = result.filter(
        (p) => (p.consultor || "").trim() === filtroConsultor
      );
    }
    return result;
  }, [propuestas, search, filtroEstado, filtroConsultor]);

  const totalPages = Math.ceil(filteredPropuestas.length / PER_PAGE);
  const startIdx = (page - 1) * PER_PAGE;
  const paginatedPropuestas = filteredPropuestas.slice(
    startIdx,
    startIdx + PER_PAGE
  );

  const hasActiveFilters =
    filtroEstado !== "todos" || filtroConsultor !== "todos";

  const clearFilters = () => {
    setFiltroEstado("todos");
    setFiltroConsultor("todos");
    setSearch("");
    setPage(1);
  };

  const handleEnviar = async (propuesta: Propuesta) => {
    setEnviandoId(propuesta.id);
    try {
      const res = await fetch("/api/propuestas/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(propuesta),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al enviar");
      }
      const ahora = new Date().toISOString();
      await fetch("/api/propuestas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...propuesta,
          id: propuesta.id,
          estado: "Enviada",
          fechaEnvio: ahora,
        }),
      });
      setPropuestas((prev) =>
        prev.map((p) =>
          p.id === propuesta.id
            ? { ...p, estado: "Enviada", fechaEnvio: ahora }
            : p
        )
      );
      setConfirmarEnvio(null);
      toast.success(`Propuesta enviada exitosamente a ${propuesta.emailCliente}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al enviar. Intenta de nuevo."
      );
    } finally {
      setEnviandoId(null);
    }
  };

  const handleDuplicar = async (propuesta: Propuesta) => {
    try {
      const nuevoId = "PROP-" + Date.now();
      const copia = {
        ...propuesta,
        id: nuevoId,
        titulo: (propuesta.titulo || "") + " (Copia)",
        estado: "Borrador",
        fechaEnvio: "",
        fechaVisto: "",
        timestamp: new Date().toISOString(),
      };
      const res = await fetch("/api/propuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copia),
      });
      if (!res.ok) throw new Error("Error al duplicar");
      toast.success("Propuesta duplicada");
      await fetchData();
      router.push(`/propuestas/${nuevoId}/editar`);
    } catch {
      toast.error("Error al duplicar");
    }
  };

  const handleMarcarEstado = async (
    propuesta: Propuesta,
    nuevoEstado: string
  ) => {
    if (!propuesta.id) return;
    try {
      const res = await fetch("/api/propuestas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...propuesta,
          id: propuesta.id,
          estado: nuevoEstado,
        }),
      });
      if (!res.ok) throw new Error("Error");
      setPropuestas((prev) =>
        prev.map((p) =>
          p.id === propuesta.id ? { ...p, estado: nuevoEstado } : p
        )
      );
      toast.success(`Estado actualizado a ${nuevoEstado}`);
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchData}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1B3A5C]">Propuestas</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Crea y gestiona propuestas comerciales profesionales
          </p>
        </div>
        <Button
          onClick={() => router.push("/propuestas/nueva")}
          className="rounded-xl bg-[#1B3A5C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#33487A]"
        >
          + Nueva Propuesta
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-0 sm:w-[35%]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por título, empresa o contacto..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border-gray-200 pl-9"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={filtroEstado}
            onValueChange={(v) => {
              setFiltroEstado(v ?? "todos");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] rounded-xl border-gray-200">
              <SelectValue placeholder="Estado">
                {(val: string | null) =>
                  val && val !== "todos"
                    ? ESTADOS_PROPUESTA.find((e) => e.value === val)?.label || "Todos"
                    : "Todos"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {ESTADOS_PROPUESTA.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filtroConsultor}
            onValueChange={(v) => {
              setFiltroConsultor(v ?? "todos");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] rounded-xl border-gray-200">
              <SelectValue placeholder="Consultor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {consultores.map((c) => (
                <SelectItem key={c.id} value={c.nombre}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-gray-500 hover:text-red-500"
              onClick={clearFilters}
            >
              <X className="mr-1 h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-x-auto overflow-hidden rounded-2xl border border-gray-100 bg-white"
      >
        {loading ? (
          <div className="p-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-gray-50 py-4 last:border-0"
              >
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : filteredPropuestas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-700">Sin propuestas</p>
            <p className="text-sm text-gray-500">
              Crea tu primera propuesta comercial
            </p>
            <Button
              onClick={() => router.push("/propuestas/nueva")}
              className="rounded-xl bg-[#1B3A5C]"
            >
              + Nueva Propuesta
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1.2fr_1fr_1fr_100px_80px_80px_120px_60px] gap-4 border-b border-gray-100 px-6 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              <div>Propuesta</div>
              <div>Cliente</div>
              <div>Deal/Servicio</div>
              <div>Valor</div>
              <div>Estado</div>
              <div>Versión</div>
              <div>Creada</div>
              <div />
            </div>

            {paginatedPropuestas.map((propuesta, index) => (
              <motion.div
                key={propuesta.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                className="grid grid-cols-[1.2fr_1fr_1fr_100px_80px_80px_120px_60px] items-center gap-4 border-b border-gray-50 px-6 py-4 last:border-0 hover:bg-gray-50/50"
              >
                <div>
                  <p className="text-sm font-semibold text-[#1B3A5C]">
                    {propuesta.titulo || "-"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Por {propuesta.consultor || "-"}
                  </p>
                </div>
                <div className="text-sm text-gray-700">
                  {propuesta.empresaCliente || "-"}
                </div>
                <div className="text-sm text-gray-500">
                  {propuesta.servicioForja || "-"}
                </div>
                <div className="text-sm font-semibold text-green-600">
                  {propuesta.valorUSD
                    ? `$${propuesta.valorUSD} USD`
                    : "-"}
                </div>
                <div>
                  <PropuestaBadge estado={propuesta.estado || "Borrador"} size="sm" />
                </div>
                <div className="text-xs text-gray-400">
                  v{propuesta.version || "1.0"}
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    {formatFechaCorta(propuesta.fechaCreacion)}
                  </p>
                  {propuesta.fechaEnvio && (
                    <p className="text-xs text-gray-400">
                      Enviada {formatFechaCorta(propuesta.fechaEnvio)}
                    </p>
                  )}
                </div>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/propuestas/${propuesta.id}/editar`)
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/propuestas/${propuesta.id}/preview`)
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Vista previa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setConfirmarEnvio(propuesta)}
                        disabled={
                          enviandoId === propuesta.id ||
                          (propuesta.estado || "") === "Enviada"
                        }
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Enviar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicar(propuesta)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          handleMarcarEstado(propuesta, "Aceptada")
                        }
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marcar aceptada
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleMarcarEstado(propuesta, "Rechazada")
                        }
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Marcar rechazada
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </>
        )}

        {!loading && filteredPropuestas.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-sm text-gray-600">
              Mostrando {startIdx + 1}-
              {Math.min(startIdx + PER_PAGE, filteredPropuestas.length)} de{" "}
              {filteredPropuestas.length} propuestas
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      <Dialog
        open={!!confirmarEnvio}
        onOpenChange={(open) => !open && setConfirmarEnvio(null)}
      >
        <DialogContent showCloseButton={true} className="!max-w-[480px] w-[88vw] rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full rounded-t-2xl bg-[#1B3A5C]" />
          <div className="px-8 pt-7 pb-5">
          <DialogHeader>
            <DialogTitle>¿Enviar propuesta?</DialogTitle>
            <p className="text-sm text-gray-600">
              Se enviará a {confirmarEnvio?.contacto} ({confirmarEnvio?.emailCliente})
              desde tu cuenta de correo.
            </p>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmarEnvio(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => confirmarEnvio && handleEnviar(confirmarEnvio)}
              disabled={enviandoId === confirmarEnvio?.id}
              className="bg-[#1B3A5C]"
            >
              {enviandoId === confirmarEnvio?.id ? "Enviando..." : "Enviar ahora"}
            </Button>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
