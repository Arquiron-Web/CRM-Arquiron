import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { leadManualSchema, formatZodError } from "@/lib/schemas";
import { crearLead } from "@/lib/leads-create";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Sesión expirada. Vuelve a iniciar sesión." },
        { status: 401 }
      );
    }

    const parsed = leadManualSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const data = parsed.data;

    const created = await crearLead({
      ...data,
      fuenteFormulario: data.fuenteFormulario || "CRM_Manual",
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error("=== ERROR en /api/leads/manual ===", err?.message);

    return NextResponse.json(
      { error: "Error al guardar el lead", detail: err?.message },
      { status: 500 }
    );
  }
}
