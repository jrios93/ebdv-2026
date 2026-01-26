-- ========================================
-- RECONSTRUCCIÓN DE VISTAS DESPUÉS DE MIGRACIÓN
-- ========================================
-- Este script debe ejecutarse DESPUÉS de la migración principal

-- 1. RECUPERAR VISTA v_ranking_grupal (adaptada a nueva estructura)
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

-- 2. VISTA PARA RANKINGS DIARIOS COMPLETOS
CREATE OR REPLACE VIEW v_ranking_diario_completo AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY puntaje_total_promedio DESC) as posicion,
  classroom_nombre,
  classroom_color,
  fecha,
  total_evaluaciones,
  puntualidad_promedio,
  animo_y_barras_promedio,
  orden_promedio,
  verso_memoria_promedio,
  preguntas_correctas_promedio,
  puntaje_total_promedio,
  estado
FROM v_ranking_grupal
WHERE fecha = CURRENT_DATE
ORDER BY puntaje_total_promedio DESC;

-- 3. VISTA PARA ESTADÍSTICAS GENERALES
CREATE OR REPLACE VIEW v_estadisticas_jurados AS
SELECT 
  m.nombre as jurado_nombre,
  COUNT(pgd.id) as total_evaluaciones_realizadas,
  AVG(pgd.puntualidad) as promedio_puntualidad,
  AVG(pgd.animo_y_barras) as promedio_animo,
  AVG(pgd.orden) as promedio_orden,
  AVG(pgd.verso_memoria) as promedio_verso,
  AVG(pgd.preguntas_correctas) as promedio_preguntas,
  MAX(pgd.fecha) as ultima_evaluacion,
  MIN(pgd.fecha) as primera_evaluacion
FROM maestros m
LEFT JOIN puntuacion_grupal_diaria pgd ON m.id = pgd.jurado_id
WHERE m.rol = 'jurado' AND m.activo = true
GROUP BY m.id, m.nombre
ORDER BY total_evaluaciones_realizadas DESC;

-- 4. VISTA PARA DETALLES DE EVALUACIONES POR JURADO
CREATE OR REPLACE VIEW v_detalle_evaluaciones_jurado AS
SELECT 
  m.nombre as jurado_nombre,
  c.nombre as classroom_nombre,
  pgd.fecha,
  pgd.puntualidad,
  pgd.animo_y_barras,
  pgd.orden,
  pgd.verso_memoria,
  pgd.preguntas_correctas,
  (pgd.puntualidad + pgd.animo_y_barras + pgd.orden + pgd.verso_memoria + pgd.preguntas_correctas) as puntaje_total,
  pgd.creado_en,
  CASE 
    WHEN (SELECT COUNT(*) FROM puntuacion_grupal_diaria pgd2 WHERE pgd2.classroom_id = pgd.classroom_id AND pgd2.fecha = pgd.fecha) >= 3 THEN 'completado'
    ELSE 'en_progreso'
  END as estado_evaluacion_dia
FROM puntuacion_grupal_diaria pgd
LEFT JOIN maestros m ON pgd.jurado_id = m.id
LEFT JOIN classrooms c ON pgd.classroom_id = c.id
WHERE m.rol = 'jurado' AND m.activo = true
ORDER BY pgd.fecha DESC, m.nombre;

-- 5. VERIFICACIÓN - Mostrar todas las vistas creadas
SELECT viewname, viewowner, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE '%ranking%' OR viewname LIKE '%jurado%' OR viewname LIKE '%evaluacion%'
ORDER BY viewname;

-- 6. VERIFICACIÓN - Probar vistas principales
SELECT 'v_ranking_grupal' as vista, COUNT(*) as registros FROM v_ranking_grupal WHERE fecha = CURRENT_DATE
UNION ALL
SELECT 'v_promedios_diarios' as vista, COUNT(*) as registros FROM v_promedios_diarios WHERE fecha = CURRENT_DATE
UNION ALL
SELECT 'v_estadisticas_jurados' as vista, COUNT(*) as registros FROM v_estadisticas_jurados
UNION ALL
SELECT 'v_detalle_evaluaciones_jurado' as vista, COUNT(*) as registros FROM v_detalle_evaluaciones_jurado;

-- ========================================
-- VERIFICACIÓN FINAL DE INTEGRIDAD
-- ========================================

-- 7. Verificar que todo esté en orden
SELECT 
  'Tabla' as tipo_objeto,
  'puntuacion_grupal_diaria' as nombre_objeto,
  (SELECT COUNT(*) FROM puntuacion_grupal_diaria) as total_registros

UNION ALL

SELECT 
  'Vista' as tipo_objeto,
  viewname as nombre_objeto,
  'OK' as total_registros
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('v_ranking_grupal', 'v_promedios_diarios', 'v_estadisticas_jurados', 'v_detalle_evaluaciones_jurado')

UNION ALL

SELECT 
  'Índice' as tipo_objeto,
  indexname as nombre_objeto,
  'OK' as total_registros
FROM pg_indexes 
WHERE tablename = 'puntuacion_grupal_diaria' 
AND schemaname = 'public';