// Script para probar la consulta a Supabase con el rango semanal
// Esto ayudará a identificar si el problema está en la consulta SQL

// Simular la consulta individual para estudiantes
async function testIndividualQuery() {
  console.log('🔍 Probando consulta de evaluaciones individuales...\n')
  
  // Usar el rango semanal corregido (hoy es domingo 26 de enero)
  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = monday.getDay()
  const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  monday.setDate(diff)
  
  const dataInicio = monday.toISOString().split('T')[0]
  const dataFim = today.toISOString().split('T')[0]
  
  console.log(`📅 Rango de fechas: ${dataInicio} a ${dataFim}`)
  console.log(`📊 Consultando tabla: puntuacion_individual_diaria\n`)
  
  // Simular consulta SQL que se ejecutaría
  const simulatedQuery = `
    SELECT 
      pi.*,
      a.id as alumno_id,
      a.nombre,
      a.apellidos,
      a.edad,
      a.genero,
      c.nombre as classroom_nombre
    FROM puntuacion_individual_diaria pi
    INNER JOIN alumnos a ON pi.alumno_id = a.id
    INNER JOIN classrooms c ON a.classroom_id = c.id
    WHERE pi.fecha >= '${dataInicio}' 
      AND pi.fecha <= '${dataFim}'
    ORDER BY pi.fecha, pi.alumno_id
  `
  
  console.log('📝 Consulta SQL equivalente:')
  console.log(simulatedQuery)
  console.log('')
  
  // Verificar posibles problemas
  console.log('⚠️  Posibles problemas a verificar:')
  console.log('   1. ¿Existe la tabla puntuacion_individual_diaria?')
  console.log('   2. ¿Existe la tabla alumnos?')
  console.log('   3. ¿Existe la tabla classrooms?')
  console.log('   4. ¿Las relaciones (foreign keys) están correctas?')
  console.log('   5. ¿Hay datos en el rango de fechas?')
  console.log('   6. ¿Los nombres de columnas coinciden?')
  console.log('')
  
  return { dataInicio, dataFim, simulatedQuery }
}

// Simular consulta grupal para salones
async function testGrupalQuery() {
  console.log('🔍 Probando consulta de evaluaciones grupales...\n')
  
  // Usar el mismo rango semanal
  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = monday.getDay()
  const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  monday.setDate(diff)
  
  const dataInicio = monday.toISOString().split('T')[0]
  const dataFim = today.toISOString().split('T')[0]
  
  console.log(`📅 Rango de fechas: ${dataInicio} a ${dataFim}`)
  console.log(`📊 Consultando tabla: puntuacion_grupal_diaria\n`)
  
  const simulatedQuery = `
    SELECT 
      pg.*,
      c.nombre as classroom_nombre
    FROM puntuacion_grupal_diaria pg
    INNER JOIN classrooms c ON pg.classroom_id = c.id
    WHERE pg.fecha >= '${dataInicio}' 
      AND pg.fecha <= '${dataFim}'
    ORDER BY pg.fecha, pg.classroom_id
  `
  
  console.log('📝 Consulta SQL equivalente:')
  console.log(simulatedQuery)
  console.log('')
  
  return { dataInicio, dataFim, simulatedQuery }
}

// Verificar estructura de interfaces
function verifyInterfaces() {
  console.log('🔍 Verificando estructura de interfaces TypeScript...\n')
  
  console.log('✅ EvaluacionIndividualRow esperada:')
  console.log(`   - id: string`)
  console.log(`   - aluno_id: string`)
  console.log(`   - fecha: string`)
  console.log(`   - actitud, puntualidad_asistencia, animo, trabajo_manual`)
  console.log(`   - verso_memoria, aprestamiento_biblico, invitados_hoy`)
  console.log(`   - alumnos: { id, nombre, apellidos, edad, genero, classrooms: { nombre } }`)
  console.log('')
  
  console.log('✅ EvaluacionGrupalRow esperada:')
  console.log(`   - id: string`)
  console.log(`   - classroom_id: string`)
  console.log(`   - fecha: string`)
  console.log(`   - puntualidad, animo_y_barras, orden, verso_memoria`)
  console.log(`   - preguntas_correctas`)
  console.log(`   - classrooms: { nombre }`)
  console.log('')
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando diagnóstico completo del sistema de exportación\n')
  console.log('=' .repeat(60))
  
  verifyInterfaces()
  
  console.log('=' .repeat(60))
  
  await testIndividualQuery()
  
  console.log('=' .repeat(60))
  
  await testGrupalQuery()
  
  console.log('=' .repeat(60))
  console.log('💡 Siguiente paso:')
  console.log('   Ejecuta estas consultas SQL directamente en tu base de datos')
  console.log('   para verificar si devuelven datos o si hay errores.')
  console.log('=' .repeat(60))
}

// Descomentar la siguiente línea para ejecutar
runAllTests()