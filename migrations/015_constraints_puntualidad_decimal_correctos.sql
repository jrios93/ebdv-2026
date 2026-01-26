-- ========================================
-- CONSTRAINTS CORRECTOS CON PUNTUALIDAD DECIMAL
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

-- Versículo de Memoria: 0-20
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_verso_memoria_check 
CHECK (verso_memoria >= 0 AND verso_memoria <= 20);

-- Preguntas Correctas: 0-30
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_preguntas_correctas_check 
CHECK (preguntas_correctas >= 0 AND preguntas_correctas <= 30);

-- 3. Verificar que los nuevos constraints se crearon
SELECT '=== NUEVOS CONSTRAINTS ===' as info;
SELECT conname, contype, conkey, consrc 
FROM pg_constraint 
WHERE conrelid = 'puntuacion_grupal_diaria'::regclass 
AND contype = 'c'
ORDER BY conname;

-- 4. Probar inserción con puntualidad decimal
SELECT '=== PROBANDO PUNTUALIDAD DECIMAL ===' as info;
INSERT INTO puntuacion_grupal_diaria (
  classroom_id, 
  jurado_id, 
  fecha, 
  puntualidad,      -- 7.5 (decimal válido)
  animo_y_barras,   -- 20 (máximo)
  orden,           -- 20 (máximo)
  verso_memoria,    -- 20 (máximo)
  preguntas_correctas -- 30 (máximo)
) 
SELECT 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1),
  (SELECT id FROM maestros WHERE nombre ILIKE '%emilio%' LIMIT 1),
  CURRENT_DATE,
  7.5,  -- 75% con tu sistema original
  20,
  20,
  20,
  30
WHERE 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1) IS NOT NULL
  AND (SELECT id FROM maestros WHERE nombre ILIKE '%emilio%' LIMIT 1) IS NOT NULL;

-- 5. Verificar que se insertó correctamente
SELECT '=== VERIFICACIÓN DE INSERCIÓN ===' as info;
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
  pgd.creado_en
FROM puntuacion_grupal_diaria pgd
LEFT JOIN classrooms c ON pgd.classroom_id = c.id
LEFT JOIN maestros m ON pgd.jurado_id = m.id
WHERE pgd.fecha = CURRENT_DATE
ORDER BY pgd.creado_en DESC;