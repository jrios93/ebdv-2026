-- CORRECCIÓN 1: Renombrar campo creado_en → creado_el en tabla individual
-- ALTER TABLE puntuacion_individual_diaria RENAME COLUMN creado_en TO creado_el;

-- CORRECCIÓN 2: Ajustar constrain de preguntas correctas (máximo 3 como indicaste)
-- ALTER TABLE puntuacion_grupal_diaria DROP CONSTRAINT puntuacion_grupal_diaria_preguntas_correctas_check;
-- ALTER TABLE puntuacion_grupal_diaria ADD CONSTRAINT puntuacion_grupal_diaria_preguntas_correctas_check CHECK (preguntas_correctas >= 0 AND preguntas_correctas <= 3);

-- CORRECCIÓN 3: Validar que existan las columnas necesarias
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'puntuacion_individual_diaria' ORDER BY ordinal_position;

-- CORRECCIÓN 4: Verificar nombres exactos de columnas
-- \d puntuacion_individual_diaria