-- ========================================
-- CREAR VISTA f_promedios_diarios (si no existe)
-- ========================================

-- 1. Verificar si la vista existe
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'v_promedios_diarios';

-- 2. Crear la vista (si no existe)
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

-- 3. Verificar que la vista se creó correctamente
SELECT 'Vista creada' as status, COUNT(*) as columnas
FROM information_schema.columns 
WHERE table_name = 'v_promedios_diarios' 
AND table_schema = 'public';

-- 4. Probar la vista con datos reales
SELECT * FROM v_promedios_diarios LIMIT 5;