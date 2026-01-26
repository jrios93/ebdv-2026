-- ========================================
-- CORRECCIÓN DE CHECK CONSTRAINTS
-- ========================================

-- 1. Eliminar el constraint problemático
ALTER TABLE puntuacion_grupal_diaria 
DROP CONSTRAINT IF EXISTS puntuacion_grupal_diaria_puntualidad_check;

-- 2. Recrear el constraint con valores correctos (0, 2.5, 5, 7.5, 10)
ALTER TABLE puntuacion_grupal_diaria 
ADD CONSTRAINT puntuacion_grupal_diaria_puntualidad_check 
CHECK (puntualidad IN (0, 2.5, 5, 7.5, 10));

-- 3. Probar inserción con valores válidos
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
  7.5,  -- Este valor debería ser válido ahora
  20,
  20,
  20,
  25
) ON CONFLICT (classroom_id, fecha, jurado_id) DO NOTHING;

-- 4. Verificar que se insertó correctamente
SELECT * FROM puntuacion_grupal_diaria WHERE fecha = CURRENT_DATE;