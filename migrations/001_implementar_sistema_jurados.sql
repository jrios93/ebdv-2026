-- ========================================
-- MIGRACIÓN SISTEMA DE JURADOS - OPCIÓN A
-- ========================================
-- Este script modifica la estructura existente para soportar múltiples jurados

-- 1. BACKUP DE TABLA EXISTENTE (por seguridad)
CREATE TABLE puntuacion_grupal_diaria_backup AS 
SELECT * FROM puntuacion_grupal_diaria;

-- 2. IDENTIFICAR OBJETOS DEPENDIENTES (versión corregida para PostgreSQL)
SELECT 
  'VIEW' as object_type,
  viewname as object_name,
  'DROP VIEW ' || viewname || ';' as drop_command
FROM pg_views 
WHERE schemaname = 'public'
AND viewdefinition ILIKE '%puntuacion_grupal_diaria%'

UNION ALL

SELECT 
  'FUNCTION' as object_type,
  routine_name as object_name,
  'DROP FUNCTION ' || routine_name || '(...);' as drop_command
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition ILIKE '%puntuacion_grupal_diaria%';

-- 3. ELIMINAR VISTAS Y OBJETOS DEPENDIENTES
DROP VIEW IF EXISTS v_ranking_grupal;
DROP VIEW IF EXISTS v_ranking_individual;
DROP VIEW IF EXISTS v_promedios_diarios CASCADE;
DROP FUNCTION IF EXISTS calcular_promedio_diario CASCADE;

-- 4. ELIMINAR TABLA ANTIGUA
DROP TABLE IF EXISTS puntuacion_grupal_diaria CASCADE;

-- 3. CREAR NUEVA ESTRUCTURA CON SOPORTE PARA MÚLTIPLES JURADOS
CREATE TABLE puntuacion_grupal_diaria (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL,
  fecha date NOT NULL,
  jurado_id uuid NOT NULL,  -- Ahora es obligatorio y parte de la clave
  
  -- Campos de puntuación (mismos que antes)
  puntualidad numeric DEFAULT 0 CHECK (puntualidad >= 0::numeric AND puntualidad <= 10::numeric),
  animo_y_barras integer DEFAULT 0 CHECK (animo_y_barras >= 0 AND animo_y_barras <= 20),
  orden integer DEFAULT 0 CHECK (orden >= 0 AND orden <= 20),
  verso_memoria integer DEFAULT 0 CHECK (verso_memoria >= 0 AND verso_memoria <= 20),
  preguntas_correctas integer DEFAULT 0 CHECK (preguntas_correctas >= 0 AND preguntas_correctas <= 30),
  preguntas integer DEFAULT (preguntas_correctas * 10),
  
  -- Timestamps
  creado_en timestamp without time zone DEFAULT now(),
  actualizado_en timestamp without time zone DEFAULT now(),
  
  -- Constraints
  PRIMARY KEY (id),
  UNIQUE(classroom_id, fecha, jurado_id),  -- Evita que un jurado evalúe 2 veces el mismo día
  FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE CASCADE,
  FOREIGN KEY (jurado_id) REFERENCES public.maestros(id) ON DELETE CASCADE
);

-- 4. CREAR ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX idx_puntuacion_grupal_classroom_fecha ON puntuacion_grupal_diaria(classroom_id, fecha);
CREATE INDEX idx_puntuacion_grupal_jurado_fecha ON puntuacion_grupal_diaria(jurado_id, fecha);
CREATE INDEX idx_puntuacion_grupal_fecha ON puntuacion_grupal_diaria(fecha);

-- 5. FUNCIÓN PARA CALCULAR PROMEDIOS AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION calcular_promedio_diario(
  p_classroom_id uuid,
  p_fecha date
) RETURNS TABLE (
  total_jurados integer,
  puntualidad_promedio numeric,
  animo_y_barras_promedio numeric,
  orden_promedio numeric,
  verso_memoria_promedio numeric,
  preguntas_correctas_promedio numeric,
  puntaje_total_promedio numeric,
  estado varchar
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_jurados,
    ROUND(AVG(puntualidad)::numeric, 2) as puntualidad_promedio,
    ROUND(AVG(animo_y_barras)::numeric, 2) as animo_y_barras_promedio,
    ROUND(AVG(orden)::numeric, 2) as orden_promedio,
    ROUND(AVG(verso_memoria)::numeric, 2) as verso_memoria_promedio,
    ROUND(AVG(preguntas_correctas)::numeric, 2) as preguntas_correctas_promedio,
    ROUND(AVG(puntualidad + animo_y_barras + orden + verso_memoria + preguntas_correctas)::numeric, 2) as puntaje_total_promedio,
    CASE 
      WHEN COUNT(*) >= 3 THEN 'completado'
      WHEN COUNT(*) > 0 THEN 'en_progreso'
      ELSE 'pendiente'
    END as estado
  FROM puntuacion_grupal_diaria 
  WHERE classroom_id = p_classroom_id 
  AND fecha = p_fecha;
END;
$$ LANGUAGE plpgsql;

-- 6. VISTA PARA CONSULTAS DE PROMEDIOS (muy útil para el frontend)
CREATE OR REPLACE VIEW v_promedios_diarios AS
SELECT 
  pgd.classroom_id,
  c.nombre as classroom_nombre,
  c.color as classroom_color,
  pgd.fecha,
  prom.total_jurados,
  prom.puntualidad_promedio,
  prom.animo_y_barras_promedio,
  prom.orden_promedio,
  prom.verso_memoria_promedio,
  prom.preguntas_correctas_promedio,
  prom.puntaje_total_promedio,
  prom.estado,
  -- Última actualización
  MAX(pgd.actualizado_en) as ultima_actualizacion
FROM puntuacion_grupal_diaria pgd
CROSS JOIN LATERAL calcular_promedio_diario(pgd.classroom_id, pgd.fecha) prom
LEFT JOIN classrooms c ON pgd.classroom_id = c.id
GROUP BY pgd.classroom_id, c.nombre, c.color, pgd.fecha, prom.total_jurados, 
         prom.puntualidad_promedio, prom.animo_y_barras_promedio, prom.orden_promedio,
         prom.verso_memoria_promedio, prom.preguntas_correctas_promedio,
         prom.puntaje_total_promedio, prom.estado;

-- 7. INSERTAR JURADOS ESPECÍFICOS (si no existen)
INSERT INTO maestros (dni, nombre, rol, activo) VALUES 
('12345678', 'Emilio Catay', 'jurado', true),
('87654321', 'Eliseo Maldonado', 'jurado', true),
('11223344', 'Pierre Vivanco', 'jurado', true)
ON CONFLICT (dni) DO NOTHING;

-- 8. VERIFICACIÓN - Mostrar jurados activos
SELECT id, nombre, dni, rol, activo, creado_en 
FROM maestros 
WHERE rol = 'jurado' AND activo = true
ORDER BY nombre;

-- 9. VERIFICACIÓN - Estructura de nueva tabla
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'puntuacion_grupal_diaria' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. VERIFICACIÓN - Índices creados
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename = 'puntuacion_grupal_diaria' 
AND schemaname = 'public'
ORDER BY indexname;

-- ========================================
-- ESTE SCRIPT DEBE EJECUTARSE EN ORDEN:
-- 1. BACKUP (líneas 6-7)
-- 2. DROP TABLA ANTIGUA (línea 10 - descomentar si es seguro)
-- 3. CREATE TABLA NUEVA (líneas 13-35)
-- 4. ÍNDICES (líneas 38-40)
-- 5. FUNCIONES (líneas 43-66)
-- 6. VISTA (líneas 69-84)
-- 7. JURADOS (líneas 87-92)
-- 8. VERIFICACIONES (líneas 95-108)
-- ========================================