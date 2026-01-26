-- ========================================
-- CORRECCIÓN FINAL DE POLÍTICAS RLS PARA JURADOS
-- ========================================

-- 1. Eliminar políticas restrictivas
DROP POLICY IF EXISTS "Allow all operations on puntuacion_grupal_diaria" ON puntuacion_grupal_diaria;
DROP POLICY IF EXISTS "Allow all on maestros" ON maestros;
DROP POLICY IF EXISTS "Allow all on classrooms" ON classrooms;

-- 2. Crear políticas simples que permitan todo
CREATE POLICY "Enable all on puntuacion_grupal_diaria" ON puntuacion_grupal_diaria
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all on maestros" ON maestros
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all on classrooms" ON classrooms
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Deshabilitar RLS temporalmente para pruebas
ALTER TABLE puntuacion_grupal_diaria DISABLE ROW LEVEL SECURITY;
ALTER TABLE maestros DISABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms DISABLE ROW LEVEL SECURITY;

-- 4. Habilitar RLS nuevamente con políticas permisivas
ALTER TABLE puntuacion_grupal_diaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE maestros ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

-- 5. Verificar que las políticas se crearon
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('puntuacion_grupal_diaria', 'maestros', 'classrooms')
ORDER BY tablename, policyname;

-- 6. Probar inserción
INSERT INTO puntuacion_grupal_diaria (
  classroom_id, 
  jurado_id, 
  fecha, 
  puntualidad,        -- 7.5
  animo_y_barras,     -- 10
  orden,             -- 10
  verso_memoria,      -- 10
  preguntas_correctas -- 15
) VALUES (
  (SELECT id FROM classrooms WHERE nombre = 'vida' LIMIT 1),
  (SELECT id FROM maestros WHERE nombre ILIKE '%emilio%' LIMIT 1),
  CURRENT_DATE,
  7.5,
  10,
  10,
  10,
  15
) ON CONFLICT (classroom_id, fecha, jurado_id) DO NOTHING;

-- 7. Verificar que se insertó correctamente
SELECT '=== VERIFICACIÓN FINAL ===' as resultado;
SELECT 
  'Registro insertado',
  COUNT(*) as total,
  'Con puntualidad decimal permitido' as caracteristica
FROM puntuacion_grupal_diaria 
WHERE fecha = CURRENT_DATE AND jurado_id = (SELECT id FROM maestros WHERE nombre ILIKE '%emilio%' LIMIT 1);