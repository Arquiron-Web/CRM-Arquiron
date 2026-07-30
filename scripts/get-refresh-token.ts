/**
 * Script para obtener el GOOGLE_OWNER_REFRESH_TOKEN.
 * Uso: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/get-refresh-token.ts
 *
 * Requiere: dotenv o cargar .env.local manualmente antes de ejecutar.
 * Alternativa más simple: agregar temporalmente en lib/auth.ts (callbacks.jwt):
 *   if (account) console.log("REFRESH TOKEN:", account.refresh_token);
 * Luego iniciar sesión, copiar el valor, y quitarlo.
 */

import { google } from "googleapis";
import * as path from "path";
import * as fs from "fs";

// Cargar .env.local si existe
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].replace(/^["']|["']$/g, "").trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Falta GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en .env.local");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  "http://localhost:3000/api/auth/callback/google"
);

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/spreadsheets"],
});

console.log("1. Abre esta URL en el navegador:");
console.log(url);
console.log("");
console.log("2. Después del login, copia el parámetro 'code' de la URL de redirección");
console.log("3. Ejecuta:");
console.log(
  "   npx ts-node -e \"require('./scripts/get-refresh-token').exchange('PEGA_EL_CODE_AQUI')\""
);
console.log("");
console.log("O bien, en lib/auth.ts agrega temporalmente en jwt callback:");
console.log("  if (account) console.log('REFRESH TOKEN:', account.refresh_token);");
console.log("Reinicia el servidor, inicia sesión, copia el valor y pégalo en .env.local");

export async function exchange(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  console.log("GOOGLE_OWNER_REFRESH_TOKEN=" + tokens.refresh_token);
}
