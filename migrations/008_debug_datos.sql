-- ========================================
-- VERIFICACIÓN Y DEBUG DE TABLAS
-- ========================================

-- 1. Verificar si hay datos en puntuacion_grupal_diaria
SELECT COUNT(*) as total_registros FROM puntuacion_grupal_diaria;

-- 2. Verificar estructura completa de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'puntuacion_grupal_diaria' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar si hay maestros
SELECT COUNT(*) as total_maestros FROM maestros WHERE rol = 'jurado';

-- 4. Verificar si hay classrooms
SELECT id, nombre, color FROM classrooms WHERE activo = true ORDER BY nombre;

-- 5. Intentar una consulta simple como la hace el frontend
SELECT 
  jurado_id,
  puntualidad,
  animo_y_barras,
  creado_en
FROM puntuacion_grupal_diaria 
WHERE classroom_id = '9b8a58b3-6356-4b75-b28b-d5f5d8e596fd'
AND fecha = '2026-01-26'
ORDER BY creado_en;

-- 6. Si no hay datos, insertar un registro de prueba
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
  '9b8a58b3-6356-4b75-b28b-d5f5d8e596fd',
  (SELECT id FROM maestros WHERE rol = 'jurado' LIMIT 1),
  '2026-01-26',
  75,
  20,
  20,
  20,
  25
) ON CONFLICT (classroom_id, fecha, jurado_id) DO NOTHING;