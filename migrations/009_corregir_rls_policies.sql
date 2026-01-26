-- ========================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA JURADOS
-- ========================================

-- 1. Eliminar políticas existentes que causan problemas
DROP POLICY IF EXISTS "Jurados pueden ver evaluaciones" ON puntuacion_grupal_diaria;
DROP POLICY IF EXISTS "Jurados pueden insertar sus evaluaciones" ON puntuacion_grupal_diaria;
DROP POLICY IF EXISTS "Jurados pueden actualizar sus evaluaciones" ON puntuacion_grupal_diaria;

-- 2. Crear políticas más permisivas para desarrollo
CREATE POLICY "Allow all operations on puntuacion_grupal_diaria" ON puntuacion_grupal_diaria
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Asegurar que la tabla tenga RLS habilitado
ALTER TABLE puntuacion_grupal_diaria ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para maestros (si son necesarias)
CREATE POLICY "Allow all on maestros" ON maestros
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on classrooms" ON classrooms
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Verificar políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('puntuacion_grupal_diaria', 'maestros', 'classrooms')
ORDER BY tablename, policyname;

-- 6. Probar inserción simple
INSERT INTO puntuacion_grupal_diaria (
  classroom_id, 
  jurado_id, 
  fecha, 
  puntualidad, 
  animo_y_barras, 
  orden, 
  verso_memoria, 
  preguntas_correctas
) VALUES (
  (SELECT id FROM classrooms WHERE nombre = 'Vida' LIMIT 1),
  (SELECT id FROM maestros WHERE rol = 'jurado' LIMIT 1),
  CURRENT_DATE,
  75,
  20,
  20,
  20,
  25
) ON CONFLICT (classroom_id, fecha, jurado_id) DO NOTHING;