// Test simple de exportación para identificar el error exacto
// Copia y pega esto en la consola del navegador en la página admin

async function testExportStepByStep() {
  console.log('🚀 Iniciando test paso a paso de exportación...\n')
  
  // Paso 1: Verificar conexión a Supabase
  console.log('Paso 1: Verificando conexión a Supabase...')
  try {
    const { data: connectionTest, error: connectionError } = await supabase
      .from('alumnos')
      .select('id')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Error de conexión:', connectionError)
      return
    }
    console.log('✅ Conexión a Supabase OK')
  } catch (err) {
    console.error('❌ Error crítico de conexión:', err)
    return
  }
  
  // Paso 2: Verificar tabla puntuacion_individual_diaria
  console.log('\nPaso 2: Verificando tabla puntuacion_individual_diaria...')
  try {
    const { data: tableTest, error: tableError } = await supabase
      .from('puntuacion_individual_diaria')
      .select('id, fecha')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Error tabla puntuacion_individual_diaria:', tableError)
      return
    }
    console.log('✅ Tabla puntuacion_individual_diaria existe')
    console.log(`   Muestra:`, tableTest)
  } catch (err) {
    console.error('❌ Error al acceder a tabla:', err)
    return
  }
  
  // Paso 3: Verificar rango de fechas
  console.log('\nPaso 3: Verificando rango de fechas...')
  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = monday.getDay()
  const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  monday.setDate(diff)
  
  const dataInicio = monday.toISOString().split('T')[0]
  const dataFim = today.toISOString().split('T')[0]
  
  console.log(`   Rango: ${dataInicio} a ${dataFim}`)
  
  // Paso 4: Verificar consulta simple
  console.log('\nPaso 4: Verificando consulta simple...')
  try {
    const { data: simpleQuery, error: simpleError } = await supabase
      .from('puntuacion_individual_diaria')
      .select('*')
      .gte('fecha', dataInicio)
      .lte('fecha', dataFim)
    
    if (simpleError) {
      console.error('❌ Error en consulta simple:', simpleError)
      return
    }
    console.log(`✅ Consulta simple exitosa (${simpleQuery?.length || 0} registros)`)
  } catch (err) {
    console.error('❌ Error en consulta simple:', err)
    return
  }
  
  // Paso 5: Verificar consulta con JOIN
  console.log('\nPaso 5: Verificando consulta con JOIN...')
  try {
    const { data: joinQuery, error: joinError } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
        *,
        alumnos!inner(
          id,
          nombre,
          apellidos,
          edad,
          genero,
          classrooms!classroom_id(nombre)
        )
      `)
      .gte('fecha', dataInicio)
      .lte('fecha', dataFim)
    
    if (joinError) {
      console.error('❌ Error en consulta con JOIN:', joinError)
      console.error('   Detalles:', {
        message: joinError.message,
        details: joinError.details,
        hint: joinError.hint
      })
      return
    }
    console.log(`✅ Consulta con JOIN exitosa (${joinQuery?.length || 0} registros)`)
    
    if (joinQuery && joinQuery.length > 0) {
      console.log('   Primer registro:', joinQuery[0])
    }
  } catch (err) {
    console.error('❌ Error en consulta con JOIN:', err)
    return
  }
  
  // Paso 6: Verificar procesamiento de datos
  console.log('\nPaso 6: Verificando procesamiento de datos...')
  try {
    const { data: processData, error: processError } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
        *,
        alumnos!inner(
          id,
          nombre,
          apellidos,
          edad,
          genero,
          classrooms!classroom_id(nombre)
        )
      `)
      .gte('fecha', dataInicio)
      .lte('fecha', dataFim)
    
    if (processError) throw processError
    
    if (!processData || processData.length === 0) {
      console.log('⚠️  No hay datos para procesar en el rango de fechas')
      return
    }
    
    console.log(`✅ Iniciando procesamiento de ${processData.length} registros...`)
    
    const alunosMap = new Map()
    
    processData.forEach((avaliacao, index) => {
      console.log(`   Procesando registro ${index + 1}:`, {
        id: avaliacao.id,
        aluno_id: avaliacao.aluno_id,
        hasAlunos: !!avaliacao.alunos,
        nombre: avaliacao.alumnos?.nombre
      })
      
      if (!avaliacao.alunos) {
        console.error('❌ Registro sin datos de alumno:', avaliacao)
        return
      }
      
      const alunoId = avaliacao.aluno_id
      
      if (!alunosMap.has(alunoId)) {
        alunosMap.set(alunoId, {
          id: alunoId,
          nome: avaliacao.alumnos.nombre,
          apellidos: avaliacao.alumnos.apellidos,
          idade: avaliacao.alumnos.edad,
          genero: avaliacao.alumnos.genero,
          sala: avaliacao.alumnos.classrooms.nombre,
          avaliacoes: [],
          total_semanal: 0,
          promedio_diario: 0,
          dias_avaliados: 0,
          data_primeira_avaliacao: avaliacao.fecha,
          hora_primeira_avaliacao: ''
        })
      }
    })
    
    console.log(`✅ Procesamiento completado. ${alunosMap.size} alumnos únicos`)
    
  } catch (err) {
    console.error('❌ Error en procesamiento:', err)
    return
  }
  
  console.log('\n🎉 Todos los pasos completados exitosamente!')
  console.log('💡 Si este test pasa, el problema está en la generación del archivo Excel')
}

// Ejecutar el test
console.log('📋 Instrucciones:')
console.log('1. Abre la página de admin en tu navegador')
console.log('2. Abre las herramientas de desarrollador (F12)')
console.log('3. Pega y ejecuta esta función')
console.log('4. Llama a testExportStepByStep()')
console.log('\n🚀 Listo para ejecutar: testExportStepByStep()')

// La función está lista para ser ejecutada
typeof testExportStepByStep !== 'undefined' && console.log('\n✅ Función de test cargada correctamente')