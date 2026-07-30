"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Activity,
  GitBranch,
  FileText,
  Briefcase,
  CheckSquare,
  MessageSquare,
  CalendarDays,
  BarChart2,
  Settings,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activo?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", activo: true },
  { href: "/leads", icon: Users, label: "Leads", activo: true },
  { href: "/madurez", icon: Activity, label: "Madurez", activo: true },
  { href: "/pipeline", icon: GitBranch, label: "Pipeline", activo: true },
  { href: "/propuestas", icon: FileText, label: "Propuestas", activo: true },
  { href: "/proyectos", icon: Briefcase, label: "Proyectos", activo: true },
  { href: "/tareas", icon: CheckSquare, label: "Tareas", activo: true },
  { href: "/interacciones", icon: MessageSquare, label: "Interacciones", activo: true },
  { href: "/calendario", icon: CalendarDays, label: "Calendario", activo: true },
  { href: "/reportes", icon: BarChart2, label: "Reportes", activo: true },
];

const configItem = {
  href: "/configuracion",
  icon: Settings,
  label: "Configuración",
  activo: true,
};

function getSaludo() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const firstName = session?.user?.name?.split(" ")[0] || "Usuario";

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "linear-gradient(135deg, #1D1A70, #8560C0)" }}
        >
          <span className="text-sm font-black text-white">A</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-2 overflow-hidden whitespace-nowrap font-bold text-lg tracking-tight text-white"
            >
              Arquiron
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex cursor-pointer items-center rounded-xl transition-colors duration-150",
                  collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon
                  className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="ml-3 overflow-hidden whitespace-nowrap text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Configuración + Usuario */}
      <div className="mt-auto shrink-0">
        <div className="mx-4 mb-2 border-t border-white/10" />
        <Link href={configItem.href}>
          <div
            title={collapsed ? configItem.label : undefined}
            className={cn(
              "flex cursor-pointer items-center rounded-xl transition-colors duration-150",
              collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5",
              pathname.startsWith("/configuracion")
                ? "bg-white/15 text-white"
                : "text-blue-200 hover:bg-white/10 hover:text-white"
            )}
          >
            <configItem.icon
              className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")}
            />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="ml-3 overflow-hidden whitespace-nowrap text-sm font-medium"
                >
                  Configuración
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>

        {/* Usuario logueado */}
        <div
          className={cn(
            "mx-2 mb-4 mt-1 flex items-center rounded-xl border border-white/10 p-2",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="bg-[#D4881E] text-sm font-bold text-white">
              {session?.user?.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <p className="truncate text-xs font-semibold text-white">
                  {session?.user?.name || "Arquiron"}
                </p>
                <p className="truncate text-xs text-blue-300">
                  {session?.user?.email || "contacto@arquiron.com"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Cerrar sesión"
                className="shrink-0 text-blue-300 transition-colors hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen overflow-hidden bg-gray-50">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Colapsable en desktop, overlay en móvil */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 224 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ minWidth: collapsed ? 64 : 224 }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col overflow-hidden bg-[#1B3A5C]",
          "hidden lg:flex",
          sidebarOpen && "!flex"
        )}
      >
        {sidebarContent}

        {/* Botón colapsar - solo desktop */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-16 z-50 hidden h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-colors hover:bg-gray-50 lg:flex"
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.25 }}
          >
            <ChevronRight className="h-3 w-3 text-[#1B3A5C]" />
          </motion.div>
        </button>

        {/* Botón cerrar móvil */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-4 text-white hover:bg-white/10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </motion.aside>

      {/* Main content — padding ajustado al ancho del sidebar */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col overflow-hidden transition-[padding-left] duration-300 ease-in-out",
          collapsed ? "lg:pl-16" : "lg:pl-[224px]"
        )}
      >
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden lg:block">
              <p className="text-base font-bold text-[#1B3A5C]">
                {getSaludo()}, {firstName}
              </p>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString("es-CO", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <div className="mx-1 h-6 w-px bg-gray-200" />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
