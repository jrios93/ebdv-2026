-- ========================================
-- CORRECCIÓN DE ERROR DE NOMBRE DE COLUMNA
-- ========================================

-- 1. Verificar el nombre correcto de las columnas en la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'puntuacion_grupal_diaria' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Actualizar función con nombres correctos
DROP FUNCTION IF EXISTS obtener_evaluaciones_dia;

CREATE OR REPLACE FUNCTION obtener_evaluaciones_dia(
  p_classroom_id uuid,
  p_fecha date DEFAULT CURRENT_DATE
) RETURNS TABLE (
  jurado_id uuid,
  jurado_nombre text,
  puntualidad numeric,
  animo_y_barras integer,
  orden integer,
  verso_memoria integer,
  preguntas_correctas integer,
  puntaje_total integer,
  creado_en timestamp,
  promedio_general jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pgd.jurado_id,
    m.nombre as jurado_nombre,
    pgd.puntualidad,
    pgd.animo_y_barras,
    pgd.orden,
    pgd.verso_memoria,
    pgd.preguntas_correctas,
    (pgd.puntualidad + pgd.animo_y_barras + pgd.orden + pgd.verso_memoria + pgd.preguntas_correctas) as puntaje_total,
    pgd.creado_en,
    jsonb_build_object(
      'total_jurados', (SELECT COUNT(*) FROM puntuacion_grupal_diaria WHERE classroom_id = p_classroom_id AND fecha = p_fecha),
      'puntualidad_promedio', (SELECT AVG(puntualidad) FROM puntuacion_grupal_diaria WHERE classroom_id = p_classroom_id AND fecha = p_fecha),
      'animo_promedio', (SELECT AVG(animo_y_barras) FROM puntuacion_grupal_diaria WHERE classroom_id = p_classroom_id AND fecha = p_fecha),
      'estado', CASE 
        WHEN (SELECT COUNT(*) FROM puntuacion_grupal_diaria WHERE classroom_id = p_classroom_id AND fecha = p_fecha) >= 3 THEN 'completado'
        WHEN (SELECT COUNT(*) FROM puntuacion_grupal_diaria WHERE classroom_id = p_classroom_id AND fecha = p_fecha) > 0 THEN 'en_progreso'
        ELSE 'pendiente'
      END
    ) as promedio_general
  FROM puntuacion_grupal_diaria pgd
  LEFT JOIN maestros m ON pgd.jurado_id = m.id
  WHERE pgd.classroom_id = p_classroom_id 
  AND pgd.fecha = p_fecha
  ORDER BY pgd.creado_en;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Actualizar vista con nombres correctos
DROP VIEW IF EXISTS v_promedios_diarios;

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

-- 4. Verificación
SELECT 'Función creada correctamente' as status;
SELECT 'Vista creada correctamente' as status;