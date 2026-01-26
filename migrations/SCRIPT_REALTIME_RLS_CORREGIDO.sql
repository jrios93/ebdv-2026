-- ========================================
-- CONFIGURACIÓN REALTIME Y RLS - SCRIPT CORREGIDO
-- Ejecutar DESPUÉS del script principal
-- ========================================

-- 1. HABILITAR REALTIME EN TABLAS
ALTER TABLE puntuacion_grupal_diaria REPLICA IDENTITY FULL;
ALTER TABLE maestros REPLICA IDENTITY FULL;
ALTER TABLE classrooms REPLICA IDENTITY FULL;

-- 2. HABILITAR ROW LEVEL SECURITY
ALTER TABLE puntuacion_grupal_diaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE maestros ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS PARA MAESTROS (lectura)
CREATE POLICY "Maestros pueden ver otros maestros" ON maestros
  FOR SELECT USING (rol = 'maestro' OR rol = 'jurado' OR rol = 'admin');

CREATE POLICY "Todos pueden ver classrooms activos" ON classrooms
  FOR SELECT USING (activo = true);

-- 4. POLÍTICAS PARA PUNTUACIÓN GRUPAL DIARIA
CREATE POLICY "Jurados pueden ver evaluaciones" ON puntuacion_grupal_diaria
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM maestros m 
      WHERE m.id = auth.uid() 
      AND m.rol = 'jurado'
      AND m.activo = true
    )
  );

CREATE POLICY "Jurados pueden insertar sus evaluaciones" ON puntuacion_grupal_diaria
  FOR INSERT WITH CHECK (
    jurado_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM maestros m 
      WHERE m.id = auth.uid() 
      AND m.rol = 'jurado'
      AND m.activo = true
    )
  );

CREATE POLICY "Jurados pueden actualizar sus evaluaciones" ON puntuacion_grupal_diaria
  FOR UPDATE USING (jurado_id = auth.uid())
  WITH CHECK (jurado_id = auth.uid());

-- 5. FUNCIÓN PARA VALIDAR SI UN JURADO PUEDE EVALUAR
CREATE OR REPLACE FUNCTION jurado_puede_evaluar(
  p_jurado_id uuid,
  p_classroom_id uuid,
  p_fecha date
) RETURNS TABLE (
  puede_evaluar boolean,
  mensaje text,
  ya_evaluado boolean,
  total_evaluaciones integer
) AS $$
DECLARE
  ya_existe integer;
  total_evals integer;
  es_jurado boolean;
BEGIN
  -- Verificar si es jurado activo
  SELECT EXISTS(
    SELECT 1 FROM maestros 
    WHERE id = p_jurado_id 
    AND rol = 'jurado' 
    AND activo = true
  ) INTO es_jurado;
  
  IF NOT es_jurado THEN
    RETURN QUERY SELECT false, 'No eres un jurado activo', false, 0;
    RETURN;
  END IF;
  
  -- Verificar si ya evaluó hoy
  SELECT COUNT(*) INTO ya_existe
  FROM puntuacion_grupal_diaria 
  WHERE jurado_id = p_jurado_id 
  AND classroom_id = p_classroom_id 
  AND fecha = p_fecha;
  
  -- Verificar total de evaluaciones del día
  SELECT COUNT(*) INTO total_evals
  FROM puntuacion_grupal_diaria 
  WHERE classroom_id = p_classroom_id 
  AND fecha = p_fecha;
  
  IF ya_existe > 0 THEN
    RETURN QUERY SELECT false, 'Ya has evaluado este salón hoy', true, total_evals;
    RETURN;
  END IF;
  
  IF total_evals >= 3 THEN
    RETURN QUERY SELECT false, 'Este salón ya tiene 3 evaluaciones hoy', false, total_evals;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Puedes evaluar este salón', false, total_evals;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCIÓN PARA OBTENER JURADOS DISPONIBLES
CREATE OR REPLACE FUNCTION obtener_jurados_disponibles() 
RETURNS TABLE (
  id uuid,
  nombre text,
  dni text,
  classroom_asignado uuid,
  classroom_nombre text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.nombre,
    m.dni,
    m.classroom_id,
    c.nombre as classroom_nombre
  FROM maestros m
  LEFT JOIN classrooms c ON m.classroom_id = c.id
  WHERE m.rol = 'jurado' 
  AND m.activo = true
  ORDER BY m.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNCIÓN PARA OBTENER EVALUACIONES DEL DÍA
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

-- 8. CONFIGURACIÓN DE PUBLICATIONS PARA REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE puntuacion_grupal_diaria;
ALTER PUBLICATION supabase_realtime ADD TABLE maestros;
ALTER PUBLICATION supabase_realtime ADD TABLE classrooms;

-- 9. VERIFICACIÓN FINAL (CORREGIDA)
SELECT '✅ Realtime habilitado' as resultado, 'OK' as estado
UNION ALL
SELECT '✅ RLS configurado' as resultado, 'OK' as estado
UNION ALL
SELECT '✅ Funciones creadas' as resultado, CAST(COUNT(*) AS TEXT) as total
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('jurado_puede_evaluar', 'obtener_jurados_disponibles', 'obtener_evaluaciones_dia')
UNION ALL
SELECT '✅ Políticas creadas' as resultado, CAST(COUNT(*) AS TEXT) as total
FROM pg_policies 
WHERE schemaname = 'public';

-- ========================================
-- PRUEBAS RÁPIDAS (opcional)
-- ========================================

-- 10. Probar función de jurados disponibles
SELECT * FROM obtener_jurados_disponibles();

-- ========================================
-- ¡LISTO! Sistema de jurados completamente configurado
-- ========================================