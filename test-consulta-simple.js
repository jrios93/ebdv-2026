// Test simplificado para encontrar el problema exacto
async function testConsultaSimplificada() {
  console.log('🧪 Probando consulta simplificada...\n')

  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = monday.getDay()
  const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  monday.setDate(diff)

  const fechaInicio = monday.toISOString().split('T')[0]
  const fechaFin = today.toISOString().split('T')[0]

  console.log(`📅 Rango: ${fechaInicio} a ${fechaFin}`)

  // Paso 1: Prueba sin JOIN
  console.log('\n1️⃣  Probando consulta SIN JOIN...')
  try {
    const { data: dataSimple, error: errorSimple } = await supabase
      .from('puntuacion_individual_diaria')
      .select('*')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .limit(2)

    if (errorSimple) {
      console.error('❌ Error en consulta simple:', errorSimple)
      return
    }
    console.log('✅ Consulta simple OK:', dataSimple?.length, 'registros')
  } catch (err) {
    console.error('❌ Error catch consulta simple:', err)
    return
  }

  // Paso 2: Prueba con JOIN simple
  console.log('\n2️⃣  Probando consulta con JOIN simple...')
  try {
    const { data: dataJoin, error: errorJoin } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
            id,
            alumno_id,
            fecha,
            alumnos!inner(
              id,
              nombre,
              apellidos,
              edad,
              genero
            )
          `)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .limit(1)

    if (errorJoin) {
      console.error('❌ Error en JOIN simple:', errorJoin)
      console.error('   Detalles:', {
        message: errorJoin.message,
        details: errorJoin.details,
        hint: errorJoin.hint,
        code: errorJoin.code
      })
      return
    }
    console.log('✅ JOIN simple OK:', dataJoin?.length, 'registros')
    console.log('   Estructura:', JSON.stringify(dataJoin, null, 2))
  } catch (err) {
    console.error('❌ Error catch JOIN simple:', err)
    return
  }

  // Paso 3: Prueba con JOIN completo
  console.log('\n3️⃣  Probando consulta con JOIN completo...')
  try {
    const { data: dataFull, error: errorFull } = await supabase
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
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .limit(1)

    if (errorFull) {
      console.error('❌ Error en JOIN completo:', errorFull)
      console.error('   Detalles:', {
        message: errorFull.message,
        details: errorFull.details,
        hint: errorFull.hint,
        code: errorFull.code
      })
      return
    }
    console.log('✅ JOIN completo OK:', dataFull?.length, 'registros')
    console.log('   Estructura:', JSON.stringify(dataFull, null, 2))
  } catch (err) {
    console.error('❌ Error catch JOIN completo:', err)
    return
  }

  console.log('\n🎉 Todas las pruebas completadas!')
}

console.log('🚀 Ejecuta: testConsultaSimplificada()')
testConsultaSimplificada()
