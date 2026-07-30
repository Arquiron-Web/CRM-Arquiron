"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, Pencil, User, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { getPaisLabel } from "@/lib/pipeline-utils";
import ConsultorModal, { type ConsultorForm } from "./ConsultorModal";

const ARQUIRON_COLORS = ["#1B3A5C", "#33487A", "#8560C0", "#D4881E", "#4CCED5"];

function getAvatarColor(nombre: string): string {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h += nombre.charCodeAt(i);
  return ARQUIRON_COLORS[h % ARQUIRON_COLORS.length];
}

function getIniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (nombre.slice(0, 2) || "??").toUpperCase();
}

const PAIS_EMOJI: Record<string, string> = {
  colombia: "🇨🇴",
  ecuador: "🇪🇨",
  peru: "🇵🇪",
  chile: "🇨🇱",
  mexico: "🇲🇽",
};

type Consultor = {
  id: string;
  nombre: string;
  email: string;
  cargo: string;
  especialidad: string;
  pais: string;
  ciudad: string;
  fechaIngreso: string;
};

export default function TabConsultores() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editConsultor, setEditConsultor] = useState<ConsultorForm | null>(null);
  const [desactivarOpen, setDesactivarOpen] = useState<Consultor | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    leadsAsignados: 0,
    topConsultor: "",
  });

  const fetchConsultores = useCallback(async () => {
    try {
      const res = await fetch("/api/configuracion/consultores");
      if (res.ok) {
        const data = await res.json();
        setConsultores(data);
        setStats((s) => ({ ...s, total: data.length }));
      }
    } catch {
      toast.error("Error al cargar consultores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsultores();
  }, [fetchConsultores]);

  useEffect(() => {
    if (consultores.length === 0) return;
    const fetchLeads = async () => {
      try {
        const res = await fetch("/api/leads");
        if (res.ok) {
          const leads: { consultorAsignado?: string }[] = await res.json();
          const porConsultor: Record<string, number> = {};
          leads.forEach((l) => {
            const c = (l.consultorAsignado || "").trim();
            if (c) porConsultor[c] = (porConsultor[c] || 0) + 1;
          });
          const total = Object.values(porConsultor).reduce((a, b) => a + b, 0);
          const top = Object.entries(porConsultor).sort((a, b) => b[1] - a[1])[0];
          setStats((s) => ({
            ...s,
            leadsAsignados: total,
            topConsultor: top ? `${top[0]} (${top[1]})` : "-",
          }));
        }
      } catch {
        // ignore
      }
    };
    fetchLeads();
  }, [consultores.length]);

  const handleDesactivar = async () => {
    if (!desactivarOpen) return;
    try {
      const res = await fetch("/api/configuracion/consultores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: desactivarOpen.id }),
      });
      if (res.ok) {
        toast.success("Consultor desactivado");
        setDesactivarOpen(null);
        fetchConsultores();
      } else {
        const d = await res.json();
        toast.error(d?.error || "Error al desactivar");
      }
    } catch {
      toast.error("Error al desactivar");
    }
  };

  const openEdit = (c: Consultor) => {
    setEditConsultor({
      id: c.id,
      nombre: c.nombre,
      email: c.email,
      cargo: c.cargo,
      especialidad: c.especialidad,
      pais: c.pais || "colombia",
      ciudad: c.ciudad,
      fechaIngreso: c.fechaIngreso || "",
    });
    setModalOpen(true);
  };

  const paisEmoji = (p: string) =>
    PAIS_EMOJI[(p || "").toLowerCase()] || "🌎";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1B3A5C]">Gestión del equipo</h2>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditConsultor(null);
              setModalOpen(true);
            }}
            className="bg-[#1B3A5C] text-white rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar consultor
          </Button>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : consultores.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Sin consultores registrados. Agrega el primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Consultor
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Cargo
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Especialidad
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    País
                  </th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {consultores.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: getAvatarColor(c.nombre) }}
                        >
                          {getIniciales(c.nombre)}
                        </div>
                        <div>
                          <p className="font-medium text-[#1B3A5C]">
                            {c.nombre}
                          </p>
                          <p className="text-xs text-gray-500">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.cargo || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.especialidad || "")
                          .split(",")
                          .map((e, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: "#8560C020",
                                color: "#8560C0",
                              }}
                            >
                              {e.trim()}
                            </span>
                          ))}
                        {!c.especialidad?.trim() && "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        {paisEmoji(c.pais)} {getPaisLabel(c.pais)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            />
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isAdmin && (
                            <DropdownMenuItem onClick={() => openEdit(c)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/leads?consultor=${encodeURIComponent(c.nombre)}`
                              )
                            }
                          >
                            <User className="h-4 w-4 mr-2" />
                            Ver leads asignados
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDesactivarOpen(c)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Desactivar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-xl border border-gray-100 bg-white p-4"
        >
          <p className="text-xs font-medium text-gray-500">
            Total consultores activos
          </p>
          <p className="mt-1 text-2xl font-bold text-[#1B3A5C]">
            {stats.total}
          </p>
        </motion.div>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-xl border border-gray-100 bg-white p-4"
        >
          <p className="text-xs font-medium text-gray-500">
            Leads asignados (total)
          </p>
          <p className="mt-1 text-2xl font-bold text-[#1B3A5C]">
            {stats.leadsAsignados}
          </p>
        </motion.div>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-xl border border-gray-100 bg-white p-4"
        >
          <p className="text-xs font-medium text-gray-500">
            Consultor con más leads
          </p>
          <p className="mt-1 text-lg font-bold text-[#1B3A5C] truncate">
            {stats.topConsultor || "-"}
          </p>
        </motion.div>
      </div>

      <ConsultorModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditConsultor(null);
        }}
        onSuccess={fetchConsultores}
        editData={editConsultor}
      />

      <Dialog open={!!desactivarOpen} onOpenChange={(o) => !o && setDesactivarOpen(null)}>
        <DialogContent className="!max-w-[480px] w-[88vw] rounded-2xl p-0 overflow-hidden">
          <div className="h-1 w-full rounded-t-2xl bg-[#1B3A5C]" />
          <div className="px-8 pt-7 pb-5">
          <DialogHeader>
            <DialogTitle>¿Desactivar consultor?</DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Se limpiará la fila en el Sheet. Esta acción no se puede deshacer.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesactivarOpen(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDesactivar}
            >
              Desactivar
            </Button>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
