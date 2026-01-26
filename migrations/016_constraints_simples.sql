-- ========================================
-- CONSTRAINTS SIMPLES SIN VERIFICACIÓN DE COLUMNAS
-- ========================================

-- 1. Eliminar todos los constraints existentes
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_puntualidad_check;
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_animo_y_barras_check;
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_orden_check;
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_verso_memoria_check;
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_preguntas_correctas_check;

-- 2. Crear constraints con tus límites originales
-- Puntualidad: 0-10 (permite 2.5, 7.5 decimales)
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_puntualidad_check 
CHECK (puntualidad >= 0 AND puntualidad <= 10);

-- Ánimo y Barras: 0-20
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_animo_y_barras_check 
CHECK (animo_y_barras >= 0 AND animo_y_barras <= 20);

-- Orden: 0-20
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_orden_check 
CHECK (orden >= 0 AND orden <= 20);

-- Verso Memoria: 0-20
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_verso_memoria_check 
CHECK (verso_memoria >= 0 AND verso_memoria <= 20);

-- Preguntas Correctas: 0-30
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_preguntas_correctas_check 
CHECK (preguntas_correctas >= 0 AND preguntas_correctas <= 30);

-- 3. Probar inserción con valores máximos (100 total)
INSERT INTO puntuacion_grupal_diaria (
  classroom_id, 
  jurado_id, 
  fecha, 
  puntualidad,      -- 10 (máximo)
  animo_y_barras,   -- 20 (máximo)
  orden,           -- 20 (máximo)
  verso_memoria,    -- 20 (máximo)
  preguntas_correctas -- 30 (máximo)
) 
SELECT 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1),
  (SELECT id FROM maestros WHERE nombre ILIKE '%emilio%' LIMIT 1),
  CURRENT_DATE,
  10,  -- 10 pts = 100%
  20,  -- 20 pts = Excelente
  20,  -- 20 pts = Excelente
  20,  -- 20 pts = Excelente
  30   -- 30 pts = 6 niños × 5 pts
WHERE 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1) IS NOT NULL
  AND (SELECT id FROM maestros WHERE nombre ILIKE '%emilio%' LIMIT 1) IS NOT NULL;

-- 4. Probar inserción con valores decimales en puntualidad
INSERT INTO puntuacion_grupal_diaria (
  classroom_id, 
  jurado_id, 
  fecha, 
  puntualidad,      -- 7.5 (decimal válido)
  animo_y_barras,   -- 10
  orden,           -- 10
  verso_memoria,    -- 10
  preguntas_correctas -- 15
) 
SELECT 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1),
  (SELECT id FROM maestros WHERE nombre ILIKE '%eliseo%' LIMIT 1),
  CURRENT_DATE,
  7.5,  -- 7.5 pts = 75%
  10,   -- Regular
  10,   -- Regular
  10,   -- Regular
  15   -- 3 niños
WHERE 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1) IS NOT NULL
  AND (SELECT id FROM maestros WHERE nombre ILIKE '%eliseo%' LIMIT 1) IS NOT NULL;

-- 5. Verificar datos insertados
SELECT 
  pgd.id,
  c.nombre as classroom,
  m.nombre as jurado,
  pgd.puntualidad,
  pgd.animo_y_barras,
  pgd.orden,
  pgd.verso_memoria,
  pgd.preguntas_correctas,
  (pgd.puntualidad + pgd.animo_y_barras + pgd.orden + pgd.verso_memoria + pgd.preguntas_correctas) as total_puntos,
  pgd.creado_en,
  CASE 
    WHEN pgd.puntualidad = 10 THEN '100%'
    WHEN pgd.puntualidad = 7.5 THEN '75%'
    WHEN pgd.puntualidad = 5 THEN '50%'
    WHEN pgd.puntualidad = 2.5 THEN '25%'
    ELSE '0%'
  END as puntualidad_porcentaje
FROM puntuacion_grupal_diaria pgd
LEFT JOIN classrooms c ON pgd.classroom_id = c.id
LEFT JOIN maestros m ON pgd.jurado_id = m.id
WHERE pgd.fecha = CURRENT_DATE
ORDER BY pgd.creado_en;