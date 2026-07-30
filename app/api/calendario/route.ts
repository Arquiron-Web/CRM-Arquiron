import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calendarioCreateSchema, formatZodError } from "@/lib/schemas";
import { google } from "googleapis";
import { NextResponse } from "next/server";

async function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({
    access_token: accessToken,
    token_type: "Bearer",
  });
  return google.calendar({ version: "v3", auth });
}

function detectarTipo(titulo: string): string {
  const t = titulo.toLowerCase();
  if (t.includes("llamada") || t.includes("call")) return "Llamada";
  if (t.includes("reunion") || t.includes("reunión")) return "Reunión";
  if (t.includes("demo") || t.includes("presentacion")) return "Demo";
  if (t.includes("follow") || t.includes("seguimiento")) return "Seguimiento";
  if (t.includes("propuesta")) return "Propuesta";
  return "Evento";
}

function extraerCliente(descripcion: string): string {
  const match = descripcion.match(/Cliente:\s*(.+)/i);
  return match ? match[1].trim() : "";
}

function getTipoColor(tipo: string): string {
  const colores: Record<string, string> = {
    Llamada: "7",
    Reunión: "1",
    Demo: "6",
    Seguimiento: "2",
    Propuesta: "5",
    Evento: "8",
  };
  return colores[tipo] || "1";
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session?.user as { accessToken?: string })?.accessToken;

    if (!session || !accessToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = parseInt(
      searchParams.get("mes") || String(new Date().getMonth() + 1)
    );
    const anio = parseInt(
      searchParams.get("anio") || String(new Date().getFullYear())
    );

    const inicio = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 0, 23, 59, 59);

    const calendar = await getCalendarClient(accessToken);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: inicio.toISOString(),
      timeMax: fin.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    const eventos = (response.data.items || []).map((event) => ({
      id: event.id || "",
      titulo: event.summary || "Sin título",
      descripcion: event.description || "",
      ubicacion: event.location || "",
      inicio: event.start?.dateTime || event.start?.date || "",
      fin: event.end?.dateTime || event.end?.date || "",
      todoElDia: !event.start?.dateTime,
      tipo: detectarTipo(event.summary || ""),
      cliente: extraerCliente(event.description || ""),
      link: event.hangoutLink || event.location || "",
      color: event.colorId || "1",
      estado: event.status || "confirmed",
      htmlLink: event.htmlLink || "",
    }));

    return NextResponse.json(eventos);
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    console.error("Error GET /api/calendario:", err?.message);
    if (err?.code === 401 || err?.message?.includes("invalid_grant")) {
      return NextResponse.json(
        { error: "Token expirado. Cierra sesión y vuelve a entrar." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Error al cargar eventos", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session?.user as { accessToken?: string })?.accessToken;

    if (!session || !accessToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const parsed = calendarioCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const data = parsed.data;
    const calendar = await getCalendarClient(accessToken);

    const descripcion = [
      data.cliente ? `Cliente: ${data.cliente}` : "",
      data.idLead ? `Lead ID: ${data.idLead}` : "",
      data.tipo ? `Tipo: ${data.tipo}` : "",
      data.descripcion ? `\n${data.descripcion}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const evento: Record<string, unknown> = {
      summary: data.titulo,
      description: descripcion,
      location: data.ubicacion || "",
      start: data.todoElDia
        ? { date: data.fecha }
        : {
            dateTime: `${data.fecha}T${data.horaInicio}:00`,
            timeZone: "America/Bogota",
          },
      end: data.todoElDia
        ? { date: data.fecha }
        : {
            dateTime: `${data.fecha}T${data.horaFin}:00`,
            timeZone: "America/Bogota",
          },
      colorId: getTipoColor(data.tipo || ""),
    };

    if (["Reunión", "Demo"].includes(data.tipo || "")) {
      (evento as Record<string, unknown>).conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: evento,
    });

    return NextResponse.json({
      success: true,
      id: response.data.id,
      htmlLink: response.data.htmlLink,
      meetLink: response.data.hangoutLink || "",
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error POST /api/calendario:", err?.message);
    return NextResponse.json(
      { error: "Error al crear evento", detail: err?.message },
      { status: 500 }
    );
  }
}
