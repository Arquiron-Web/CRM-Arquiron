import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session?.user as { accessToken?: string })?.accessToken;

    if (!session || !accessToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const propuesta = await request.json();

    if (!propuesta.emailCliente) {
      return NextResponse.json(
        { error: "No hay email de cliente" },
        { status: 400 }
      );
    }

    const endpoint = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint no configurado" },
        { status: 500 }
      );
    }

    const payload = {
      tipo: "propuesta",
      fuenteFormulario: "CRM_Propuesta",
      emailCorporativo: propuesta.emailCliente,
      nombreContacto: propuesta.contacto || "",
      nombreEmpresa: propuesta.empresaCliente || "",
      tituloPropuesta: propuesta.titulo || "",
      servicioForja: propuesta.servicioForja || "",
      consultor: propuesta.consultor || "",
      version: propuesta.version || "v1.0",
      valorUSD: propuesta.valorUSD || "",
      introduccion: propuesta.introduccion || "",
      diagnostico: propuesta.diagnostico || "",
      alcance: propuesta.alcance || "",
      metodologia: propuesta.metodologia || "",
      entregables: propuesta.entregables || "",
      timeline: propuesta.timeline || "",
      inversion: propuesta.inversion || "",
      terminos: propuesta.terminos || "",
    };

    const response = await fetch(endpoint, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
      },
      body: JSON.stringify(payload),
    });

    console.log("Apps Script response status:", response.status);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error detallado /api/propuestas/enviar:", err?.message);
    return NextResponse.json(
      { error: "Error al enviar", detail: err?.message },
      { status: 500 }
    );
  }
}
