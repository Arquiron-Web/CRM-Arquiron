"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  accentColor?: string;
  accentType?: "solid" | "gradient";
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const widths = {
  sm: "!max-w-[580px] w-[88vw]",
  md: "!max-w-[580px] w-[88vw]",
  lg: "!max-w-[720px] w-[90vw]",
  xl: "!max-w-[920px] w-[92vw]",
  full: "!max-w-[960px] w-[92vw]",
} as const;

export function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  size = "lg",
  accentColor = "#1B3A5C",
  accentType = "solid",
  headerRight,
  children,
  footer,
}: ModalShellProps) {
  const accentStyle =
    accentType === "gradient"
      ? {
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99, #4CCED5)`,
        }
      : { background: accentColor };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          widths[size],
          "flex flex-col gap-0 overflow-hidden rounded-2xl p-0 max-h-[92vh]"
        )}
        showCloseButton
      >
        {/* Banda accent superior */}
        <div className="h-1 w-full shrink-0" style={accentStyle} />

        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-8 pb-5 pt-7">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-xl font-bold leading-tight text-[#1B3A5C]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm leading-relaxed text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>

        {/* Cuerpo scrollable */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer fijo — siempre visible */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-white px-8 py-4">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
