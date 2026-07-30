import { createHmac, timingSafeEqual } from "crypto";

interface NPSPayload {
  id: string;
  email: string;
  ts: number;
}

const UN_ANIO_MS = 365 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET no configurado");
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 ? "=".repeat(4 - (padded.length % 4)) : "";
  return Buffer.from(padded + padding, "base64");
}

/** Genera un token firmado (HMAC-SHA256) para el enlace público de NPS. No puede falsificarse sin conocer NEXTAUTH_SECRET. */
export function crearTokenNPS(id: string, email: string): string {
  const payload: NPSPayload = { id, email, ts: Date.now() };
  const payloadEncoded = base64url(JSON.stringify(payload));
  const firma = createHmac("sha256", getSecret()).update(payloadEncoded).digest();
  return `${payloadEncoded}.${base64url(firma)}`;
}

/** Valida la firma del token de NPS y devuelve el payload si es auténtico y no ha expirado. */
export function verificarTokenNPS(
  token: string
): { id: string; email: string } | null {
  const partes = token.split(".");
  if (partes.length !== 2) return null;
  const [payloadEncoded, firmaEncoded] = partes;

  let firmaRecibida: Buffer;
  try {
    firmaRecibida = base64urlDecode(firmaEncoded);
  } catch {
    return null;
  }

  const firmaEsperada = createHmac("sha256", getSecret())
    .update(payloadEncoded)
    .digest();

  if (
    firmaRecibida.length !== firmaEsperada.length ||
    !timingSafeEqual(firmaRecibida, firmaEsperada)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64urlDecode(payloadEncoded).toString("utf-8")
    ) as NPSPayload;
    if (!payload.id || !payload.ts) return null;
    if (Date.now() - payload.ts > UN_ANIO_MS) return null;
    return { id: payload.id, email: payload.email };
  } catch {
    return null;
  }
}
