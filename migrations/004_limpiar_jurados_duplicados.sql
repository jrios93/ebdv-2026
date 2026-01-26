-- LIMPIEZA DE JURADOS DUPLICADOS
-- Mantener solo los 3 jurados principales

-- 1. Identificar cuáles mantener (los que tienen DNI numérico)
SELECT 'Jurados a mantener:' as info, id, nombre, dni
FROM maestros 
WHERE rol = 'jurado' 
AND dni ~ '^[0-9]+$'
ORDER BY nombre;

-- 2. Eliminar jurados duplicados (con DNI_REAL)
DELETE FROM maestros 
WHERE rol = 'jurado' 
AND dni LIKE 'DNI_REAL_%';

-- 3. Verificación final
SELECT 'Jurados finales:' as info, id, nombre, dni, activo
FROM maestros 
WHERE rol = 'jurado' 
ORDER BY nombre;