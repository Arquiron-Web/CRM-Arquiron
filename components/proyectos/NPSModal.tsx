"use client";

import { useState } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildNotasConNPS, getCategoriaNPS } from "@/lib/nps-utils";
import type { Proyecto } from "@/types/proyecto";

interface NPSModalProps {
  proyecto: Proyecto | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (notasActualizadas: string) => void;
}

export function NPSModal({
  proyecto,
  open,
  onClose,
  onSuccess,
}: NPSModalProps) {
  const [puntuacion, setPuntuacion] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);

  if (!proyecto) return null;

  const handleGuardar = async () => {
    if (puntuacion === null) {
      toast.error("Selecciona una puntuación");
      return;
    }
    setSaving(true);
    try {
      const notasNuevas = buildNotasConNPS(
        proyecto.notas || "",
        puntuacion,
        comentario
      );
      const res = await fetch("/api/proyectos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...proyecto,
          notas: notasNuevas,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");

      if (proyecto.idLead) {
        try {
          const leadsRes = await fetch("/api/leads");
          if (leadsRes.ok) {
            const leads = await leadsRes.json();
            const lead = Array.isArray(leads)
              ? leads.find((l: { id?: string }) => l.id === proyecto.idLead)
              : null;
            if (lead && (lead.estadoLead || "NUEVO") !== "GANADO") {
              await fetch("/api/leads", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: lead.id,
                  estadoLead: "GANADO",
                }),
              });
            }
          }
        } catch {
          /* silenciar si falla actualizar lead */
        }
      }

      onSuccess(notasNuevas);
      const cat = getCategoriaNPS(puntuacion);
      toast.success(`NPS registrado — Puntuación: ${puntuacion}/10 (${cat})`);
      onClose();
      setPuntuacion(null);
      setComentario("");
    } catch {
      toast.error("Error al guardar NPS");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setPuntuacion(null);
    setComentario("");
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Registrar satisfacción del cliente"
      subtitle={`${proyecto.empresaCliente} — ${proyecto.nombre}`}
      size="md"
      accentColor="#D4881E"
      accentType="solid"
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={saving || puntuacion === null}
            className="rounded-xl bg-[#1B3A5C] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#33487A]"
          >
            {saving ? "Guardando..." : "Guardar NPS"}
          </Button>
        </>
      }
    >
      <div className="space-y-6 px-8 py-6">
          <p className="text-sm text-gray-700">
            ¿Qué tan probable es que {proyecto.contacto || "el cliente"}{" "}
            recomiende Arquiron a otros empresarios?
          </p>

          <div>
            <div className="flex flex-wrap gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPuntuacion(n)}
                  className={cn(
                    "h-10 w-10 rounded-lg text-sm font-bold transition-colors",
                    puntuacion === n
                      ? n <= 6
                        ? "bg-red-500 text-white"
                        : n <= 8
                          ? "bg-yellow-500 text-white"
                          : "bg-green-500 text-white"
                      : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>Muy improbable</span>
              <span>Muy probable</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400">
              Comentario del cliente (opcional)
            </label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="¿Qué podría mejorar? ¿Qué fue lo más valioso?"
              rows={3}
              className="mt-1 resize-none rounded-xl"
            />
          </div>
        </div>
    </ModalShell>
  );
}
