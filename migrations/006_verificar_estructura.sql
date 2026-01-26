-- ========================================
-- VERIFICACIÓN DE ESTRUCTURA ACTUAL
-- ========================================

-- 1. Verificar nombres exactos de columnas en la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'puntuacion_grupal_diaria' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar si hay datos en la tabla
SELECT COUNT(*) as total_registros 
FROM puntuacion_grupal_diaria;

-- 3. Verificar nombres de columnas en classrooms
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'classrooms' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar classrooms existentes
SELECT id, nombre, color 
FROM classrooms 
WHERE activo = true 
ORDER BY nombre;