"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Color de la banda superior y del botón de confirmación. Rojo para acciones destructivas irreversibles, naranja para advertencias. */
  accentColor?: string;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  accentColor = "#D4881E",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        className="!max-w-[480px] w-[88vw] rounded-2xl p-0 overflow-hidden"
        showCloseButton={true}
      >
        <div className="h-1 w-full rounded-t-2xl" style={{ background: accentColor }} />
        <div className="px-8 pt-7 pb-6">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <p className="mt-2 text-sm text-gray-500">{description}</p>
            )}
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel} className="rounded-xl px-6">
              {cancelLabel}
            </Button>
            <Button
              className="rounded-xl px-6 text-white hover:opacity-90"
              style={{ backgroundColor: accentColor }}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
