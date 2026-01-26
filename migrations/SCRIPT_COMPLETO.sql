-- ========================================
-- SISTEMA DE JURADOS - SCRIPT COMPLETO
-- Copiar y pegar todo esto en el terminal SQL de Supabase
-- ========================================

-- 1. BACKUP DE SEGURIDAD
CREATE TABLE puntuacion_grupal_diaria_backup AS 
SELECT * FROM puntuacion_grupal_diaria;

-- 2. ELIMINAR OBJETOS DEPENDIENTES
DROP VIEW IF EXISTS v_ranking_grupal CASCADE;
DROP VIEW IF EXISTS v_promedios_diarios CASCADE;
DROP FUNCTION IF EXISTS calcular_promedio_diario CASCADE;

-- 3. ELIMINAR TABLA ANTIGUA
DROP TABLE IF EXISTS puntuacion_grupal_diaria CASCADE;

-- 4. CREAR NUEVA TABLA CON SOPORTE PARA MÚLTIPLES JURADOS
CREATE TABLE puntuacion_grupal_diaria (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL,
  fecha date NOT NULL,
  jurado_id uuid NOT NULL,
  
  -- Campos de puntuación
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
  UNIQUE(classroom_id, fecha, jurado_id),
  FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE CASCADE,
  FOREIGN KEY (jurado_id) REFERENCES public.maestros(id) ON DELETE CASCADE
);

-- 5. CREAR ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX idx_puntuacion_grupal_classroom_fecha ON puntuacion_grupal_diaria(classroom_id, fecha);
CREATE INDEX idx_puntuacion_grupal_jurado_fecha ON puntuacion_grupal_diaria(jurado_id, fecha);
CREATE INDEX idx_puntuacion_grupal_fecha ON puntuacion_grupal_diaria(fecha);

-- 6. CREAR FUNCIÓN PARA CALCULAR PROMEDIOS
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

-- 7. CREAR VISTA PARA PROMEDIOS DIARIOS
CREATE OR REPLACE VIEW v_promedios_diarios AS
SELECT 
  pgd.classroom_id,
  c.nombre as classroom_nombre,
  c.color as classroom_color,
  pgd.fecha,
  COUNT(*) as total_jurados,
  ROUND(AVG(pgd.puntualidad)::numeric, 2) as puntualidad_promedio,
  ROUND(AVG(pgd.animo_y_barras)::numeric, 2) as animo_y_barras_promedio,
  ROUND(AVG(pgd.orden)::numeric, 2) as orden_promedio,
  ROUND(AVG(pgd.verso_memoria)::numeric, 2) as verso_memoria_promedio,
  ROUND(AVG(pgd.preguntas_correctas)::numeric, 2) as preguntas_correctas_promedio,
  ROUND(AVG(pgd.puntualidad + pgd.animo_y_barras + pgd.orden + pgd.verso_memoria + pgd.preguntas_correctas)::numeric, 2) as puntaje_total_promedio,
  CASE 
    WHEN COUNT(*) >= 3 THEN 'completado'
    WHEN COUNT(*) > 0 THEN 'en_progreso'
    ELSE 'pendiente'
  END as estado,
  MAX(pgd.actualizado_en) as ultima_actualizacion
FROM puntuacion_grupal_diaria pgd
LEFT JOIN classrooms c ON pgd.classroom_id = c.id
GROUP BY pgd.classroom_id, c.nombre, c.color, pgd.fecha;

-- 8. RECREAR VISTA DE RANKING GRUPAL
CREATE OR REPLACE VIEW v_ranking_grupal AS
SELECT 
  c.id as classroom_id,
  c.nombre as classroom_nombre,
  c.color as classroom_color,
  pgd.fecha,
  COUNT(*) as total_evaluaciones,
  ROUND(AVG(pgd.puntualidad)::numeric, 2) as puntualidad_promedio,
  ROUND(AVG(pgd.animo_y_barras)::numeric, 2) as animo_y_barras_promedio,
  ROUND(AVG(pgd.orden)::numeric, 2) as orden_promedio,
  ROUND(AVG(pgd.verso_memoria)::numeric, 2) as verso_memoria_promedio,
  ROUND(AVG(pgd.preguntas_correctas)::numeric, 2) as preguntas_correctas_promedio,
  ROUND(AVG(pgd.puntualidad + pgd.animo_y_barras + pgd.orden + pgd.verso_memoria + pgd.preguntas_correctas)::numeric, 2) as puntaje_total_promedio,
  CASE 
    WHEN COUNT(*) >= 3 THEN 'completado'
    WHEN COUNT(*) > 0 THEN 'en_progreso'
    ELSE 'pendiente'
  END as estado,
  MAX(pgd.actualizado_en) as ultima_actualizacion
FROM puntuacion_grupal_diaria pgd
LEFT JOIN classrooms c ON pgd.classroom_id = c.id
GROUP BY c.id, c.nombre, c.color, pgd.fecha
ORDER BY puntaje_total_promedio DESC;

-- 9. INSERTAR JURADOS PRINCIPALES
INSERT INTO maestros (dni, nombre, rol, activo) VALUES 
('12345678', 'Emilio Catay', 'jurado', true),
('87654321', 'Eliseo Maldonado', 'jurado', true),
('11223344', 'Pierre Vivanco', 'jurado', true)
ON CONFLICT (dni) DO NOTHING;

-- 10. VERIFICACIÓN FINAL
SELECT '✅ Tabla creada' as resultado, COUNT(*) as columnas
FROM information_schema.columns 
WHERE table_name = 'puntuacion_grupal_diaria' 
AND table_schema = 'public'

UNION ALL

SELECT '✅ Jurados insertados' as resultado, COUNT(*) as total
FROM maestros 
WHERE rol = 'jurado' AND activo = true

UNION ALL

SELECT '✅ Vistas creadas' as resultado, COUNT(*) as total
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('v_ranking_grupal', 'v_promedios_diarios')

UNION ALL

SELECT '✅ Índices creados' as resultado, COUNT(*) as total
FROM pg_indexes 
WHERE tablename = 'puntuacion_grupal_diaria' 
AND schemaname = 'public';

-- ========================================
-- LISTO! Ahora ejecuta el segundo script para configurar Realtime y RLS
-- ========================================