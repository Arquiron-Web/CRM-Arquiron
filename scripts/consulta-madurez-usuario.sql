-- ============================================================
-- Consulta: resultado detallado de la Evaluación de Madurez
-- Empresarial de un usuario/lead, frente por frente.
--
-- Cómo usarlo:
-- 1. Reemplaza 'BUSCAR_AQUI' en la CTE lead_buscado por el email,
--    nombre de contacto o nombre de empresa del usuario.
-- 2. Pega y ejecuta este script completo en el SQL Editor de Neon
--    (o con psql usando la DIRECT_URL de producción).
-- ============================================================

WITH lead_buscado AS (
  SELECT *
  FROM leads
  WHERE "emailCorporativo" ILIKE '%BUSCAR_AQUI%'
     OR "nombreContacto"   ILIKE '%BUSCAR_AQUI%'
     OR "nombreEmpresa"    ILIKE '%BUSCAR_AQUI%'
  ORDER BY "updatedAt" DESC
  LIMIT 1
),
dimensiones (indice, nombre, pilar) AS (
  VALUES
    (1,  'Estrategia y Dirección',   'ADN Estratégico'),
    (2,  'Gobierno Empresarial',     'ADN Estratégico'),
    (3,  'Sostenibilidad',           'ADN Estratégico'),
    (4,  'Finanzas y Rentabilidad',  'Motor Operativo'),
    (5,  'Talento y Cultura',        'Motor Operativo'),
    (6,  'Operaciones',              'Motor Operativo'),
    (7,  'Innovación y Agilidad',    'Inteligencia Digital'),
    (8,  'Estrategia Tecnológica',   'Inteligencia Digital'),
    (9,  'Inteligencia de Datos',    'Inteligencia Digital'),
    (10, 'Experiencia del Cliente',  'Enfoque al Cliente')
),
scores AS (
  SELECT 1  AS indice, dim1  AS score FROM lead_buscado
  UNION ALL SELECT 2,  dim2  FROM lead_buscado
  UNION ALL SELECT 3,  dim3  FROM lead_buscado
  UNION ALL SELECT 4,  dim4  FROM lead_buscado
  UNION ALL SELECT 5,  dim5  FROM lead_buscado
  UNION ALL SELECT 6,  dim6  FROM lead_buscado
  UNION ALL SELECT 7,  dim7  FROM lead_buscado
  UNION ALL SELECT 8,  dim8  FROM lead_buscado
  UNION ALL SELECT 9,  dim9  FROM lead_buscado
  UNION ALL SELECT 10, dim10 FROM lead_buscado
)

-- Encabezado / resumen general del lead
SELECT
  'RESUMEN' AS tipo,
  lb."nombreEmpresa"        AS empresa,
  lb."nombreContacto"       AS contacto,
  lb."emailCorporativo"     AS email,
  lb."pais"                 AS pais,
  NULL::text                AS pilar,
  NULL::int                 AS indice,
  'Índice General de Madurez (IGM)' AS frente,
  lb."indiceMadurez"        AS score,
  lb."madurezAutoevaluada"  AS autoevaluacion_previa,
  lb."estadoLead"           AS estado_lead,
  lb."updatedAt"            AS ultima_actualizacion
FROM lead_buscado lb

UNION ALL

-- Detalle por cada uno de los 10 frentes evaluados
SELECT
  'DETALLE' AS tipo,
  lb."nombreEmpresa",
  lb."nombreContacto",
  lb."emailCorporativo",
  lb."pais",
  d.pilar,
  d.indice,
  d.nombre AS frente,
  s.score,
  NULL::numeric AS autoevaluacion_previa,
  lb."estadoLead",
  lb."updatedAt"
FROM scores s
JOIN dimensiones d ON d.indice = s.indice
CROSS JOIN lead_buscado lb

ORDER BY tipo DESC, indice NULLS FIRST;
