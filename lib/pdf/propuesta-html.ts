import { calcularInversion, formatCOP, formatUSD } from "@/lib/propuesta-finanzas";

/**
 * Construye el HTML completo de la Propuesta Comercial, calcado a la
 * plantilla oficial ARQUIRON (portada + 13 secciones). Todo lo que la
 * plantilla repite igual en cualquier propuesta (metodología FORJA®,
 * equipo, gobierno, factores de éxito/riesgos, condiciones legales) va
 * fijo aquí; solo se interpolan los campos que sí varían por cliente.
 *
 * Este mismo HTML se usa tanto para la vista previa (impresa a PDF vía
 * lib/pdf/generar-pdf.ts y servida por /api/propuestas/pdf) como para el
 * adjunto que se manda por correo.
 */

// ── Paleta de marca (misma que lib/email.ts y el degradado de portada
// que ya existía en el email de propuesta) ──────────────────────────
const AZUL_MARINO = "#1B3A5C";
const AZUL_MARINO_OSCURO = "#122942";
const TEAL_VIVO = "#4CCED5";
const AMBAR_QUIRON = "#D4881E";
const INDIGO_PORTADA = "#1D1A70";
const MORADO_PORTADA = "#8560C0";
const CREMA = "#F7F0E6";

const ARQUIRON_NIT = process.env.ARQUIRON_NIT || "Pendiente de registro";
const LOGO_URL = process.env.EMAIL_LOGO_URL || "";

export interface PropuestaPDFData {
  titulo?: string;
  subtitulo?: string;
  empresaCliente?: string;
  contacto?: string;
  cargoContacto?: string;
  sectorCliente?: string;
  ciudadPais?: string;
  nitCliente?: string;
  consultor?: string;
  codigoPropuesta?: string;
  fechaCreacion?: string;
  fechaValidez?: string;

  fraseClave?: string;
  retoDescripcion?: string;
  duracionMeses?: string | number;

  contextoNegocio?: string;
  retosIdentificados?: string;

  exclusionesAdicionales?: string;

  hito1Meses?: string;
  hito2Meses?: string;
  hito3Meses?: string;
  hito4Meses?: string;

  horasSemanales?: string | number;

  anticipoCOP?: string | number;
  honorarioFase1COP?: string | number;
  honorarioFase2COP?: string | number;
  bonoPorHitoCOP?: string | number;
  trmValor?: string | number;
  trmFecha?: string;

  notasAdicionales?: string;

  version?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function esc(v: unknown): string {
  return String(v ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c));
}

function orDash(v: string | undefined | null): string {
  const s = (v || "").trim();
  return s ? esc(s) : "—";
}

/** Convierte texto multilínea (una idea por línea, con o sin "•"/"-" al inicio) en <li>. */
function bullets(texto: string | undefined, fallback: string): string {
  const lineas = (texto || "")
    .split("\n")
    .map((l) => l.replace(/^[•\-*]\s*/, "").trim())
    .filter(Boolean);
  const items = lineas.length ? lineas : [fallback];
  return `<ul class="lista">${items.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`;
}

function formatFechaLarga(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return esc(iso);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

/** Extrae los números de mes de una etiqueta tipo "Meses 2 y 3" → [2,3]. */
function mesesDeEtiqueta(label: string | undefined): number[] {
  const nums = (label || "").match(/\d+/g);
  return nums ? nums.map(Number) : [];
}

function marca(): string {
  return LOGO_URL
    ? `<img src="${LOGO_URL}" alt="Arquiron" height="34" style="display:block;height:34px;" />`
    : `<span style="font-size:18px;font-weight:800;letter-spacing:0.5px;color:${AZUL_MARINO};">ARQUIRON</span>`;
}

// ── Secciones ────────────────────────────────────────────────────────

function portada(d: PropuestaPDFData): string {
  return `
  <section class="page portada">
    <div class="portada-header">
      <p class="portada-eyebrow">Propuesta Comercial</p>
      <h1 class="portada-titulo">${esc(d.titulo || "Propuesta Comercial")}</h1>
      ${d.subtitulo ? `<p class="portada-subtitulo">${esc(d.subtitulo)}</p>` : ""}
      <table class="portada-tabla">
        <tr><td class="k">Presentada a</td><td>${orDash(d.empresaCliente)}</td></tr>
        <tr><td class="k">Interlocutor</td><td>${orDash(d.contacto)}${d.cargoContacto ? ` — ${esc(d.cargoContacto)}` : ""}</td></tr>
        <tr><td class="k">Sector</td><td>${orDash(d.sectorCliente)}</td></tr>
        <tr><td class="k">Ciudad</td><td>${orDash(d.ciudadPais)}</td></tr>
        <tr><td class="k">Código de propuesta</td><td>${orDash(d.codigoPropuesta)}</td></tr>
        <tr><td class="k">Fecha de emisión</td><td>${formatFechaLarga(d.fechaCreacion)}</td></tr>
        <tr><td class="k">Válida hasta</td><td class="destacado">${formatFechaLarga(d.fechaValidez)}</td></tr>
      </table>
    </div>
    <div class="portada-footer">
      <p class="presentada-por">Presentada por</p>
      <p class="firma-empresa">ARQUIRON Consultoría Estratégica S.A.S.</p>
      <p class="firma-datos">Bogotá, Colombia · contacto@arquiron.com · +57 312 241 5413</p>
    </div>
    <div class="confidencial-bar">
      DOCUMENTO CONFIDENCIAL · Uso exclusivo de ${orDash(d.empresaCliente)} · Prohibida su reproducción total o parcial
    </div>
  </section>`;
}

function cartaPresentacion(d: PropuestaPDFData): string {
  return `
  <section class="page">
    ${tituloSeccion("01", "Carta de presentación")}
    <p class="fecha-carta">Bogotá, ${formatFechaLarga(d.fechaCreacion)}</p>
    <p class="destinatario">
      Señor(a)<br/>
      <strong>${orDash(d.contacto)}</strong><br/>
      ${orDash(d.cargoContacto)}<br/>
      ${orDash(d.empresaCliente)}<br/>
      ${orDash(d.ciudadPais)}
    </p>
    <p><strong>Respetado(a) ${orDash(d.contacto)}:</strong></p>
    <p>En nombre del equipo de ARQUIRON Consultoría Estratégica S.A.S., agradezco la confianza
    depositada en nuestra firma al considerarnos como su aliado estratégico para el proyecto
    <strong>${esc(d.titulo || "propuesto")}</strong>.</p>
    <p>ARQUIRON nace con el propósito de democratizar el acceso a arquitecturas empresariales
    robustas para las PYMES de Latinoamérica. Combinamos rigor metodológico de consultoría global
    con cercanía de firma boutique, y estructuramos cada acompañamiento sobre nuestra metodología
    propia FORJA® —Fijar, Orientar, Rediseñar, Justificar, Acompañar— diseñada para generar
    resultados medibles y sostenibles en el tiempo.</p>
    <p>La presente propuesta ha sido construida a partir del entendimiento inicial de sus
    objetivos estratégicos. En ella encontrará un alcance claro, un modelo económico que alinea
    nuestros intereses con los suyos, un equipo senior asignado y un plan de trabajo detallado que
    le permitirá tomar una decisión informada.</p>
    <p>Estamos convencidos de que podemos aportar valor tangible a ${orDash(d.empresaCliente)}.
    Quedamos atentos a resolver cualquier inquietud y a recibir sus comentarios.</p>
    <p>Cordialmente,</p>
    ${firmaEduard()}
  </section>`;
}

function firmaEduard(): string {
  return `
    <div class="firma-bloque">
      <p class="firma-nombre">Eduard Fabián Álvarez Pacheco</p>
      <p class="firma-cargo">Co-fundador · Arquitecto Empresarial Líder</p>
      <p class="firma-empresa-chica">ARQUIRON Consultoría Estratégica S.A.S.</p>
      <p class="firma-contacto">contacto@arquiron.com · +57 312 241 5413</p>
    </div>`;
}

function resumenEjecutivo(d: PropuestaPDFData): string {
  const inv = calcularInversion(d);
  const meses = Math.max(1, Math.round(Number(d.duracionMeses) || 6));
  return `
  <section class="page">
    ${tituloSeccion("02", "Resumen ejecutivo")}
    ${d.fraseClave ? `<div class="quote-banner">"${esc(d.fraseClave)}"</div>` : ""}
    <h3 class="subtitulo-naranja">El reto</h3>
    <p>${d.retoDescripcion ? esc(d.retoDescripcion).replace(/\n/g, "<br/>") : "Por definir con el cliente durante el diagnóstico inicial."}</p>
    <h3 class="subtitulo-naranja">Nuestra respuesta</h3>
    <p>ARQUIRON propone un acompañamiento estructurado bajo la metodología FORJA®, que combina
    diagnóstico ejecutivo, diseño empresarial, rediseño de procesos críticos, justificación
    financiera y acompañamiento en la ejecución. El resultado: una organización preparada para
    crecer con foco, orden y visión estratégica.</p>
    <h3 class="subtitulo-naranja">Estructura del proyecto</h3>
    <table class="tabla-doble">
      <tr><td class="k">Duración</td><td>${meses} meses</td><td class="k">Modalidad</td><td>Híbrida (remoto + sesiones presenciales clave)</td></tr>
      <tr><td class="k">Metodología</td><td>FORJA® — 5 fases</td><td class="k">Equipo</td><td>3 consultores senior + red de expertos</td></tr>
      <tr><td class="k">Inversión fija</td><td>${formatCOP(inv.subtotalFijoCOP)} + IVA</td><td class="k">Componente variable</td><td>Éxito escalonado (ver Sección 11)</td></tr>
    </table>
    <h3 class="subtitulo-naranja">Resultado esperado</h3>
    <p>Al finalizar el proyecto, ${orDash(d.empresaCliente)} contará con: (i) un modelo operativo
    estructurado y documentado, (ii) una hoja de ruta de fortalecimiento priorizada, (iii) las
    capacidades habilitadas para ejecutarla, y (iv) los indicadores clave para medir el avance y
    sostener el crecimiento.</p>
  </section>`;
}

function entendimientoReto(d: PropuestaPDFData): string {
  return `
  <section class="page">
    ${tituloSeccion("03", "Entendimiento del reto")}
    <p>A partir de las conversaciones sostenidas con ${orDash(d.empresaCliente)}, hemos
    identificado los siguientes elementos que enmarcan el reto estratégico:</p>
    <h3 class="subtitulo-naranja">Contexto de negocio</h3>
    ${bullets(d.contextoNegocio, "Por documentar durante el diagnóstico inicial.")}
    <h3 class="subtitulo-naranja">Retos identificados</h3>
    ${bullets(d.retosIdentificados, "Por documentar durante el diagnóstico inicial.")}
    <h3 class="subtitulo-naranja">Impacto estratégico si no se atiende</h3>
    <p>Sin una intervención estructurada, ${orDash(d.empresaCliente)} enfrenta el riesgo de: (a)
    crecer en desorden con costos operativos crecientes; (b) diluir su propuesta de valor; (c)
    perder oportunidades de mercado por falta de capacidad de respuesta; y (d) generar dependencia
    crítica de personas clave. La ventana de oportunidad para actuar es hoy.</p>
    <div class="callout">Cada intervención de ARQUIRON parte de este entendimiento y se ajusta
    durante la fase de diagnóstico para reflejar la realidad específica del cliente.</div>
  </section>`;
}

function propuestaDeValor(): string {
  return `
  <section class="page">
    ${tituloSeccion("04", "Nuestra propuesta de valor")}
    <p>ARQUIRON no entrega diagnósticos que se guardan en un cajón. Entregamos capacidades
    instaladas, procesos que funcionan y resultados que se pueden medir.</p>
    <h3 class="subtitulo-naranja">Los 3 pilares de nuestra oferta</h3>
    <div class="pilares">
      <div class="pilar"><p class="pilar-titulo">ADN<br/>ESTRATÉGICO</p><p>Misión, visión, promesa de
      valor y arquitectura estratégica que dan claridad y foco al negocio.</p></div>
      <div class="pilar"><p class="pilar-titulo">MOTOR<br/>OPERATIVO</p><p>Procesos, capacidades,
      roles y gobierno que hacen que la estrategia se ejecute sin fricción.</p></div>
      <div class="pilar"><p class="pilar-titulo">INTELIGENCIA<br/>DIGITAL</p><p>IA, automatización
      e integración tecnológica que multiplican la capacidad del equipo humano.</p></div>
    </div>
    <h3 class="subtitulo-naranja">¿Por qué ARQUIRON?</h3>
    <ul class="lista">
      <li><strong>Rigor de consultoría global, cercanía de firma boutique.</strong> Nuestros
      consultores provienen de firmas globales y compañías multilatinas, pero operamos con la
      agilidad y atención personalizada que solo una firma boutique puede ofrecer.</li>
      <li><strong>Metodología propia probada.</strong> FORJA® es una metodología estructurada en 5
      fases que garantiza trazabilidad, calidad de entregables y resultados accionables.</li>
      <li><strong>Foco en PYMES de Latinoamérica.</strong> Entendemos las restricciones, tiempos y
      prioridades reales de empresas de 20 a 150 empleados. No aplicamos plantillas de
      multinacionales.</li>
      <li><strong>Modelo económico alineado.</strong> Parte de nuestros honorarios está atada al
      valor generado. Ganamos cuando usted gana.</li>
      <li><strong>Transferencia de conocimiento como principio.</strong> Nuestro objetivo no es
      hacerlo dependiente de nosotros, sino dejar capacidades instaladas en su equipo.</li>
    </ul>
  </section>`;
}

function alcance(d: PropuestaPDFData): string {
  const exclusionesExtra = (d.exclusionesAdicionales || "")
    .split("\n")
    .map((l) => l.replace(/^[•\-*]\s*/, "").trim())
    .filter(Boolean);
  return `
  <section class="page">
    ${tituloSeccion("05", "Alcance del proyecto")}
    <h3 class="subtitulo-naranja">Lo que sí incluye este acompañamiento</h3>
    <ul class="lista">
      <li>Diagnóstico ejecutivo del estado actual (as-is) de la organización en las dimensiones acordadas.</li>
      <li>Diseño del modelo objetivo (to-be) y arquitectura de la solución propuesta.</li>
      <li>Rediseño y documentación de procesos críticos priorizados.</li>
      <li>Estructuración del modelo de gobierno, roles, responsabilidades e indicadores clave.</li>
      <li>Justificación económica de las iniciativas priorizadas (business case).</li>
      <li>Hoja de ruta de implementación con secuencia, dependencias y quick wins.</li>
      <li>Acompañamiento en la ejecución durante la ventana definida en la Sección 7.</li>
      <li>Transferencia de conocimiento al equipo del cliente durante todas las fases.</li>
    </ul>
    <h3 class="subtitulo-naranja">Lo que NO incluye este acompañamiento</h3>
    <p>Por transparencia, el presente alcance excluye explícitamente los siguientes elementos, que
    pueden contratarse como extensión mediante un anexo formal:</p>
    <ul class="lista">
      <li>Implementación de software o desarrollo de sistemas de información.</li>
      <li>Ejecución operativa de los procesos rediseñados (el cliente ejecuta con acompañamiento).</li>
      <li>Servicios legales, contables o fiscales especializados.</li>
      <li>Gestión de cambio organizacional profunda más allá de la sensibilización inicial.</li>
      <li>Costos de terceros que puedan surgir (licencias, viajes, estudios de mercado externos).</li>
      ${exclusionesExtra.map((l) => `<li>${esc(l)}</li>`).join("")}
    </ul>
    <div class="callout">Cualquier requerimiento fuera del alcance definido será atendido mediante
    el procedimiento de Cambios formalizado en la Sección 12 de esta propuesta.</div>
  </section>`;
}

function metodologiaForja(): string {
  const filas: [string, string, string][] = [
    ["F", "FIJAR", "Definir con claridad el punto de partida, los objetivos y el alcance. Establecer la línea base sobre la que se medirá el avance."],
    ["O", "ORIENTAR", "Definir el norte estratégico y el modelo objetivo. Alinear a los tomadores de decisión sobre la dirección a seguir."],
    ["R", "REDISEÑAR", "Rediseñar procesos, estructuras y capacidades para cerrar la brecha entre el estado actual y el modelo objetivo."],
    ["J", "JUSTIFICAR", "Construir el business case, priorizar iniciativas y traducir el plan en decisiones de inversión defendibles ante la junta."],
    ["A", "ACOMPAÑAR", "Acompañar la ejecución en las primeras semanas críticas, transferir conocimiento y asegurar que las capacidades queden instaladas."],
  ];
  return `
  <section class="page">
    ${tituloSeccion("06", "Metodología FORJA®")}
    <p>FORJA® es la metodología propietaria de ARQUIRON, diseñada específicamente para acompañar
    procesos de transformación empresarial en PYMES latinoamericanas. Está estructurada en cinco
    fases secuenciales que garantizan trazabilidad, calidad y resultados accionables.</p>
    <table class="tabla-forja">
      <thead><tr><th>Fase</th><th>Nombre</th><th>Propósito y resultado clave</th></tr></thead>
      <tbody>
        ${filas.map(([l, n, p]) => `<tr><td class="letra-forja">${l}</td><td class="nombre-forja">${n}</td><td>${p}</td></tr>`).join("")}
      </tbody>
    </table>
    <div class="callout callout-oscuro">Cada fase produce entregables específicos, ceremonias de
    gobernanza definidas y criterios de aceptación explícitos. Ninguna fase avanza sin el visto
    bueno formal del cliente sobre la anterior.</div>
  </section>`;
}

function hitoCard(numero: string, fase: string, mesesLabel: string, titulo: string, intro: string, actividades: string[], entregable: string): string {
  return `
    <div class="hito-card">
      <p class="hito-header">HITO ${numero} · FORJA® ${fase} · <span class="hito-meses">${esc(mesesLabel)}</span></p>
      <h4 class="hito-titulo">${titulo}</h4>
      <p><strong>¿Qué hacemos?</strong> ${intro}</p>
      <p class="actividades-label">Actividades clave</p>
      <ul class="lista">${actividades.map((a) => `<li>${a}</li>`).join("")}</ul>
      <p class="entregable">⬢ Entregable: <strong>${entregable}</strong></p>
    </div>`;
}

function hojaDeRuta(d: PropuestaPDFData): string {
  const meses = Math.max(1, Math.round(Number(d.duracionMeses) || 6));
  const h1 = d.hito1Meses || "Mes 1";
  const h2 = d.hito2Meses || "Meses 2 y 3";
  const h3 = d.hito3Meses || "Mes 4";
  const h4 = d.hito4Meses || "Meses 5 y 6";

  const totalColumnas = Math.max(meses, ...[h1, h2, h3, h4].flatMap(mesesDeEtiqueta), 1);
  const columnas = Array.from({ length: totalColumnas }, (_, i) => i + 1);
  const puntos = (label: string) => {
    const marcados = new Set(mesesDeEtiqueta(label));
    return columnas.map((c) => `<td>${marcados.has(c) ? "●" : ""}</td>`).join("");
  };
  const puntosTodos = () => columnas.map(() => `<td>●</td>`).join("");

  return `
  <section class="page">
    ${tituloSeccion("07", "Hoja de ruta y entregables")}
    <p>El proyecto se estructura en ${meses} meses, organizados en cuatro hitos que corresponden a
    las fases de la metodología FORJA®. Cada hito tiene entregables, ceremonias y criterios de
    aceptación explícitos.</p>
    ${hitoCard(
      "1", "FIJAR", h1, "Diagnóstico y línea base",
      "Levantamos el estado actual (as-is) desde tres perspectivas: la experiencia del cliente, los procesos internos y las capacidades organizacionales. Identificamos brechas críticas y oportunidades priorizadas.",
      [
        "Entrevistas ejecutivas con equipo de liderazgo",
        "Revisión de recorrido y experiencia del cliente",
        "Mapeo de procesos críticos actuales",
        "Evaluación de capacidades organizacionales",
        "Análisis de brechas y priorización",
      ],
      "Diagnóstico Ejecutivo con situación actual, brechas críticas, oportunidades y prioridades de intervención."
    )}
    ${hitoCard(
      "2", "ORIENTAR + REDISEÑAR", h2, "Diseño empresarial y fortalecimiento de procesos",
      "Trabajamos sobre las brechas identificadas para construir las bases de una operación sólida y escalable. Definimos el modelo objetivo y rediseñamos procesos críticos.",
      [
        "Definición del modelo operativo objetivo",
        "Rediseño de procesos críticos priorizados",
        "Estructuración de roles y responsabilidades",
        "Definición de indicadores clave (KPI)",
        "Identificación de necesidades tecnológicas",
      ],
      "Modelo Operativo con procesos estructurados, matriz RACI, indicadores clave y plan de acción para cerrar brechas."
    )}
  </section>
  <section class="page">
    ${hitoCard(
      "3", "JUSTIFICAR", h3, "Business case y hoja de ruta",
      "Convertimos el diseño en un plan defendible ante la junta: iniciativas priorizadas, inversiones estimadas, beneficios esperados y secuencia de ejecución.",
      [
        "Estimación de esfuerzo e inversión por iniciativa",
        "Estimación de beneficios y ROI",
        "Priorización con criterios de impacto y esfuerzo",
        "Definición de secuencia y dependencias",
        "Identificación de quick wins",
      ],
      "Business Case + Hoja de Ruta de Fortalecimiento con iniciativas priorizadas, inversión, beneficios y secuencia."
    )}
    ${hitoCard(
      "4", "ACOMPAÑAR", h4, "Acompañamiento en ejecución y cierre",
      "Acompañamos las primeras semanas críticas de ejecución, resolvemos bloqueos, transferimos conocimiento y aseguramos que las capacidades queden instaladas en el equipo del cliente.",
      [
        "Acompañamiento a la ejecución de quick wins",
        "Resolución de bloqueos y ajustes al plan",
        "Sesiones de transferencia de conocimiento",
        "Definición del modelo de sostenibilidad",
        "Cierre formal y retrospectiva",
      ],
      "Informe de Cierre + Modelo de Sostenibilidad + Sesiones de transferencia documentadas."
    )}
    <h3 class="subtitulo-naranja">Cronograma general</h3>
    <p>Distribución de hitos y ceremonias a lo largo del proyecto:</p>
    <table class="tabla-cronograma">
      <thead><tr><th>Actividad</th>${columnas.map((c) => `<th>M${c}</th>`).join("")}</tr></thead>
      <tbody>
        <tr><td>Hito 1 — Diagnóstico y línea base</td>${puntos(h1)}</tr>
        <tr><td>Hito 2 — Diseño y rediseño de procesos</td>${puntos(h2)}</tr>
        <tr><td>Hito 3 — Business case y hoja de ruta</td>${puntos(h3)}</tr>
        <tr><td>Hito 4 — Acompañamiento en ejecución</td>${puntos(h4)}</tr>
        <tr><td>Comités quincenales de seguimiento</td>${puntosTodos()}</tr>
        <tr><td>Comités mensuales ejecutivos</td>${puntosTodos()}</tr>
      </tbody>
    </table>
    <p class="nota">Nota: el cronograma podrá ajustarse durante la fase inicial de planeación
    conjunta, sin alterar la duración total ni el alcance del acompañamiento.</p>
  </section>`;
}

function equipo(): string {
  return `
  <section class="page">
    ${tituloSeccion("08", "Equipo del proyecto")}
    <p>El proyecto contará con un equipo core de tres consultores senior con formación
    internacional y experiencia comprobada en firmas de consultoría, compañías multilatinas y
    sectores regulados.</p>
    <h3 class="subtitulo-naranja">Equipo core asignado</h3>
    <div class="miembro">
      <p class="miembro-nombre">Eduard Fabián Álvarez Pacheco</p>
      <p class="miembro-cargo">Líder de proyecto · Arquitecto Empresarial</p>
      <p>Ingeniero de Sistemas con más de 15 años liderando la conexión entre negocio y tecnología
      en los sectores asegurador, salud, consultoría y gobierno. Magíster en Gerencia Estratégica
      de TI (Universidad Externado), TOGAF® 9 Foundation, Scrum Master, Auditor Interno ISO 27001.
      Actualmente Arquitecto Empresarial Master y Líder de Estrategia y Gobierno de IA.</p>
    </div>
    <div class="miembro">
      <p class="miembro-nombre">Nestor Barreto</p>
      <p class="miembro-cargo">Consultor Senior · Estrategia Empresarial, Supply Chain y Operaciones</p>
      <p>MBA de ESADE Business School con experiencia en diseño y optimización de cadenas de
      suministro para compañías multilatinas. Especializado en modelado operativo, gestión de
      proveedores y transformación de operaciones.</p>
    </div>
    <div class="miembro">
      <p class="miembro-nombre">Natalia Ardila</p>
      <p class="miembro-cargo">Consultora Senior · Producto Digital y CX</p>
      <p>Experiencia previa en McKinsey &amp; Company, Rappi y Yape, liderando iniciativas de
      producto digital, experiencia de cliente y transformación digital en organizaciones de alto
      crecimiento en Latinoamérica.</p>
    </div>
    <h3 class="subtitulo-naranja">Red de expertos</h3>
    <p>El equipo core podrá extenderse con expertos temáticos de la red ARQUIRON, activados según
    necesidades específicas del proyecto (finanzas corporativas, tecnología, legal, compliance,
    entre otros).</p>
  </section>`;
}

function gobierno(): string {
  const ceremonias: [string, string, string, string][] = [
    ["Kick-off", "Única", "Equipos completos ambas partes", "Alinear expectativas, roles y plan detallado"],
    ["Comité de seguimiento", "Quincenal", "Líder ARQUIRON + Sponsor operativo cliente", "Revisar avance, riesgos y ajustes tácticos"],
    ["Comité ejecutivo", "Mensual", "Co-fundadores ARQUIRON + Sponsor ejecutivo cliente", "Presentar resultados de hito, decisiones estratégicas"],
    ["Cierre de hito", "4 sesiones", "Equipos completos + Sponsor", "Presentar entregable, obtener aprobación formal"],
  ];
  return `
  <section class="page">
    ${tituloSeccion("09", "Gobierno del proyecto")}
    <p>El gobierno del proyecto está diseñado para garantizar visibilidad ejecutiva, toma de
    decisiones oportuna y control de calidad continuo, sin generar sobrecarga administrativa.</p>
    <h3 class="subtitulo-naranja">Ceremonias</h3>
    <table class="tabla-forja">
      <thead><tr><th>Ceremonia</th><th>Frecuencia</th><th>Participantes</th><th>Propósito</th></tr></thead>
      <tbody>
        ${ceremonias.map(([c, f, p, o]) => `<tr><td><strong>${c}</strong></td><td>${f}</td><td>${p}</td><td>${o}</td></tr>`).join("")}
      </tbody>
    </table>
    <h3 class="subtitulo-naranja">Roles y responsabilidades</h3>
    <ul class="lista">
      <li><strong>Sponsor ejecutivo (cliente):</strong> máxima autoridad para el proyecto. Aprueba
      entregables, resuelve escalamientos y firma cierre de hitos.</li>
      <li><strong>Sponsor operativo (cliente):</strong> interlocutor diario del equipo ARQUIRON.
      Facilita accesos, coordina disponibilidad y valida entregables intermedios.</li>
      <li><strong>Líder de proyecto (ARQUIRON):</strong> responsable de la ejecución, calidad de
      entregables, gestión de riesgos y comunicación con el sponsor.</li>
      <li><strong>Equipo consultor (ARQUIRON):</strong> ejecuta las actividades definidas en cada
      hito bajo la dirección del líder de proyecto.</li>
    </ul>
  </section>`;
}

function factoresExito(d: PropuestaPDFData): string {
  const riesgos: [string, string, string][] = [
    ["Baja disponibilidad del equipo cliente", "Retrasos en cronograma", "Acuerdo explícito de horas comprometidas en kick-off"],
    ["Cambios en prioridades estratégicas", "Cambio de alcance", "Procedimiento formal de cambios (Sección 12)"],
    ["Información parcial o desactualizada", "Diagnóstico incompleto", "Fase de levantamiento con validación en fuente primaria"],
    ["Resistencia interna al cambio", "Baja adopción de resultados", "Involucramiento temprano de líderes clave y comunicación"],
  ];
  const horas = Number(d.horasSemanales) || 0;
  return `
  <section class="page">
    ${tituloSeccion("10", "Factores de éxito, supuestos y exclusiones")}
    <h3 class="subtitulo-naranja">Factores críticos de éxito</h3>
    <ul class="lista">
      <li>Compromiso visible y sostenido del sponsor ejecutivo durante todo el proyecto.</li>
      <li>Disponibilidad oportuna del equipo del cliente para entrevistas, talleres y validaciones.</li>
      <li>Acceso a información existente relevante (procesos, indicadores, sistemas, contratos).</li>
      <li>Capacidad de decisión ágil sobre los entregables presentados en cada hito.</li>
      <li>Voluntad genuina de transformación por parte del equipo directivo.</li>
    </ul>
    <h3 class="subtitulo-naranja">Supuestos</h3>
    <p>La presente propuesta se construye sobre los siguientes supuestos, cuya validación se
    realizará durante el kick-off:</p>
    <ul class="lista">
      <li>El proyecto inicia dentro de los 30 días siguientes a la firma de la propuesta.</li>
      <li>El equipo del cliente dispondrá de al menos ${horas || "N"} horas semanales para el proyecto.</li>
      <li>Las sesiones se realizarán en modalidad híbrida (remoto + presencial), con presenciales
      concentradas en hitos clave.</li>
      <li>La información entregada por el cliente será oportuna, completa y veraz.</li>
      <li>El idioma de trabajo será español; entregables en español (traducción a inglés cotizable
      como adicional).</li>
    </ul>
    <h3 class="subtitulo-naranja">Riesgos identificados y mitigación</h3>
    <table class="tabla-forja">
      <thead><tr><th>Riesgo</th><th>Impacto</th><th>Mitigación</th></tr></thead>
      <tbody>
        ${riesgos.map(([r, i, m]) => `<tr><td>${r}</td><td>${i}</td><td>${m}</td></tr>`).join("")}
      </tbody>
    </table>
    ${d.notasAdicionales ? `<h3 class="subtitulo-naranja">Notas adicionales para este proyecto</h3><p>${esc(d.notasAdicionales).replace(/\n/g, "<br/>")}</p>` : ""}
  </section>`;
}

function inversion(d: PropuestaPDFData): string {
  const inv = calcularInversion(d);
  const trmLinea = d.trmValor
    ? `Tipo de cambio de referencia: 1 USD = ${formatCOP(inv.trmValor)} COP (TRM del ${formatFechaLarga(d.trmFecha)}). La conversión es indicativa; la moneda de facturación se define en el contrato marco.`
    : "";
  return `
  <section class="page">
    ${tituloSeccion("11", "Inversión y modelo económico")}
    <p>Nuestro modelo económico está diseñado para alinear los intereses de ARQUIRON con los del
    cliente. Combina un honorario fijo que refleja la intensidad del trabajo por fase y un
    componente variable atado a los resultados que ayudemos a generar.</p>
    <h3 class="subtitulo-naranja">Estructura del modelo</h3>
    <table class="tabla-forja">
      <thead><tr><th>Componente</th><th>¿Cuándo aplica?</th><th>¿Qué reconoce?</th></tr></thead>
      <tbody>
        <tr><td><strong>Anticipo</strong></td><td>A la firma de la propuesta</td><td>Reserva de equipo y arranque del proyecto</td></tr>
        <tr><td><strong>Honorario fijo mensual</strong></td><td>Durante la ejecución</td><td>Trabajo consultor recurrente por fase</td></tr>
        <tr><td><strong>Bono por hito</strong></td><td>Al cierre formal de cada hito</td><td>Aprobación explícita del entregable</td></tr>
        <tr><td><strong>Variable por éxito</strong></td><td>Sobre resultados post-proyecto</td><td>Valor comercial generado por el proyecto</td></tr>
      </tbody>
    </table>
    <h3 class="subtitulo-naranja">Detalle de honorarios</h3>
    <p>Valores en pesos colombianos (COP) y su equivalente indicativo en dólares (USD ref.):</p>
    <table class="tabla-forja tabla-inversion">
      <thead><tr><th>Concepto</th><th>COP</th><th>USD ref.</th></tr></thead>
      <tbody>
        <tr><td>Anticipo (a la firma)</td><td>${formatCOP(inv.anticipoCOP)}</td><td>${formatUSD(inv.anticipoUSD)}</td></tr>
        <tr><td>Honorario fase intensiva (Meses 1–${inv.mesesFase1}) / mes</td><td>${formatCOP(inv.honorarioFase1COP)}</td><td>${formatUSD(inv.honorarioFase1USD)}</td></tr>
        <tr><td>Honorario fase acompañamiento (Meses ${inv.mesesFase1 + 1}–${inv.mesesFase1 + inv.mesesFase2}) / mes</td><td>${formatCOP(inv.honorarioFase2COP)}</td><td>${formatUSD(inv.honorarioFase2USD)}</td></tr>
        <tr><td>Bono por cierre de hito (4 hitos)</td><td>${formatCOP(inv.bonoPorHitoCOP)}</td><td>${formatUSD(inv.bonoPorHitoUSD)}</td></tr>
        <tr class="fila-subtotal"><td>SUBTOTAL FIJO</td><td>${formatCOP(inv.subtotalFijoCOP)}</td><td>${formatUSD(inv.subtotalFijoUSD)}</td></tr>
        <tr><td>IVA (19% aplica a servicios en Colombia)</td><td>${formatCOP(inv.ivaCOP)}</td><td>N/A para facturación USD</td></tr>
        <tr class="fila-total"><td>TOTAL FIJO CON IVA</td><td>${formatCOP(inv.totalConIvaCOP)}</td><td>${formatUSD(inv.totalUSD)}</td></tr>
      </tbody>
    </table>
    ${trmLinea ? `<p class="nota">${trmLinea}</p>` : ""}
    <h3 class="subtitulo-naranja">Componente variable por éxito</h3>
    <p>ARQUIRON recibirá una comisión escalonada sobre el valor de los resultados comerciales o
    financieros generados durante y hasta 12 meses después del cierre del proyecto, según la
    siguiente escala:</p>
    <table class="tabla-forja">
      <thead><tr><th>Tramo de valor generado</th><th>Comisión</th><th>Aplica sobre</th></tr></thead>
      <tbody>
        <tr><td>Deals estándar (bajo umbral estratégico)</td><td class="destacado-teal">3%</td><td>Ingresos cobrados</td></tr>
        <tr><td>Deals estratégicos (sobre umbral estratégico)</td><td class="destacado-ambar">5%</td><td>Ingresos cobrados</td></tr>
        <tr><td>Ahorros operativos verificables (opcional)</td><td class="destacado-teal">10%</td><td>Ahorro validado</td></tr>
      </tbody>
    </table>
    <h3 class="subtitulo-naranja">Principio de atribución</h3>
    <p>El componente variable aplica exclusivamente a resultados que cumplan todas las siguientes
    condiciones:</p>
    <ol class="lista-numerada">
      <li>Sean directamente atribuibles al proyecto y estén documentados en el pipeline o en el
      business case aprobado.</li>
      <li>Hayan sido gestionados o acompañados por ARQUIRON durante la vigencia del acompañamiento.</li>
      <li>Se materialicen dentro de los 12 meses siguientes al cierre formal del proyecto.</li>
      <li>Se calculen sobre ingresos efectivamente recibidos por el cliente (no sobre valor firmado
      o esperado).</li>
    </ol>
    <div class="callout callout-oscuro">Una parte creciente de la remuneración de ARQUIRON depende
    directamente del valor que contribuya a generar. Ganamos cuando usted gana.</div>
  </section>`;
}

function condicionesComerciales(d: PropuestaPDFData): string {
  return `
  <section class="page">
    ${tituloSeccion("12", "Condiciones comerciales")}
    <h3 class="subtitulo-naranja">Forma de pago</h3>
    <ul class="lista">
      <li>Anticipo a la firma de la propuesta (contra factura).</li>
      <li>Honorarios mensuales facturados los primeros 5 días hábiles de cada mes, con pago a 15 días.</li>
      <li>Bono por hito facturado contra acta de aceptación formal firmada por el sponsor.</li>
      <li>Componente variable facturado dentro de los 30 días siguientes al cobro por parte del cliente.</li>
      <li>Facturación en pesos colombianos (COP) o dólares americanos (USD), según se acuerde en el contrato marco.</li>
    </ul>
    <h3 class="subtitulo-naranja">Vigencia de la propuesta</h3>
    <p>La presente propuesta es válida hasta el <strong>${formatFechaLarga(d.fechaValidez)}</strong>.
    Transcurrido este plazo sin aceptación formal, las condiciones aquí presentadas quedarán
    sujetas a revisión.</p>
    <h3 class="subtitulo-naranja">Confidencialidad</h3>
    <p>ARQUIRON tratará como confidencial toda la información recibida del cliente durante el
    proceso de propuesta y ejecución del proyecto. Esta obligación se mantendrá vigente durante la
    ejecución y por un período de 3 años posteriores al cierre. Un Acuerdo de Confidencialidad
    (NDA) específico podrá suscribirse como anexo si el cliente lo requiere.</p>
    <h3 class="subtitulo-naranja">Propiedad intelectual</h3>
    <ul class="lista">
      <li><strong>Entregables del proyecto:</strong> los entregables específicos producidos para el
      cliente son de su propiedad una vez pagados en su totalidad.</li>
      <li><strong>Metodología FORJA®:</strong> permanece como propiedad intelectual de ARQUIRON. El
      cliente adquiere el derecho a usar los outputs, no la metodología en sí.</li>
      <li><strong>Know-how y plantillas:</strong> las herramientas y plantillas de trabajo
      permanecen como propiedad de ARQUIRON.</li>
    </ul>
    <h3 class="subtitulo-naranja">Gestión de cambios (change requests)</h3>
    <p>Cualquier cambio en alcance, cronograma o equipo deberá formalizarse mediante un Change
    Request firmado por ambas partes, que documente: (i) descripción del cambio, (ii) impacto en
    cronograma, (iii) impacto económico y (iv) aprobaciones requeridas. Los cambios menores (sin
    impacto económico) podrán aprobarse por correo electrónico entre líderes.</p>
    <h3 class="subtitulo-naranja">Tratamiento de datos personales</h3>
    <p>En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, ARQUIRON tratará los datos
    personales a los que tenga acceso durante el proyecto exclusivamente para los fines del mismo,
    aplicando las medidas técnicas y organizativas requeridas.</p>
    <h3 class="subtitulo-naranja">Ley aplicable y resolución de controversias</h3>
    <p>La presente propuesta y el contrato que de ella se derive se rigen por las leyes de la
    República de Colombia. Cualquier controversia se resolverá preferentemente por acuerdo directo
    entre las partes; en su defecto, se someterá a un Centro de Arbitraje y Conciliación reconocido
    en la ciudad de Bogotá.</p>
  </section>`;
}

function siguientesPasos(d: PropuestaPDFData): string {
  const pasos: [string, string, string, string][] = [
    ["1", "Revisión y comentarios sobre esta propuesta", "Cliente", "5 días hábiles"],
    ["2", "Sesión de aclaración (si aplica)", "Cliente + ARQUIRON", "Semana siguiente"],
    ["3", "Aceptación formal de la propuesta", "Cliente", "Dentro de la vigencia"],
    ["4", "Firma de contrato marco y NDA", "Ambas partes", "5 días hábiles"],
    ["5", "Pago del anticipo", "Cliente", "Contra factura"],
    ["6", "Sesión de kick-off del proyecto", "Ambos equipos", "Dentro de los 15 días siguientes"],
  ];
  return `
  <section class="page">
    ${tituloSeccion("13", "Siguientes pasos y aceptación")}
    <h3 class="subtitulo-naranja">Ruta hacia el inicio del proyecto</h3>
    <table class="tabla-forja">
      <thead><tr><th>#</th><th>Paso</th><th>Responsable</th><th>Plazo estimado</th></tr></thead>
      <tbody>
        ${pasos.map(([n, p, r, pl]) => `<tr><td>${n}</td><td>${p}</td><td><strong>${r}</strong></td><td>${pl}</td></tr>`).join("")}
      </tbody>
    </table>
    <h3 class="subtitulo-naranja">Aceptación de la propuesta</h3>
    <p>Al firmar el presente documento, ${orDash(d.empresaCliente)} manifiesta su conformidad con
    el alcance, entregables, cronograma, equipo, modelo económico y condiciones comerciales aquí
    presentados.</p>
    <table class="tabla-firmas">
      <tr>
        <td class="firma-col">
          <p class="firma-titulo">Por el Cliente</p>
          <div class="linea-firma"></div>
          <p class="firma-nombre-chico">${orDash(d.contacto)}</p>
          <p>${orDash(d.cargoContacto)}</p>
          <p>${orDash(d.empresaCliente)}</p>
          <p>C.C. / NIT: ${orDash(d.nitCliente)}</p>
          <p>Fecha: ___________________</p>
        </td>
        <td class="firma-col">
          <p class="firma-titulo">Por ARQUIRON</p>
          <div class="linea-firma"></div>
          <p class="firma-nombre-chico">Eduard Fabián Álvarez Pacheco</p>
          <p>Co-fundador · Arquitecto Empresarial Líder</p>
          <p>ARQUIRON Consultoría Estratégica S.A.S.</p>
          <p>NIT: ${esc(ARQUIRON_NIT)}</p>
          <p>Fecha: ___________________</p>
        </td>
      </tr>
    </table>
    <div class="cierre-marca">
      ${marca()}
      <p class="cierre-tagline">Arquitectura que transforma. Mentoría que acompaña.</p>
      <p class="cierre-datos">arquiron.com · contacto@arquiron.com · +57 312 241 5413 · Bogotá D.C., Colombia</p>
    </div>
  </section>`;
}

function tituloSeccion(numero: string, titulo: string): string {
  return `<h2 class="titulo-seccion">${numero} · ${esc(titulo)}</h2>`;
}

// ── Documento completo ───────────────────────────────────────────────

export function generarHTMLPropuestaPDF(d: PropuestaPDFData): string {
  const cuerpo = [
    portada(d),
    cartaPresentacion(d),
    resumenEjecutivo(d),
    entendimientoReto(d),
    propuestaDeValor(),
    alcance(d),
    metodologiaForja(),
    hojaDeRuta(d),
    equipo(),
    gobierno(),
    factoresExito(d),
    inversion(d),
    condicionesComerciales(d),
    siguientesPasos(d),
  ].join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Propuesta Comercial ${esc(d.codigoPropuesta || "")}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #374151;
    font-size: 10.5pt;
    line-height: 1.6;
  }
  .page { break-after: page; }
  .page:last-child { break-after: auto; }
  p { margin: 0 0 10px; }
  h2.titulo-seccion {
    margin: 0 0 16px;
    color: ${AZUL_MARINO};
    font-size: 17pt;
    font-weight: 800;
    border-bottom: 2px solid ${TEAL_VIVO};
    padding-bottom: 8px;
  }
  h3.subtitulo-naranja {
    margin: 20px 0 8px;
    color: ${AMBAR_QUIRON};
    font-size: 11.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  h4.hito-titulo { margin: 4px 0 8px; color: ${AZUL_MARINO}; font-size: 13pt; }
  ul.lista, ol.lista-numerada { margin: 0 0 10px; padding-left: 20px; }
  ul.lista li, ol.lista-numerada li { margin-bottom: 5px; }
  .callout {
    background: ${CREMA}; border: 1px solid #e8dcc8; border-radius: 10px;
    padding: 14px 18px; margin: 14px 0; font-style: italic; color: ${AZUL_MARINO};
  }
  .callout-oscuro {
    background: linear-gradient(135deg, ${INDIGO_PORTADA}, ${MORADO_PORTADA});
    color: #ffffff; border: none; font-style: normal; font-weight: 600; text-align: center;
  }
  .quote-banner {
    background: ${AZUL_MARINO_OSCURO}; color: #ffffff; border-radius: 10px;
    padding: 18px 24px; margin-bottom: 16px; font-style: italic; font-size: 12pt; text-align: center;
  }

  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 9.5pt; }
  .tabla-doble td, .tabla-forja th, .tabla-forja td, .tabla-firmas td { padding: 8px 10px; vertical-align: top; }
  .tabla-doble { border: 1px solid #e5e7eb; }
  .tabla-doble td { border-bottom: 1px solid #eef1f8; }
  .tabla-doble td.k { color: #6b7280; font-weight: 700; width: 16%; }
  .tabla-forja thead th {
    background: ${AZUL_MARINO}; color: #fff; text-align: left; font-size: 9pt;
    text-transform: uppercase; letter-spacing: 0.4px;
  }
  .tabla-forja tbody tr:nth-child(odd) { background: #f8faff; }
  .tabla-forja tbody td { border-bottom: 1px solid #eef1f8; }
  .letra-forja { font-size: 16pt; font-weight: 800; color: ${AMBAR_QUIRON}; text-align: center; width: 6%; }
  .nombre-forja { font-weight: 800; color: ${AZUL_MARINO}; width: 16%; }
  .fila-subtotal td { background: ${TEAL_VIVO}22; font-weight: 800; }
  .fila-total td { background: ${AZUL_MARINO}; color: #fff; font-weight: 800; }
  .destacado-teal { color: #0d9488; font-weight: 800; }
  .destacado-ambar { color: ${AMBAR_QUIRON}; font-weight: 800; }
  .nota { font-size: 9pt; color: #6b7280; font-style: italic; }

  .tabla-cronograma { font-size: 8.5pt; }
  .tabla-cronograma th, .tabla-cronograma td { border: 1px solid #eef1f8; padding: 6px 4px; text-align: center; }
  .tabla-cronograma th { background: ${AZUL_MARINO}; color: #fff; }
  .tabla-cronograma td:first-child, .tabla-cronograma th:first-child { text-align: left; }
  .tabla-cronograma td { color: ${AMBAR_QUIRON}; font-weight: 800; }

  .hito-card {
    border-left: 4px solid ${AMBAR_QUIRON}; background: #fbfbfd; border-radius: 0 10px 10px 0;
    padding: 14px 18px; margin: 14px 0;
  }
  .hito-header { margin: 0 0 2px; color: ${AMBAR_QUIRON}; font-weight: 800; font-size: 9.5pt; text-transform: uppercase; }
  .hito-meses { font-style: italic; text-transform: none; color: #6b7280; }
  .actividades-label { font-weight: 700; color: ${AZUL_MARINO}; margin: 8px 0 4px; }
  .entregable { color: ${AZUL_MARINO}; margin-top: 6px; }

  .pilares { display: flex; gap: 12px; margin-bottom: 16px; }
  .pilar { flex: 1; background: ${CREMA}; border-radius: 10px; padding: 14px; }
  .pilar-titulo { color: ${AMBAR_QUIRON}; font-weight: 800; font-size: 12pt; margin: 0 0 8px; }

  .miembro { border-left: 3px solid ${TEAL_VIVO}; padding: 4px 0 4px 16px; margin-bottom: 16px; }
  .miembro-nombre { color: ${AZUL_MARINO}; font-weight: 800; font-size: 12pt; margin: 0; }
  .miembro-cargo { color: ${TEAL_VIVO}; font-weight: 700; margin: 0 0 6px; }

  .firma-bloque { margin-top: 28px; }
  .firma-nombre { font-weight: 800; color: ${AZUL_MARINO}; margin: 0; }
  .firma-cargo { color: ${TEAL_VIVO}; font-weight: 700; margin: 2px 0; }
  .firma-empresa-chica { margin: 6px 0 0; }
  .firma-contacto { color: #6b7280; margin: 2px 0; }
  .destinatario { margin-bottom: 14px; }
  .fecha-carta { text-align: right; color: #6b7280; }

  .tabla-firmas { margin-top: 24px; }
  .firma-col { width: 50%; padding: 0 20px 0 0; vertical-align: top; }
  .firma-titulo { font-weight: 800; color: ${AZUL_MARINO}; }
  .linea-firma { border-bottom: 1px solid ${AZUL_MARINO}; width: 80%; height: 40px; }
  .firma-nombre-chico { font-weight: 700; color: ${AZUL_MARINO}; margin-top: 8px; }
  .cierre-marca { margin-top: 32px; border-top: 1px solid #eef1f8; padding-top: 16px; }
  .cierre-tagline { font-style: italic; color: ${TEAL_VIVO}; font-weight: 600; margin: 8px 0 4px; }
  .cierre-datos { color: #6b7280; font-size: 9pt; }

  /* Portada */
  .portada {
    background: linear-gradient(150deg, ${INDIGO_PORTADA} 0%, ${AZUL_MARINO} 55%, ${MORADO_PORTADA} 100%);
    color: #ffffff; border-radius: 14px; padding: 48px 44px;
    min-height: 90vh; display: flex; flex-direction: column; justify-content: space-between;
  }
  .portada-eyebrow { color: #B8C5FF; font-size: 10pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 18px; }
  .portada-titulo { font-size: 26pt; font-weight: 800; margin: 0 0 10px; line-height: 1.2; }
  .portada-subtitulo { color: #B8C5FF; font-size: 13pt; font-style: italic; margin: 0 0 24px; }
  .portada-tabla { width: 100%; margin-top: 12px; }
  .portada-tabla td { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.15); font-size: 10pt; }
  .portada-tabla td.k { color: #B8C5FF; font-weight: 700; width: 30%; }
  .portada-tabla td.destacado { color: ${AMBAR_QUIRON}; font-weight: 800; }
  .presentada-por { color: #B8C5FF; font-size: 9pt; margin: 0; }
  .firma-empresa { font-size: 13pt; font-weight: 800; margin: 4px 0 2px; }
  .firma-datos { color: #B8C5FF; font-size: 9pt; margin: 0; }
  .confidencial-bar {
    margin-top: 24px; background: rgba(255,255,255,0.1); border-radius: 8px;
    padding: 10px 16px; font-size: 8.5pt; text-align: center; color: #ffffff;
  }
</style>
</head>
<body>
${cuerpo}
</body>
</html>`;
}
