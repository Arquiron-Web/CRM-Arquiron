import {
  BENCHMARK_POR_PAIS,
  BRECHA_A_SERVICIO,
  DIMENSIONES,
  getNivelMadurez,
  normalizarPais,
} from "@/lib/benchmarks-madurez";
import { RECOMENDACIONES_POR_DIMENSION } from "@/lib/recomendaciones-madurez";
import { getPaisLabel } from "@/lib/pipeline-utils";

/**
 * HTML del Informe de Evaluación de Madurez de un lead, para que el
 * consultor llegue a la reunión con el detalle completo. Replica la
 * estructura del informe que la EME le entrega al lead (IGM, radar, pilares,
 * brechas, recomendaciones priorizadas) y agrega una guía para la reunión.
 *
 * Todas las puntuaciones llegan en escala 1-5 (la conversión desde la
 * escala 0-100 de la EME se hace al ingresar el lead, ver
 * lib/leads-create.ts). Se imprime a PDF con lib/pdf/generar-pdf.ts.
 */

const AZUL_MARINO = "#1B3A5C";
const TEAL_VIVO = "#4CCED5";
const AMBAR = "#D4881E";

const LOGO_URL = process.env.EMAIL_LOGO_URL || "";

export interface EvaluacionPDFData {
  empresa: string;
  contacto?: string;
  cargo?: string;
  email?: string;
  whatsapp?: string;
  sector?: string;
  tamano?: string;
  pais?: string;
  ciudad?: string;
  fechaRegistro?: string;
  igm: number;
  autoevaluacion?: number | null;
  /** dim1…dim10, escala 1-5. */
  dims: number[];
  servicioSugeridoForja?: string;
  scoreLead?: number | null;
  clasificacion?: string;
  accionRecomendada?: string;
}

function esc(v: unknown): string {
  return String(v ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c] || c));
}

function orDash(v: string | undefined | null): string {
  const s = (v || "").trim();
  return s ? esc(s) : "—";
}

function signed(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}`;
}

function formatFecha(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  });
}

function marca(): string {
  return LOGO_URL
    ? `<img src="${esc(LOGO_URL)}" alt="Arquiron" style="height:34px;display:block;" />`
    : `<span style="font-size:20px;font-weight:800;letter-spacing:0.5px;color:${AZUL_MARINO};">ARQUIRON</span>`;
}

// ── Radar (SVG inline) ──────────────────────────────────────────────

function radarSVG(scores: number[], bench: number[], etiquetas: string[]): string {
  const size = 440;
  const c = size / 2;
  const R = 140;
  const n = scores.length;
  const punto = (i: number, v: number, extra = 0): [number, number] => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const r = (R * Math.max(0, Math.min(5, v))) / 5 + extra;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  const poligono = (vals: number[]) => vals.map((v, i) => punto(i, v).map((x) => x.toFixed(1)).join(",")).join(" ");

  const anillos = [1, 2, 3, 4, 5]
    .map((v) => `<polygon points="${poligono(Array(n).fill(v))}" fill="none" stroke="#e5e7eb" stroke-width="1" />`)
    .join("");
  const ejes = scores
    .map((_, i) => {
      const [x, y] = punto(i, 5);
      return `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e5e7eb" stroke-width="1" />`;
    })
    .join("");
  const etiquetasSVG = scores
    .map((_, i) => {
      const [x, y] = punto(i, 5, 20);
      const anchor = x < c - 8 ? "end" : x > c + 8 ? "start" : "middle";
      return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" font-size="11" fill="#4b5563" text-anchor="${anchor}">${esc(etiquetas[i])}</text>`;
    })
    .join("");
  const escala = [1, 2, 3, 4, 5]
    .map((v) => `<text x="${c + 4}" y="${(c - (R * v) / 5 + 3).toFixed(1)}" font-size="8" fill="#9ca3af">${v}</text>`)
    .join("");

  return `
  <svg viewBox="0 0 ${size} ${size}" width="380" height="380" xmlns="http://www.w3.org/2000/svg">
    ${anillos}${ejes}${escala}
    <polygon points="${poligono(bench)}" fill="${AMBAR}" fill-opacity="0.08" stroke="${AMBAR}" stroke-width="1.5" stroke-dasharray="5 4" />
    <polygon points="${poligono(scores)}" fill="${AZUL_MARINO}" fill-opacity="0.28" stroke="${AZUL_MARINO}" stroke-width="2.5" />
    ${etiquetasSVG}
  </svg>`;
}

// ── Documento ───────────────────────────────────────────────────────

export function generarHTMLEvaluacionPDF(d: EvaluacionPDFData): string {
  const paisKey = normalizarPais(d.pais || "");
  const bench = BENCHMARK_POR_PAIS[paisKey] || BENCHMARK_POR_PAIS.latam;
  const dims = DIMENSIONES.map((dim, i) => {
    const score = d.dims[i] || 0;
    const benchmark = bench[i] ?? 2.6;
    return { ...dim, score, benchmark, brecha: parseFloat((score - benchmark).toFixed(2)) };
  });

  const nivel = getNivelMadurez(d.igm);
  const porBrecha = [...dims].sort((a, b) => a.brecha - b.brecha);
  const porScore = [...dims].sort((a, b) => a.score - b.score);
  const top3 = porBrecha.slice(0, 3);
  const fortalezas = [...dims]
    .filter((x) => x.brecha >= 0)
    .sort((a, b) => b.brecha - a.brecha)
    .slice(0, 3);

  const pilares = DIMENSIONES.reduce<string[]>((acc, x) => (acc.includes(x.pilar) ? acc : [...acc, x.pilar]), []).map(
    (nombre) => {
      const items = dims.filter((x) => x.pilar === nombre);
      const promedio = items.reduce((s, x) => s + x.score, 0) / items.length;
      return { nombre, color: items[0].pilarColor, items, promedio, nivel: getNivelMadurez(promedio) };
    }
  );

  const brechaPercepcion = d.autoevaluacion ? d.autoevaluacion - d.igm : null;
  const servicioPrincipal = BRECHA_A_SERVICIO[top3[0]?.nombre] || d.servicioSugeridoForja || "—";

  // ── Página 1: resumen ──
  const resumen = `
  <section class="page">
    <div class="encabezado">
      ${marca()}
      <div class="encabezado-texto">
        <p class="eyebrow">Informe de uso interno · Preparación de reunión</p>
        <h1>Evaluación de Madurez Empresarial</h1>
      </div>
    </div>

    <div class="ficha">
      <h2>${orDash(d.empresa)}</h2>
      <table class="ficha-tabla">
        <tr><td class="k">Contacto</td><td>${orDash(d.contacto)}${d.cargo ? ` — ${esc(d.cargo)}` : ""}</td>
            <td class="k">Sector</td><td>${orDash(d.sector)}</td></tr>
        <tr><td class="k">Correo</td><td>${orDash(d.email)}</td>
            <td class="k">Tamaño</td><td>${orDash(d.tamano)}</td></tr>
        <tr><td class="k">WhatsApp</td><td>${orDash(d.whatsapp)}</td>
            <td class="k">País / ciudad</td><td>${esc(getPaisLabel(d.pais || ""))}${d.ciudad ? ` · ${esc(d.ciudad)}` : ""}</td></tr>
        <tr><td class="k">Registrado</td><td>${formatFecha(d.fechaRegistro)}</td>
            <td class="k">Benchmark</td><td>${esc(getPaisLabel(paisKey))}</td></tr>
      </table>
    </div>

    <div class="igm-fila">
      <div class="igm-circulo" style="background:${nivel.color};">
        <span class="igm-valor">${d.igm.toFixed(1)}</span><span class="igm-max">/ 5.0</span>
      </div>
      <div class="igm-texto">
        <p class="igm-etiqueta">Índice Global de Madurez (IGM)</p>
        <p class="igm-nivel" style="color:${nivel.color};">Nivel ${esc(nivel.nombre)}</p>
        ${
          brechaPercepcion !== null
            ? `<p>Autoevaluación declarada: <strong>${d.autoevaluacion!.toFixed(1)}</strong>. La empresa
               <strong>${brechaPercepcion >= 0 ? "sobreestima" : "subestima"}</strong> su madurez
               (${signed(brechaPercepcion)} pts frente al IGM real).</p>`
            : ""
        }
        ${d.scoreLead != null ? `<p>Score comercial del lead: <strong>${d.scoreLead}/100</strong> · ${esc(d.clasificacion || "")}</p>` : ""}
      </div>
    </div>

    <div class="radar-caja">
      <h3>Perfil por dimensión vs. benchmark ${esc(getPaisLabel(paisKey))}</h3>
      <div class="radar">${radarSVG(dims.map((x) => x.score), dims.map((x) => x.benchmark), dims.map((x) => x.corto))}</div>
      <p class="leyenda"><span class="sw" style="background:${AZUL_MARINO};"></span> Empresa
        <span class="sw sw-b" style="border-color:${AMBAR};"></span> Benchmark de mercado · escala 1-5</p>
    </div>
  </section>`;

  // ── Página 2: pilares y dimensiones ──
  const filaBarra = (x: (typeof dims)[number]) => {
    const color = getNivelMadurez(x.score).color;
    return `
      <div class="barra-fila">
        <span class="barra-nombre">${esc(x.nombre)}</span>
        <div class="barra"><div class="barra-relleno" style="width:${(x.score / 5) * 100}%;background:${color};"></div>
          <div class="barra-bench" style="left:${(x.benchmark / 5) * 100}%;"></div></div>
        <span class="barra-score" style="color:${color};">${x.score.toFixed(1)}</span>
        <span class="barra-ref">ref. ${x.benchmark.toFixed(1)}</span>
      </div>`;
  };
  const pilaresHTML = pilares
    .map(
      (p) => `
    <div class="pilar" style="border-left-color:${p.color};">
      <div class="pilar-cab">
        <h3>${esc(p.nombre)}</h3>
        <span class="pilar-score" style="color:${p.nivel.color};">${p.promedio.toFixed(1)}
          <small>${esc(p.nivel.nombre)}</small></span>
      </div>
      ${p.items.map(filaBarra).join("")}
    </div>`
    )
    .join("");

  const paginaPilares = `
  <section class="page sin-corte">
    <h2 class="titulo-seccion">Resultados por pilar y dimensión</h2>
    <p class="nota">La marca vertical en cada barra indica el benchmark de mercado para ${esc(getPaisLabel(paisKey))}.</p>
    ${pilaresHTML}
  </section>`;

  // ── Página 3: brechas ──
  const filasTabla = dims
    .map((x) => {
      const color = x.brecha >= 0 ? "#16a34a" : "#dc2626";
      return `<tr>
        <td>${esc(x.pilar)}</td><td>${esc(x.nombre)}</td>
        <td class="num" style="color:${getNivelMadurez(x.score).color};font-weight:700;">${x.score.toFixed(1)}</td>
        <td class="num">${x.benchmark.toFixed(1)}</td>
        <td class="num" style="color:${color};font-weight:700;">${signed(x.brecha)}</td>
      </tr>`;
    })
    .join("");

  const paginaBrechas = `
  <section class="page">
    <h2 class="titulo-seccion">Detalle de dimensiones y brecha vs. benchmark</h2>
    <table class="tabla">
      <thead><tr><th>Pilar</th><th>Dimensión</th><th class="num">Score</th><th class="num">Benchmark</th><th class="num">Brecha</th></tr></thead>
      <tbody>${filasTabla}</tbody>
    </table>
    <div class="dos-col">
      <div class="caja">
        <h3>Mayores brechas</h3>
        <ol>${top3.map((x) => `<li><strong>${esc(x.nombre)}</strong> — ${x.score.toFixed(1)} vs ${x.benchmark.toFixed(1)} (${signed(x.brecha)})</li>`).join("")}</ol>
      </div>
      <div class="caja">
        <h3>Fortalezas</h3>
        ${
          fortalezas.length
            ? `<ol>${fortalezas.map((x) => `<li><strong>${esc(x.nombre)}</strong> — ${x.score.toFixed(1)} vs ${x.benchmark.toFixed(1)} (${signed(x.brecha)})</li>`).join("")}</ol>`
            : `<p>Ninguna dimensión supera el benchmark todavía.</p>`
        }
      </div>
    </div>
  </section>`;

  // ── Recomendaciones priorizadas (de menor a mayor score, como la EME) ──
  const recomendaciones = porScore
    .map((x) => {
      const importante = x.score < 3;
      const color = importante ? AMBAR : "#16a34a";
      const acciones = RECOMENDACIONES_POR_DIMENSION[x.nombre] || [];
      return `
      <div class="rec" style="border-left-color:${color};">
        <div class="rec-cab">
          <h3>${esc(x.nombre)}</h3>
          <span style="color:${color};font-size:10px;">${importante ? "Importante" : "Sugerido"} · Score ${x.score.toFixed(1)}</span>
        </div>
        <ul>${acciones.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
      </div>`;
    })
    .join("");

  const paginaRecomendaciones = `
  <section class="page ultima">
    <h2 class="titulo-seccion">Recomendaciones priorizadas</h2>
    <p class="nota">Son las acciones que el lead ya recibió en su informe de la EME, ordenadas de la dimensión más débil a la más fuerte.</p>
    ${recomendaciones}
    <p class="pie-nota">Generado desde el CRM de ARQUIRON a partir de las puntuaciones guardadas de la EME. Documento de uso interno.</p>
  </section>`;

  // ── Guía para la reunión ──
  const guia = `
  <section class="page">
    <h2 class="titulo-seccion">Guía para la reunión</h2>
    <div class="caja caja-destacada">
      <h3>Lectura general</h3>
      <p>${esc(d.empresa)} tiene un IGM de <strong>${d.igm.toFixed(1)}/5.0</strong> (nivel <strong>${esc(nivel.nombre)}</strong>).
      Su dimensión más débil frente al benchmark es <strong>${esc(top3[0]?.nombre || "—")}</strong>
      (${top3[0] ? signed(top3[0].brecha) : "—"} pts), y su punto más fuerte es
      <strong>${esc(porScore[porScore.length - 1]?.nombre || "—")}</strong> (${porScore[porScore.length - 1]?.score.toFixed(1) ?? "—"}).</p>
      ${
        brechaPercepcion !== null
          ? `<p>${
              brechaPercepcion >= 0
                ? "Se percibe más madura de lo que los resultados muestran: conviene abrir la conversación con los datos del diagnóstico antes de proponer."
                : "Se percibe menos madura de lo que los resultados muestran: hay margen para reforzar su confianza en lo que ya hace bien."
            }</p>`
          : ""
      }
    </div>

    <div class="caja">
      <h3>Dónde enfocar la propuesta</h3>
      <table class="tabla">
        <thead><tr><th>#</th><th>Dimensión</th><th class="num">Brecha</th><th>Servicio ARQUIRON sugerido</th></tr></thead>
        <tbody>
          ${top3
            .map(
              (x, i) => `<tr><td>${i + 1}</td><td>${esc(x.nombre)}</td>
              <td class="num" style="color:#dc2626;font-weight:700;">${signed(x.brecha)}</td>
              <td>${esc(BRECHA_A_SERVICIO[x.nombre] || "—")}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="dos-col">
      <div class="caja">
        <h3>Servicio de entrada recomendado</h3>
        <p><strong>${esc(servicioPrincipal)}</strong></p>
        ${d.servicioSugeridoForja ? `<p class="nota">Servicio asociado al reto que declaró el lead: ${esc(d.servicioSugeridoForja)}</p>` : ""}
      </div>
      <div class="caja">
        <h3>Próxima acción sugerida por el CRM</h3>
        <p>${orDash(d.accionRecomendada)}</p>
      </div>
    </div>

    </section>`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Arial, sans-serif; color: #1f2937; font-size: 11px; line-height: 1.45; margin: 0; }
  .page { page-break-after: always; }
  .page.ultima, .page.sin-corte { page-break-after: auto; }
  .sin-corte + .page .titulo-seccion { margin-top: 16px; }
  h1, h2, h3, p { margin: 0; }
  .encabezado { display: flex; align-items: center; gap: 18px; padding-bottom: 12px; border-bottom: 3px solid ${TEAL_VIVO}; }
  .eyebrow { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #6b7280; }
  h1 { font-size: 22px; color: ${AZUL_MARINO}; margin-top: 2px; }
  .ficha { margin-top: 16px; padding: 14px 16px; background: #f4f6fa; border-radius: 10px; }
  .ficha h2 { font-size: 17px; color: ${AZUL_MARINO}; margin-bottom: 8px; }
  .ficha-tabla { width: 100%; border-collapse: collapse; }
  .ficha-tabla td { padding: 3px 6px 3px 0; vertical-align: top; }
  .ficha-tabla .k { color: #6b7280; width: 12%; white-space: nowrap; }
  .igm-fila { display: flex; align-items: center; gap: 22px; margin-top: 18px; }
  .igm-circulo { width: 118px; height: 118px; border-radius: 50%; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
  .igm-valor { font-size: 38px; font-weight: 800; line-height: 1; }
  .igm-max { font-size: 11px; opacity: .9; margin-top: 2px; }
  .igm-etiqueta { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; }
  .igm-nivel { font-size: 18px; font-weight: 800; margin: 2px 0 6px; }
  .igm-texto p + p { margin-top: 4px; }
  .radar-caja { margin-top: 14px; text-align: center; }
  .radar-caja h3 { font-size: 13px; color: ${AZUL_MARINO}; text-align: left; }
  .radar { display: flex; justify-content: center; }
  .leyenda { font-size: 10px; color: #6b7280; }
  .sw { display: inline-block; width: 14px; height: 3px; vertical-align: middle; margin: 0 4px 0 10px; }
  .sw-b { height: 0; border-top: 2px dashed; background: none; }
  .titulo-seccion { background: ${AZUL_MARINO}; color: #fff; font-size: 14px; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; }
  .nota { font-size: 10px; color: #6b7280; margin-bottom: 10px; }
  .pilar { border-left: 5px solid; padding: 6px 0 6px 12px; margin-bottom: 12px; break-inside: avoid; }
  .pilar-cab { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
  .pilar-cab h3 { font-size: 13px; color: ${AZUL_MARINO}; }
  .pilar-score { font-size: 16px; font-weight: 800; }
  .pilar-score small { font-size: 9px; font-weight: 400; color: #6b7280; margin-left: 4px; }
  .barra-fila { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
  .barra-nombre { width: 32%; font-size: 10.5px; }
  .barra { position: relative; flex: 1; height: 9px; background: #eef1f6; border-radius: 5px; }
  .barra-relleno { height: 100%; border-radius: 5px; }
  .barra-bench { position: absolute; top: -3px; width: 2px; height: 15px; background: ${AZUL_MARINO}; }
  .barra-score { width: 26px; text-align: right; font-weight: 700; }
  .barra-ref { width: 48px; font-size: 9px; color: #9ca3af; }
  .tabla { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  .tabla th { background: ${AZUL_MARINO}; color: #fff; text-align: left; padding: 6px 8px; font-size: 10px; }
  .tabla td { padding: 6px 8px; border-bottom: 1px solid #eef1f6; }
  .tabla tbody tr:nth-child(even) td { background: #f8fafc; }
  .tabla th.num, .tabla td.num { text-align: right; }
  .dos-col { display: flex; gap: 12px; }
  .dos-col .caja { flex: 1; }
  .caja { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; break-inside: avoid; }
  .caja h3 { font-size: 12px; color: ${AZUL_MARINO}; margin-bottom: 6px; }
  .caja ol { margin: 0; padding-left: 18px; } .caja li { margin: 3px 0; }
  .caja p + p { margin-top: 5px; }
  .caja-destacada { background: #f4f6fa; border-color: #dbe2ee; }
  .rec { border-left: 5px solid; padding: 4px 0 4px 12px; margin-bottom: 12px; break-inside: avoid; }
  .rec-cab { display: flex; justify-content: space-between; align-items: baseline; }
  .rec-cab h3 { font-size: 12.5px; color: ${AZUL_MARINO}; }
  .rec ul { margin: 4px 0 0; padding-left: 16px; } .rec li { margin: 2px 0; }
  .pie-nota { margin-top: 14px; font-size: 9px; color: #9ca3af; text-align: center; }
</style></head>
<body>${resumen}${guia}${paginaPilares}${paginaBrechas}${paginaRecomendaciones}</body></html>`;
}
