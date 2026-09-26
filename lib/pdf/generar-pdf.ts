import type { Browser } from "puppeteer-core";

/**
 * Convierte HTML a PDF con Chromium headless (propuestas e informes de evaluación).
 *
 * En producción (Vercel) usa `puppeteer-core` + `@sparticuz/chromium-min`
 * (el binario se descarga una vez por instancia fría desde el pack remoto
 * oficial, así el bundle de la función se mantiene bajo el límite de
 * 50MB). En desarrollo local usa el paquete `puppeteer` completo, que ya
 * trae su propio Chromium.
 *
 * IMPORTANTE: la versión del pack remoto debe coincidir con la versión
 * instalada de `@sparticuz/chromium-min` (ver package.json). Si se
 * actualiza el paquete, hay que actualizar también `CHROMIUM_PACK_URL`.
 */

// Desde la v143 los packs se publican por arquitectura (pack.x64.tar /
// pack.arm64.tar); sin el sufijo la URL devuelve 404 y el PDF falla con 500.
const CHROMIUM_PACK_URL = `https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.${
  process.arch === "arm64" ? "arm64" : "x64"
}.tar`;

const esProduccion = process.env.NODE_ENV === "production" || !!process.env.VERCEL;

async function lanzarNavegador(): Promise<Browser> {
  if (esProduccion) {
    const { default: chromium } = await import("@sparticuz/chromium-min");
    const puppeteer = await import("puppeteer-core");
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1240, height: 1754 },
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: true,
    }) as unknown as Promise<Browser>;
  }

  const puppeteer = await import("puppeteer");
  return puppeteer.launch({ headless: true }) as unknown as Promise<Browser>;
}

const FOOTER_TEMPLATE = `
  <div style="width:100%;font-family:-apple-system,Arial,sans-serif;font-size:7.5px;color:#9ca3af;text-align:center;padding:0 40px;">
    ARQUIRON Consultoría Estratégica S.A.S. · contacto@arquiron.com · arquiron.com ·
    Página <span class="pageNumber"></span> de <span class="totalPages"></span>
  </div>`;

const HEADER_TEMPLATE = `
  <div style="width:100%;font-family:-apple-system,Arial,sans-serif;font-size:8px;color:#1B3A5C;text-align:right;padding:0 40px;font-weight:700;">
    ARQUIRON
  </div>`;

export async function generarPDF(html: string): Promise<Buffer> {
  const browser = await lanzarNavegador();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: HEADER_TEMPLATE,
      footerTemplate: FOOTER_TEMPLATE,
      margin: { top: "60px", bottom: "50px", left: "45px", right: "45px" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
