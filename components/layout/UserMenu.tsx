"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  label?: string;
  icono?: React.ComponentType<{ className?: string }>;
  accion?: () => void;
  tipo: "item" | "separador" | "header";
  peligro?: boolean;
}

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const nombre = session?.user?.name || "Arquiron";
  const email = session?.user?.email || "contacto@arquiron.com";
  const inicial = nombre.charAt(0).toUpperCase();
  const imagen = session?.user?.image;

  const menuItems: MenuItem[] = [
    { label: "Mi Cuenta", tipo: "header" },
    {
      label: "Perfil",
      icono: User,
      accion: () => {
        setOpen(false);
        router.push("/configuracion");
      },
      tipo: "item",
    },
    {
      label: "Configuración",
      icono: Settings,
      accion: () => {
        setOpen(false);
        router.push("/configuracion");
      },
      tipo: "item",
    },
    { tipo: "separador" },
    {
      label: "Cerrar sesión",
      icono: LogOut,
      accion: () => signOut({ callbackUrl: "/login" }),
      tipo: "item",
      peligro: true,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2.5 rounded-xl py-1.5 pl-2 pr-3",
          "transition-colors duration-150",
          open ? "bg-gray-100" : "hover:bg-gray-100"
        )}
      >
        {imagen ? (
          <img
            src={imagen}
            alt={nombre}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #1B3A5C, #8560C0)",
            }}
          >
            {inicial}
          </div>
        )}

        <div className="hidden flex-col items-start md:flex">
          <span className="max-w-[120px] truncate text-sm font-semibold leading-tight text-[#1B3A5C]">
            {nombre.split(" ")[0]}
          </span>
          <span className="text-xs leading-tight text-gray-400">Admin</span>
        </div>

        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="hidden md:block"
        >
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1 shadow-xl"
          >
            <div className="border-b border-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                {imagen ? (
                  <img
                    src={imagen}
                    alt={nombre}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #1B3A5C, #8560C0)",
                    }}
                  >
                    {inicial}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1B3A5C]">
                    {nombre}
                  </p>
                  <p className="truncate text-xs text-gray-400">{email}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-50 px-4 pb-1 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Mi Cuenta
              </p>
            </div>

            {menuItems
              .filter(
                (item) => item.tipo === "item" || item.tipo === "separador"
              )
              .map((item, idx) => {
                if (item.tipo === "separador") {
                  return (
                    <div
                      key={idx}
                      className="my-1 border-t border-gray-50"
                    />
                  );
                }
                const Icono = item.icono!;
                return (
                  <button
                    key={idx}
                    onClick={item.accion}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100",
                      item.peligro
                        ? "text-red-500 hover:bg-red-50"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icono className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
