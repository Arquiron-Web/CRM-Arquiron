import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    if (q.length < 2) {
      return NextResponse.json({ resultados: [], total: 0 });
    }

    const [leads, propuestas, interacciones, proyectos] = await Promise.all([
      prisma.lead.findMany(),
      prisma.propuesta.findMany(),
      prisma.interaccion.findMany(),
      prisma.proyecto.findMany(),
    ]);

    const resultados: Array<{
      tipo: string;
      id: string;
      titulo: string;
      subtitulo: string;
      detalle: string;
      extra: string;
      href: string;
      icono: string;
      score: number;
    }> = [];

    leads.forEach((l) => {
      const texto = [l.nombreEmpresa, l.sector, l.pais, l.ciudad, l.nombreContacto, l.cargo, l.emailCorporativo]
        .join(" ")
        .toLowerCase();
      if (!texto.includes(q)) return;
      resultados.push({
        tipo: "lead",
        id: l.id,
        titulo: l.nombreEmpresa || "",
        subtitulo: l.nombreContacto || "",
        detalle: l.emailCorporativo || "",
        extra: l.estadoLead || "",
        href: "/leads",
        icono: "users",
        score: l.scoreLead ? parseInt(l.scoreLead.toString(), 10) : 0,
      });
    });

    propuestas.forEach((p) => {
      const texto = [p.titulo, p.empresaCliente, p.contacto, p.servicioForja]
        .join(" ")
        .toLowerCase();
      if (!texto.includes(q)) return;
      resultados.push({
        tipo: "propuesta",
        id: p.id,
        titulo: p.titulo || "",
        subtitulo: p.empresaCliente || "",
        detalle: p.servicioForja || "",
        extra: p.estado || "",
        href: "/propuestas",
        icono: "file-text",
        score: 0,
      });
    });

    interacciones.forEach((i) => {
      const texto = [i.empresa, i.contacto, i.titulo, i.descripcion]
        .join(" ")
        .toLowerCase();
      if (!texto.includes(q)) return;
      resultados.push({
        tipo: "interaccion",
        id: i.id,
        titulo: i.titulo || "",
        subtitulo: i.empresa || "",
        detalle: i.tipo || "",
        extra: i.resultado || "",
        href: "/interacciones",
        icono: "message-square",
        score: 0,
      });
    });

    proyectos.forEach((p) => {
      const texto = [p.nombre, p.empresaCliente, p.contacto, p.servicioForja]
        .join(" ")
        .toLowerCase();
      if (!texto.includes(q)) return;
      resultados.push({
        tipo: "proyecto",
        id: p.id,
        titulo: p.nombre || "",
        subtitulo: p.empresaCliente || "",
        detalle: p.servicioForja || "",
        extra: p.estadoProyecto || "",
        href: "/proyectos",
        icono: "briefcase",
        score: 0,
      });
    });

    const top15 = resultados.slice(0, 15);

    return NextResponse.json({
      resultados: top15,
      total: resultados.length,
      query: q,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error búsqueda global:", err?.message);
    return NextResponse.json({ resultados: [], total: 0 });
  }
}
