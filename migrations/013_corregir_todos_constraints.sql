-- ========================================
-- VERIFICAR Y CORREGIR TODOS LOS CONSTRAINTS
-- ========================================

-- 1. Verificar todos los constraints actuales
SELECT '=== CONSTRAINTS ACTUALES ===' as info;
SELECT conname, contype, consrc 
FROM pg_constraint 
WHERE conrelid = 'puntuacion_grupal_diaria'::regclass 
AND contype = 'c'
ORDER BY conname;

-- 2. Eliminar todos los constraints problemáticos
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_puntualidad_check;
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_animo_y_barras_check;
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_orden_check;
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_verso_memoria_check;
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_preguntas_correctas_check;

-- 3. Recrear constraints con valores correctos según tu sistema
-- Puntualidad: 0, 2.5, 5, 7.5, 10
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_puntualidad_check 
CHECK (puntualidad IN (0, 2.5, 5, 7.5, 10));

-- Ánimo y Barras: Malo(0), Regular(10), Bueno(20), Excelente(30)
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_animo_y_barras_check 
CHECK (animo_y_barras IN (0, 10, 20, 30));

-- Orden: Malo(0), Regular(10), Bueno(20), Excelente(30)
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_orden_check 
CHECK (orden IN (0, 10, 20, 30));

-- Verso en Memoria: Malo(0), Regular(10), Bueno(20), Excelente(30)
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_verso_memoria_check 
CHECK (verso_memoria IN (0, 10, 20, 30));

-- Preguntas Correctas: 0, 5, 10, 15, 20, 25, 30
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_preguntas_correctas_check 
CHECK (preguntas_correctas IN (0, 5, 10, 15, 20, 25, 30));

-- 4. Verificar que los nuevos constraints se crearon
SELECT '=== NUEVOS CONSTRAINTS ===' as info;
SELECT conname, contype, consrc 
FROM pg_constraint 
WHERE conrelid = 'puntuacion_grupal_diaria'::regclass 
AND contype = 'c'
ORDER BY conname;

-- 5. Probar inserción con valores válidos
SELECT '=== PROBANDO INSERCIÓN ===' as info;
INSERT INTO puntuacion_grupal_diaria (
  classroom_id, 
  jurado_id, 
  fecha, 
  puntualidad,        -- 7.5 puntos = 75%
  animo_y_barras,     -- 20 puntos = Excelente
  orden,             -- 20 puntos = Excelente
  verso_memoria,      -- 20 puntos = Excelente
  preguntas_correctas -- 25 puntos = 5 niños
) 
SELECT 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1),
  (SELECT id FROM maestros WHERE nombre ILIKE '%emilio%' LIMIT 1),
  CURRENT_DATE,
  7.5,
  20,
  20,
  20,
  25
WHERE 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1) IS NOT NULL
  AND (SELECT id FROM maestros WHERE nombre ILIKE '%emilio%' LIMIT 1) IS NOT NULL;