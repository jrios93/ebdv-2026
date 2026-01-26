-- ========================================
-- SISTEMA COMPLETO DE PRUEBA PARA JURADOS
-- ========================================

-- 1. LIMPIAR DATOS DE PRUEBA ANTERIORES
DELETE FROM puntuacion_grupal_diaria WHERE fecha = CURRENT_DATE;

-- 2. VERIFICAR ESTRUCTURA ACTUAL
SELECT '=== ESTRUCTURA DE TABLA ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'puntuacion_grupal_diaria' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR CLASSROOMS Y JURADOS DISPONIBLES
SELECT '=== CLASSROOMS ===' as info;
SELECT id, nombre, color FROM classrooms WHERE activo = true ORDER BY nombre;

SELECT '=== JURADOS ===' as info;
SELECT id, nombre, dni, rol FROM maestros WHERE rol = 'jurado' AND activo = true ORDER BY nombre;

-- 4. VERIFICAR SI EXISTEN LOS DATOS
SELECT '=== VERIFICACIÓN DE DATOS ===' as info;

-- Verificar si existe el classroom 'vida'
SELECT 
  (SELECT COUNT(*) FROM classrooms WHERE nombre = 'vida') as vida_mayuscula,
  (SELECT COUNT(*) FROM classrooms WHERE nombre = 'vida') as vida_minuscula;

-- Verificar si existen los jurados
SELECT 
  (SELECT COUNT(*) FROM maestros WHERE nombre ILIKE '%emilio%') as emilio_existe,
  (SELECT COUNT(*) FROM maestros WHERE nombre ILIKE '%eliseo%') as eliseo_existe,
  (SELECT COUNT(*) FROM maestros WHERE nombre ILIKE '%pierre%') as pierre_existe;

-- 5. INSERTAR DATOS DE PRUEBA CORRECTOS
SELECT '=== INSERTANDO DATOS DE PRUEBA ===' as info;

-- Insertar evaluación para Emilio Catay en vida
INSERT INTO puntuacion_grupal_diaria (
  classroom_id, 
  jurado_id, 
  fecha, 
  puntualidad,        -- 7.5 puntos = 75%
  animo_y_barras,     -- 20 puntos = Excelente
  orden,             -- 20 puntos = Excelente
  verso_memoria,      -- 20 puntos = Excelente
  preguntas_correctas -- 25 puntos = 5 niños
) 
SELECT 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1),
  (SELECT id FROM maestros WHERE nombre ILIKE '%emilio%' LIMIT 1),
  CURRENT_DATE,
  7.5,
  20,
  20,
  20,
  25
WHERE 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1) IS NOT NULL
  AND (SELECT id FROM maestros WHERE nombre ILIKE '%emilio%' LIMIT 1) IS NOT NULL;

-- Insertar evaluación para Eliseo Maldonado en vida
INSERT INTO puntuacion_grupal_diaria (
  classroom_id, 
  jurado_id, 
  fecha, 
  puntualidad,        -- 5 puntos = 50%
  animo_y_barras,     -- 10 puntos = Regular
  orden,             -- 10 puntos = Regular
  verso_memoria,      -- 10 puntos = Regular
  preguntas_correctas -- 20 puntos = 4 niños
) 
SELECT 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1),
  (SELECT id FROM maestros WHERE nombre ILIKE '%eliseo%' LIMIT 1),
  CURRENT_DATE,
  5,
  10,
  10,
  10,
  20
WHERE 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1) IS NOT NULL
  AND (SELECT id FROM maestros WHERE nombre ILIKE '%eliseo%' LIMIT 1) IS NOT NULL;

-- Insertar evaluación para Pierre Vivanco en vida
INSERT INTO puntuacion_grupal_diaria (
  classroom_id, 
  jurado_id, 
  fecha, 
  puntualidad,        -- 10 puntos = 100%
  animo_y_barras,     -- 30 puntos = Excelente
  orden,             -- 30 puntos = Excelente
  verso_memoria,      -- 30 puntos = Excelente
  preguntas_correctas -- 30 puntos = 6 niños
) 
SELECT 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1),
  (SELECT id FROM maestros WHERE nombre ILIKE '%pierre%' LIMIT 1),
  CURRENT_DATE,
  10,
  30,
  30,
  30,
  30
WHERE 
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1) IS NOT NULL
  AND (SELECT id FROM maestros WHERE nombre ILIKE '%pierre%' LIMIT 1) IS NOT NULL;

-- 6. VERIFICAR DATOS INSERTADOS
SELECT '=== DATOS INSERTADOS HOY ===' as info;
SELECT 
  pgd.id,
  c.nombre as classroom,
  m.nombre as jurado,
  pgd.puntualidad,
  pgd.animo_y_barras,
  pgd.orden,
  pgd.verso_memoria,
  pgd.preguntas_correctas,
  (pgd.puntualidad + pgd.animo_y_barras + pgd.orden + pgd.verso_memoria + pgd.preguntas_correctas) as puntaje_total,
  pgd.creado_en
FROM puntuacion_grupal_diaria pgd
LEFT JOIN classrooms c ON pgd.classroom_id = c.id
LEFT JOIN maestros m ON pgd.jurado_id = m.id
WHERE pgd.fecha = CURRENT_DATE
ORDER BY pgd.creado_en;

-- 7. VERIFICAR CÁLCULO DE PROMEDIOS MANUAL
SELECT '=== PROMEDIOS CALCULADOS ===' as info;
SELECT 
  c.nombre as classroom,
  COUNT(*) as total_jurados,
  ROUND(AVG(pgd.puntualidad)::numeric, 2) as puntualidad_promedio,
  ROUND(AVG(pgd.animo_y_barras)::numeric, 2) as animo_promedio,
  ROUND(AVG(pgd.orden)::numeric, 2) as orden_promedio,
  ROUND(AVG(pgd.verso_memoria)::numeric, 2) as verso_promedio,
  ROUND(AVG(pgd.preguntas_correctas)::numeric, 2) as preguntas_promedio,
  ROUND(AVG(pgd.puntualidad + pgd.animo_y_barras + pgd.orden + pgd.verso_memoria + pgd.preguntas_correctas)::numeric, 2) as puntaje_total_promedio,
  CASE 
    WHEN COUNT(*) >= 3 THEN 'completado'
    WHEN COUNT(*) > 0 THEN 'en_progreso'
    ELSE 'pendiente'
  END as estado
FROM puntuacion_grupal_diaria pgd
LEFT JOIN classrooms c ON pgd.classroom_id = c.id
WHERE pgd.fecha = CURRENT_DATE
GROUP BY c.id, c.nombre
ORDER BY puntaje_total_promedio DESC;

-- 8. PROBAR LAS FUNCIONES DEL FRONTEND
SELECT '=== PRUEBA DE FUNCIONES ===' as info;

-- Probar función obtener_evaluaciones_dia (simulada)
SELECT 'Función obtener_evaluaciones_dia' as prueba, 
       COUNT(*) as total_registros,
       'usa consulta directa con IDs reales' as metodo
FROM puntuacion_grupal_diaria 
WHERE fecha = CURRENT_DATE;

-- Simular cálculo de estadísticas del día
SELECT 'Simulación obtener_estadisticas_dia' as prueba,
       COUNT(DISTINCT classroom_id) as salones_evaluados,
       COUNT(*) as total_evaluaciones,
       CASE 
         WHEN COUNT(*) OVER (PARTITION BY classroom_id) >= 3 THEN 'completado'
         WHEN COUNT(*) OVER (PARTITION BY classroom_id) > 0 THEN 'en_progreso'
         ELSE 'pendiente'
       END as estado_general
FROM puntuacion_grupal_diaria 
WHERE fecha = CURRENT_DATE
GROUP BY classroom_id;

-- 9. ESTADO FINAL DEL SISTEMA
SELECT '=== ESTADO FINAL DEL SISTEMA ===' as info;
SELECT 
  'Total Classrooms Activos' as metrica,
  COUNT(*) as valor
FROM classrooms WHERE activo = true

UNION ALL

SELECT 
  'Total Jurados Activos' as metrica,
  COUNT(*) as valor
FROM maestros WHERE rol = 'jurado' AND activo = true

UNION ALL

SELECT 
  'Evaluaciones Hoy' as metrica,
  COUNT(*) as valor
FROM puntuacion_grupal_diaria WHERE fecha = CURRENT_DATE

UNION ALL

SELECT 
  'Salones con 3+ Evaluaciones' as metrica,
  COUNT(*) as valor
FROM (
  SELECT classroom_id, COUNT(*) as cnt
  FROM puntuacion_grupal_diaria 
  WHERE fecha = CURRENT_DATE
  GROUP BY classroom_id
  HAVING COUNT(*) >= 3
) subquery;

-- 10. VERIFICAR POLÍTICAS RLS
SELECT '=== POLÍTICAS RLS ===' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('puntuacion_grupal_diaria', 'maestros', 'classrooms')
ORDER BY tablename, policyname;