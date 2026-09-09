import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // puppeteer-core y @sparticuz/chromium-min hacen requires dinámicos de
  // archivos nativos: se excluyen del bundling de webpack y se resuelven
  // tal cual desde node_modules en runtime (patrón estándar para Puppeteer
  // en funciones serverless de Vercel).
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],

  // "puppeteer" (con Chromium completo) es una devDependency que solo se
  // usa en desarrollo local (ver lib/pdf/generar-pdf.ts). Sin esto, el
  // tracing de archivos de Vercel podría arrastrar su binario de Chromium
  // (~300MB) a las funciones de Propuestas aunque la rama nunca se ejecute
  // en producción.
  outputFileTracingExcludes: {
    "/api/propuestas/pdf": ["node_modules/puppeteer/**"],
    "/api/propuestas/enviar": ["node_modules/puppeteer/**"],
  },
};

export default nextConfig;
