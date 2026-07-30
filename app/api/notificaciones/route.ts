import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json([], { status: 401 });
    }

    const [leads, propuestas, tareas] = await Promise.all([
      prisma.lead.findMany(),
      prisma.propuesta.findMany(),
      prisma.tarea.findMany(),
    ]);

    const ahora = new Date();

    const notificaciones: Array<{
      id: string;
      tipo: string;
      titulo: string;
      detalle: string;
      accion: string;
      href: string;
      icono: string;
      tiempo: string;
    }> = [];

    // ── ALERTA 1: Leads sin contactar >48h ──────────────────
    const leadsUrgentes = leads.filter((l) => {
      if (l.estadoLead !== "NUEVO") return false;
      const diffHoras = (ahora.getTime() - l.createdAt.getTime()) / 3600000;
      return diffHoras > 48;
    });
    if (leadsUrgentes.length > 0) {
      notificaciones.push({
        id: "leads-urgentes",
        tipo: "critica",
        titulo: `${leadsUrgentes.length} lead${leadsUrgentes.length > 1 ? "s" : ""} sin contactar`,
        detalle: "Llevan más de 48h sin primer contacto",
        accion: "Ver leads",
        href: "/leads?estado=NUEVO",
        icono: "users",
        tiempo: "Ahora",
      });
    }

    // ── ALERTA 2: Propuestas en borrador sin enviar >3 días ──
    const propBorrador = propuestas.filter((p) => {
      if (p.estado !== "Borrador") return false;
      const diffDias = (ahora.getTime() - p.createdAt.getTime()) / 86400000;
      return diffDias > 3;
    });
    if (propBorrador.length > 0) {
      notificaciones.push({
        id: "propuestas-borrador",
        tipo: "alta",
        titulo: `${propBorrador.length} propuesta${propBorrador.length > 1 ? "s" : ""} en borrador`,
        detalle: "Sin enviar hace más de 3 días",
        accion: "Ver propuestas",
        href: "/propuestas",
        icono: "file-text",
        tiempo: "Pendiente",
      });
    }

    // ── ALERTA 3: Leads en PROPUESTA sin cambio >7 días ─────
    const leadsEstancados = leads.filter((l) => {
      if (l.estadoLead !== "PROPUESTA") return false;
      const diffDias = (ahora.getTime() - l.updatedAt.getTime()) / 86400000;
      return diffDias > 7;
    });
    if (leadsEstancados.length > 0) {
      notificaciones.push({
        id: "leads-estancados",
        tipo: "media",
        titulo: `${leadsEstancados.length} lead${leadsEstancados.length > 1 ? "s" : ""} estancados en Propuesta`,
        detalle: "Sin actualización en más de 7 días",
        accion: "Ver pipeline",
        href: "/pipeline",
        icono: "git-branch",
        tiempo: "Esta semana",
      });
    }

    // ── ALERTA 4: Oportunidades Inmediatas sin propuesta ─────
    const oportunidadesInmediatas = leads.filter((l) => {
      const score = l.scoreLead ? parseInt(l.scoreLead.toString(), 10) : 0;
      return (
        score >= 75 &&
        !["PROPUESTA", "NEGOCIACION", "GANADO"].includes(l.estadoLead)
      );
    });
    if (oportunidadesInmediatas.length > 0) {
      notificaciones.push({
        id: "oportunidades-inmediatas",
        tipo: "alta",
        titulo: `${oportunidadesInmediatas.length} oportunidad${oportunidadesInmediatas.length > 1 ? "es" : ""} inmediata${oportunidadesInmediatas.length > 1 ? "s" : ""}`,
        detalle: "Score alto sin propuesta enviada",
        accion: "Ver leads",
        href: "/leads",
        icono: "trending-up",
        tiempo: "Alta prioridad",
      });
    }

    // ── ALERTA 5: Propuestas vistas sin respuesta >2 días ────
    const propuestasVistas = propuestas.filter((p) => {
      if (p.estado !== "Vista" || !p.fechaVisto) return false;
      const diffDias = (ahora.getTime() - p.fechaVisto.getTime()) / 86400000;
      return diffDias > 2;
    });
    if (propuestasVistas.length > 0) {
      notificaciones.push({
        id: "propuestas-vistas",
        tipo: "media",
        titulo: `${propuestasVistas.length} propuesta${propuestasVistas.length > 1 ? "s" : ""} vista${propuestasVistas.length > 1 ? "s" : ""} sin respuesta`,
        detalle: "El cliente la abrió pero no respondió",
        accion: "Hacer seguimiento",
        href: "/propuestas",
        icono: "eye",
        tiempo: "Seguimiento",
      });
    }

    // ── ALERTA: Tareas urgentes vencidas ──────────────────────
    const tareasUrgentes = tareas.filter((t) => {
      if (t.estado === "COMPLETADA" || t.estado === "CANCELADA") return false;
      if (!t.fechaVencimiento) return false;
      const diffDias = (ahora.getTime() - t.fechaVencimiento.getTime()) / 86400000;
      return diffDias > 0 && t.prioridad === "urgente";
    });
    if (tareasUrgentes.length > 0) {
      notificaciones.push({
        id: "tareas-urgentes",
        tipo: "critica",
        titulo: `${tareasUrgentes.length} tarea${tareasUrgentes.length > 1 ? "s" : ""} urgente${tareasUrgentes.length > 1 ? "s" : ""} vencida${tareasUrgentes.length > 1 ? "s" : ""}`,
        detalle: "Requieren atención inmediata",
        accion: "Ver tareas",
        href: "/tareas",
        icono: "check-square",
        tiempo: "Urgente",
      });
    }

    // ── ALERTA: Tareas que vencen hoy ─────────────────────────
    const tareasHoy = tareas.filter((t) => {
      if (t.estado === "COMPLETADA" || t.estado === "CANCELADA") return false;
      if (!t.fechaVencimiento) return false;
      return t.fechaVencimiento.toDateString() === ahora.toDateString();
    });
    if (tareasHoy.length > 0) {
      notificaciones.push({
        id: "tareas-hoy",
        tipo: "alta",
        titulo: `${tareasHoy.length} tarea${tareasHoy.length > 1 ? "s" : ""} vencen hoy`,
        detalle: "Pendientes para completar hoy",
        accion: "Ver tareas",
        href: "/tareas",
        icono: "check-square",
        tiempo: "Hoy",
      });
    }

    // ── ALERTA: Referidos nuevos sin contactar ─────────────────
    const referidosNuevos = leads.filter((l) => {
      if (l.comoNosConocio !== "referido") return false;
      if (l.estadoLead !== "NUEVO") return false;
      const diffHoras = (ahora.getTime() - l.createdAt.getTime()) / 3600000;
      return diffHoras <= 48;
    });
    if (referidosNuevos.length > 0) {
      notificaciones.push({
        id: "referidos-nuevos",
        tipo: "alta",
        titulo: `${referidosNuevos.length} referido${referidosNuevos.length > 1 ? "s" : ""} nuevo${referidosNuevos.length > 1 ? "s" : ""} sin contactar`,
        detalle:
          "Los referidos tienen 3x más probabilidad de cerrar. Contáctalos hoy.",
        accion: "Ver referidos",
        href: "/leads?fuente=referido",
        icono: "users",
        tiempo: "Alta prioridad",
      });
    }

    // ── INFO: Nuevos leads hoy ───────────────────────────────
    const leadsHoy = leads.filter((l) => {
      const diffHoras = (ahora.getTime() - l.createdAt.getTime()) / 3600000;
      return diffHoras <= 24;
    });
    if (leadsHoy.length > 0) {
      notificaciones.push({
        id: "leads-hoy",
        tipo: "info",
        titulo: `${leadsHoy.length} lead${leadsHoy.length > 1 ? "s" : ""} nuevo${leadsHoy.length > 1 ? "s" : ""} hoy`,
        detalle: "Registrados en las últimas 24 horas",
        accion: "Ver leads",
        href: "/leads",
        icono: "user-plus",
        tiempo: "Hoy",
      });
    }

    // Ordenar: crítica > alta > media > info
    const orden: Record<string, number> = {
      critica: 0,
      alta: 1,
      media: 2,
      info: 3,
    };
    notificaciones.sort((a, b) => orden[a.tipo] - orden[b.tipo]);

    return NextResponse.json(notificaciones);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error notificaciones:", err?.message);
    return NextResponse.json([]);
  }
}
