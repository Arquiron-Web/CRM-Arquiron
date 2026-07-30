import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calendarioUpdateSchema, formatZodError } from "@/lib/schemas";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session?.user as { accessToken?: string })?.accessToken;

    if (!session || !accessToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const parsed = calendarioUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const data = parsed.data;

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({
      access_token: accessToken,
      token_type: "Bearer",
    });
    const calendar = google.calendar({ version: "v3", auth });

    const descripcion = [
      data.cliente ? `Cliente: ${data.cliente}` : "",
      data.idLead ? `Lead ID: ${data.idLead}` : "",
      data.tipo ? `Tipo: ${data.tipo}` : "",
      data.descripcion ? `\n${data.descripcion}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await calendar.events.update({
      calendarId: "primary",
      eventId: id,
      requestBody: {
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
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: "Error al actualizar evento", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session?.user as { accessToken?: string })?.accessToken;

    if (!session || !accessToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({
      access_token: accessToken,
      token_type: "Bearer",
    });
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId: "primary",
      eventId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: "Error al eliminar evento", detail: err?.message },
      { status: 500 }
    );
  }
}
