-- CORRECCIÓN 1: Renombrar campo creado_en → creado_el en tabla individual
ALTER TABLE puntuacion_individual_diaria RENAME COLUMN creado_en TO creado_el;

-- CORRECCIÓN 2: Ajustar constraint de preguntas correctas (máximo 3 como indicaste)
ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT puntuacion_grupal_diaria_preguntas_correctas_check;
ALTER TABLE puntuacion_grupal_diaria ADD CONSTRAINT puntuacion_grupal_diaria_preguntas_correctas_check CHECK (preguntas_correctas >= 0 AND preguntas_correctas <= 3);

-- VERIFICACIÓN 3: Verificar columnas en tabla individual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'puntuacion_individual_diaria' 
ORDER BY ordinal_position;

-- VERIFICACIÓN 4: Verificar columnas en tabla grupal
\d puntuacion_grupal_diaria;

-- VERIFICACIÓN 5: Verificar datos existentes
SELECT COUNT(*) as total_individual FROM puntuacion_individual_diaria WHERE fecha = '2026-01-24';
SELECT COUNT(*) as total_grupal FROM puntuacion_grupal_diaria WHERE fecha = '2026-01-24';

-- VERIFICACIÓN 6: Verificar estructura de registros existentes
SELECT id, alumno_id, creado_el, actualizado_en 
FROM puntuacion_individual_diaria 
WHERE fecha = '2026-01-24' 
LIMIT 3;