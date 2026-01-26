-- ========================================
-- CONSTRAINTS CORRECTOS SEGÚN TU SISTEMA ORIGINAL
-- ========================================

-- 1. Eliminar todos los constraints existentes
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_puntualidad_check;
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_animo_y_barras_check;
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_orden_check;
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_verso_memoria_check;
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_preguntas_correctas_check;

-- 2. Crear constraints con tus límites originales
-- Puntualidad: límite 10
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_puntualidad_check 
CHECK (puntualidad >= 0 AND puntualidad <= 10);

-- Ánimo y Barras: límite 20
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_animo_y_barras_check 
CHECK (animo_y_barras >= 0 AND animo_y_barras <= 20);

-- Orden: límite 20
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_orden_check 
CHECK (orden >= 0 AND orden <= 20);

-- Versículo de Memoria: límite 20
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_verso_memoria_check 
CHECK (verso_memoria >= 0 AND verso_memoria <= 20);

-- Preguntas Correctas: límite 30
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_preguntas_correctas_check 
CHECK (preguntas_correctas >= 0 AND preguntas_correctas <= 30);

-- 3. Verificar los nuevos constraints
SELECT '=== NUEVOS CONSTRAINTS ===' as info;
SELECT conname, contype, consrc 
FROM pg_constraint 
WHERE conrelid = 'puntuacion_grupal_diaria'::regclass 
AND contype = 'c'
ORDER BY conname;

-- 4. Probar inserción con tus valores máximos (100 total)
SELECT '=== PROBANDO INSERCIÓN MÁXIMA ===' as info;
INSERT INTO puntuacion_grupal_diaria (
  classroom_id, 
  jurado_id, 
  fecha, 
  puntualidad,      -- 10 pts
  animo_y_barras,   -- 20 pts
  orden,           -- 20 pts
  verso_memoria,    -- 20 pts
  preguntas_correctas -- 30 pts (6 niños × 5 pts)
) 
SELECT 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1),
  (SELECT id FROM maestros WHERE nombre ILIKE '%emilio%' LIMIT 1),
  CURRENT_DATE,
  10,  -- Máximo
  20,  -- Máximo
  20,  -- Máximo
  20,  -- Máximo
  30   -- Máximo (6 niños × 5 pts)
WHERE 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1) IS NOT NULL
  AND (SELECT id FROM maestros WHERE nombre ILIKE '%emilio%' LIMIT 1) IS NOT NULL;

-- 5. Verificar que se insertó correctamente
SELECT '=== DATOS INSERTADOS ===' as info;
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

-- 6. Mostrar resumen del sistema
SELECT '=== RESUMEN DEL SISTEMA ===' as info;
SELECT 
  'Total Classrooms Activos' as concepto,
  COUNT(*) as valor
FROM classrooms WHERE activo = true

UNION ALL

SELECT 
  'Total Jurados Activos' as concepto,
  COUNT(*) as valor
FROM maestros WHERE rol = 'jurado' AND activo = true

UNION ALL

SELECT 
  'Máximo por Categoría' as concepto,
  'Puntualidad:10 | Ánimo:20 | Orden:20 | Verso:20 | Preguntas:30' as valor;

SELECT 
  'Total Máximo por Evaluación' as concepto,
  '100 puntos' as valor;