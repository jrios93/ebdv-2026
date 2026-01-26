-- ========================================
-- CORRECCIÓN DE CHECK CONSTRAINTS
-- ========================================

-- 1. Verificar constraints actuales
SELECT conname, contype, consrc, conkey 
FROM pg_constraint 
WHERE conrelid = 'puntuacion_grupal_diaria'::regclass 
AND contype = 'c';

-- 2. Eliminar el constraint problemático
ALTER TABLE puntuacion_grupal_diaria 
DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_puntualidad_check;

-- 3. Recrear el constraint con valores correctos (0, 25, 50, 75, 100)
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_puntualidad_check 
CHECK (puntualidad IN (0, 25, 50, 75, 100));

-- 4. Verificar todos los constraints
SELECT conname, contype, consrc, conkey 
FROM pg_constraint 
WHERE conrelid = 'puntuacion_grupal_diaria'::regclass 
AND contype = 'c'
ORDER BY conname;

-- 5. Probar inserción con valores válidos
INSERT INTO puntuacion_grupal_diaria (
  classroom_id, 
  jurado_id, 
  fecha, 
  puntualidad, 
  animo_y_barras, 
  orden, 
  verso_memoria, 
  preguntas_correctas
) VALUES (
  (SELECT id FROM classrooms WHERE nombre = 'Vida' LIMIT 1),
  (SELECT id FROM maestros WHERE rol = 'jurado' LIMIT 1),
  CURRENT_DATE,
  75,  -- Este valor debería ser válido ahora
  20,
  20,
  20,
  25
) ON CONFLICT (classroom_id, fecha, jurado_id) DO NOTHING;

-- 6. Verificar que se insertó correctamente
SELECT * FROM puntuacion_grupal_diaria WHERE fecha = CURRENT_DATE;