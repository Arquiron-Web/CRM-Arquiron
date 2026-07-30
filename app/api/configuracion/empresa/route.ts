import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

const DEFAULT_CONFIG = {
  nombreEmpresa: "Arquiron",
  slogan: "Arquitectura Empresarial para PYMEs",
  email: "contacto@arquiron.com",
  telefono: "",
  website: "https://www.arquiron.com",
  pais: "Colombia",
  ciudad: "Bogotá",
  descripcion: "",
  moneda: "USD",
  zonaHoraria: "America/Bogota",
  logoUrl: "",
  colorPrimario: "#1B3A5C",
  colorSecundario: "#D4881E",
  updatedAt: "",
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const fs = await import("fs/promises");
    const filePath = path.join(process.cwd(), "data", "empresa-config.json");
    try {
      await fs.access(filePath);
    } catch {
      await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
      await fs.writeFile(
        filePath,
        JSON.stringify({ ...DEFAULT_CONFIG, updatedAt: new Date().toISOString() }, null, 2)
      );
    }
    const content = await fs.readFile(filePath, "utf-8");
    return NextResponse.json(JSON.parse(content));
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error GET /api/configuracion/empresa:", err?.message);
    return NextResponse.json(DEFAULT_CONFIG);
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const adminError = requireAdmin(session);
  if (adminError) return adminError;
  try {
    const data = await request.json();
    const fs = await import("fs/promises");
    const filePath = path.join(process.cwd(), "data", "empresa-config.json");
    let existing: Record<string, unknown> = { ...DEFAULT_CONFIG };
    try {
      const content = await fs.readFile(filePath, "utf-8");
      existing = { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    } catch {
      // file doesn't exist
    }
    const config = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(config, null, 2));
    return NextResponse.json(config);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error PUT /api/configuracion/empresa:", err?.message);
    return NextResponse.json(
      { error: "Error al guardar", detail: err?.message },
      { status: 500 }
    );
  }
}
