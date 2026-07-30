export type Role = "admin" | "consultor";

/**
 * Roles vía lista de emails admin en variable de entorno (ADMIN_EMAILS,
 * separados por coma). Es la opción más simple mientras el equipo es
 * pequeño y no hay una tabla de usuarios propia: sin costo de infraestructura
 * ni llamadas adicionales a Sheets en el flujo de auth.
 */
export function getRole(email: string | null | undefined): Role {
  if (!email) return "consultor";
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase()) ? "admin" : "consultor";
}
