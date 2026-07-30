import { NextResponse } from "next/server";
import { leadPublicoSchema, formatZodError } from "@/lib/schemas";
import { crearLead } from "@/lib/leads-create";

/**
 * Ingesta pública de leads, para proyectos externos (Portal Web, futura
 * Evaluación de Madurez) que no comparten sesión con este CRM. Protegida
 * por API key en vez de sesión de NextAuth — ver docs/INTEGRACION_PORTAL_WEB.md.
 * Excluida del middleware de auth (ver middleware.ts, matcher "api/public").
 *
 * fuenteFormulario NUNCA se acepta del body: se deriva de qué API key se
 * usó, para que un proyecto no pueda hacerse pasar por el otro.
 */
const FUENTES: Record<string, string> = {};
if (process.env.PORTAL_API_KEY) FUENTES[process.env.PORTAL_API_KEY] = "Portal_Empresarial";
if (process.env.EVALUACION_API_KEY) FUENTES[process.env.EVALUACION_API_KEY] = "Evaluacion_Madurez";

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get("x-api-key") || "";
    const fuenteFormulario = FUENTES[apiKey];
    if (!apiKey || !fuenteFormulario) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const parsed = leadPublicoSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { origenFormulario, ...data } = parsed.data;

    // El widget de newsletter solo pide email: sin nombre, se usa un
    // valor por defecto legible en vez de dejarlo vacío en la UI del CRM.
    const nombreContacto =
      data.nombreContacto || (origenFormulario === "newsletter" ? "Suscriptor newsletter" : "Sin nombre");

    const created = await crearLead({
      ...data,
      nombreContacto,
      fuenteFormulario: origenFormulario === "newsletter" ? "Portal_Newsletter" : fuenteFormulario,
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error POST /api/public/leads:", err?.message || error);
    return NextResponse.json(
      { error: "Error al registrar el lead", detail: err?.message },
      { status: 500 }
    );
  }
}
