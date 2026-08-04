import { NextResponse } from "next/server";
import { leadPublicoUpdateSchema, formatZodError } from "@/lib/schemas";
import { actualizarLeadPublico } from "@/lib/leads-create";

/**
 * Actualización progresiva de un lead creado vía /api/public/leads (ver
 * docs/INTEGRACION_EVALUACION_MADUREZ.md). Protegida por la misma API key
 * que la creación; `actualizarLeadPublico` además exige que el lead que se
 * quiere tocar pertenezca a esa misma fuente, para que la key de un
 * proyecto no pueda modificar leads de otro.
 */
const FUENTES: Record<string, string> = {};
if (process.env.PORTAL_API_KEY) FUENTES[process.env.PORTAL_API_KEY] = "Portal_Empresarial";
if (process.env.EVALUACION_API_KEY) FUENTES[process.env.EVALUACION_API_KEY] = "Evaluacion_Madurez";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const apiKey = request.headers.get("x-api-key") || "";
    const fuenteFormulario = FUENTES[apiKey];
    if (!apiKey || !fuenteFormulario) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const parsed = leadPublicoUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { origenFormulario: _origenFormulario, ...data } = parsed.data;

    const resultado = await actualizarLeadPublico(id, fuenteFormulario, data);
    if (!resultado.ok) {
      const status = resultado.motivo === "not_found" ? 404 : 403;
      const error = resultado.motivo === "not_found" ? "Lead no encontrado" : "No autorizado para modificar este lead";
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ success: true, id: resultado.lead.id });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error PATCH /api/public/leads/[id]:", err?.message || error);
    return NextResponse.json(
      { error: "Error al actualizar el lead", detail: err?.message },
      { status: 500 }
    );
  }
}
