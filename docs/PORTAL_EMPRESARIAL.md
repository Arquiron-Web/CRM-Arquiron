# Documentación — Portal empresarial CRM Arquiron

Aplicación web interna para gestión comercial, operativa y de relación con clientes. Este repositorio corresponde al **CRM / portal de equipo** de Arquiron; el sitio público de marketing (arquiron.com) es un producto aparte.

---

## 1. Stack tecnológico y librerías

### Core

| Tecnología | Versión / uso |
|------------|----------------|
| **Next.js** | 16.x — App Router, Server Components, API Routes |
| **React** | 19.x |
| **TypeScript** | 5.x |
| **Node.js** | Entorno de ejecución (recomendado LTS) |

### Estilos y UI

| Librería | Uso |
|----------|-----|
| **Tailwind CSS** | 4.x — utilidades y diseño responsive |
| **shadcn/ui** | 4.x — componentes sobre Radix/Base UI |
| **@base-ui/react** | Primitivos accesibles (Select, etc.) |
| **class-variance-authority (cva)** | Variantes de componentes |
| **clsx** + **tailwind-merge** | Clases condicionales y merge seguro |
| **lucide-react** | Iconografía |
| **next-themes** | Tema claro/oscuro (si aplica) |

### Formularios y validación

| Librería | Uso |
|----------|-----|
| **react-hook-form** | Formularios y estado |
| **@hookform/resolvers** | Integración con Zod |
| **zod** | Esquemas de validación |

### Datos, gráficos y animación

| Librería | Uso |
|----------|-----|
| **recharts** | Gráficos en dashboard y reportes |
| **date-fns** | Fechas |
| **react-day-picker** | Calendario en formularios |
| **framer-motion** | Animaciones (sidebar, transiciones) |

### Drag & drop

| Librería | Uso |
|----------|-----|
| **@dnd-kit/core**, **sortable**, **utilities** | Pipeline Kanban, reordenación |

### Backend e integraciones

| Librería / servicio | Uso |
|---------------------|-----|
| **next-auth** (v4) | Autenticación OAuth con Google |
| **googleapis** | Google Sheets, Calendar, etc. |
| **Google Apps Script** (externo) | Relay de correos (portal, evaluación, propuestas, NPS) vía `NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT` |

### UX y feedback

| Librería | Uso |
|----------|-----|
| **sonner** | Toasts / notificaciones |

### Calidad de código

| Herramienta | Uso |
|-------------|-----|
| **ESLint** | 9.x con `eslint-config-next` |

---

## 2. Listado de páginas (rutas)

Rutas relativas al dominio donde esté desplegado el CRM (ej. `https://crm.ejemplo.com`).

### Autenticación

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión con Google (dominio corporativo restringido) |

### Área autenticada (dashboard)

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard principal — KPIs, actividad reciente, gráficos |
| `/leads` | Listado y gestión de leads (tabla, filtros, drawer) |
| `/madurez` | Evaluaciones de madurez empresarial |
| `/pipeline` | Pipeline comercial (vista Kanban / deals) |
| `/propuestas` | Listado de propuestas comerciales |
| `/propuestas/nueva` | Crear propuesta nueva |
| `/propuestas/[id]/editar` | Editar propuesta existente |
| `/propuestas/[id]/preview` | Vista previa de propuesta |
| `/proyectos` | Proyectos FORJA (metodología, NPS, tareas) |
| `/tareas` | Tareas del equipo |
| `/interacciones` | Registro de interacciones con clientes |
| `/calendario` | Calendario vinculado a Google Calendar |
| `/reportes` | Reportes analíticos (crecimiento, funnel, etc.) |
| `/configuración` | Configuración (empresa, consultores, integraciones, referidos, etc.) |

### API (no son páginas visibles; útiles para integraciones)

Rutas bajo `/api/*` (auth, leads, proyectos, propuestas, calendario, reportes, NPS, búsqueda, notificaciones, configuración, etc.). Ver carpeta `app/api/`.

---

## 3. Funcionalidades principales

### Comercial y pipeline

- Captura y seguimiento de **leads** (manual desde CRM, fuentes externas vía integraciones documentadas).
- Estados de lead, consultor asignado, filtros por fuente (portal, evaluación, CRM, referidos).
- **Pipeline** con arrastrar y soltar para etapas del deal.
- **Propuestas** comerciales: creación, edición, vista previa y envío por email (Apps Script).

### Entrega y proyectos

- **Proyectos** alineados a la metodología FORJA (etapas F-O-R-J-A), avance, IGM, entregables.
- **NPS** y satisfacción del cliente (columnas dedicadas en Sheet, email al cliente, registro manual).
- **Tareas** vinculadas a leads o proyectos.

### Relación y operación

- **Interacciones** (llamadas, emails, reuniones, etc.).
- **Calendario** sincronizado con eventos de Google.
- **Madurez**: seguimiento de evaluaciones de madurez empresarial.

### Análisis y control

- **Dashboard** con métricas y visualizaciones.
- **Reportes** por pestañas (ej. crecimiento, funnel, canales).
- **Búsqueda global** en el layout.
- **Notificaciones** (ej. leads sin contactar, alertas).

### Administración

- **Configuración**: datos de empresa, consultores, integraciones, programa de referidos, exportación de datos.
- Autenticación **NextAuth** con **Google** y restricción por dominio (`ALLOWED_DOMAIN`).

---

## 4. Información relevante adicional

### Arquitectura de datos

- **Google Sheets** como base de datos operativa (`GOOGLE_SHEET_ID`): hojas típicas LEADS, PROYECTOS, TAREAS, etc.
- Acceso mediante **OAuth del usuario** en sesión para la mayoría de operaciones.
- Algunos flujos públicos (ej. respuesta NPS por enlace) pueden usar **refresh token de cuenta de servicio** (`GOOGLE_OWNER_REFRESH_TOKEN`) según configuración.

### Seguridad

- Middleware con **next-auth** protege rutas del dashboard.
- Rutas públicas explícitas: login, `api/auth`, NPS por token, etc. (revisar `middleware.ts`).

### Variables de entorno (referencia)

Sin valores secretos; nombres habituales:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_SHEET_ID`
- `ALLOWED_DOMAIN`
- `NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT` (Apps Script)
- Opcional: `GOOGLE_OWNER_REFRESH_TOKEN`, `GOOGLE_SERVICE_ACCOUNT_*` según despliegue

### Documentación complementaria en el repo

| Archivo | Contenido |
|---------|-----------|
| `docs/APPS_SCRIPT_NPS.md` | Bloque Apps Script para emails NPS |
| `docs/APPS_SCRIPT_PROPUESTA.md` | Envío de propuestas por Apps Script |
| `docs/APPS_SCRIPT_LEADS_FIX.md` | Escritura correcta de filas en LEADS desde Apps Script |
| `docs/DIAGNOSTICO_CRM.md` | Notas de diagnóstico históricas |

### Desarrollo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000` (requiere `.env.local` configurado y cuenta Google del dominio permitido).

### Despliegue

Compatible con **Vercel** u otro hosting Node.js; configurar variables de entorno en el panel del proveedor.

---

## 5. Glosario rápido

| Término | Significado |
|---------|-------------|
| **FORJA** | Metodología interna de etapas del proyecto (Fijar, Orientar, Rediseñar, Justificar, Acompañar). |
| **IGM** | Índice de Madurez. |
| **NPS** | Net Promoter Score / satisfacción del cliente. |

---

*Documento generado para el equipo Arquiron. Actualizar al incorporar módulos nuevos o cambiar el stack.*
