// Test para verificar la estructura exacta de la tabla
// Ejecuta esto en la consola del navegador

async function verificarEstructuraTabla() {
  console.log('🔍 Verificando estructura exacta de la tabla...\n')
  
  try {
    // Intentar obtener SOLO los nombres de columna
    const { data: testData, error: testError } = await supabase
      .from('puntuacion_individual_diaria')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Error al acceder a tabla:', testError)
      return
    }
    
    if (testData && testData.length > 0) {
      const primerRegistro = testData[0]
      console.log('📋 Columnas encontradas:')
      console.log('   Campos del primer registro:', Object.keys(primerRegistro))
      
      console.log('\n🔍 Verificando campo alumno_id:')
      console.log('   ¿Tiene alumno_id?', 'alumno_id' in primerRegistro)
      console.log('   ¿Tiene id?', 'id' in primerRegistro)
      
      // Buscar el campo que contiene ID de alumno
      const camposID = Object.keys(primerRegistro).filter(key => 
        key.toLowerCase().includes('alumn') || key.toLowerCase().includes('id')
      )
      console.log('   Campos relacionados con ID:', camposID)
      
      console.log('\n📊 Registro completo:')
      console.log(JSON.stringify(primerRegistro, null, 2))
    } else {
      console.log('⚠️  No hay datos en la tabla')
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// También probar con diferentes nombres de campo
async function probarNombresCampo() {
  console.log('\n🧪 Probando diferentes nombres de campo...\n')
  
  const posiblesNombres = [
    'alumno_id',
    'alunno_id', 
    'aluno_id',
    'student_id',
    'id_alumno',
    'idalumno'
  ]
  
  for (const nombre of posiblesNombres) {
    try {
      console.log(`🔍 Probando: ${nombre}`)
      
      const { data, error } = await supabase
        .from('puntuacion_individual_diaria')
        .select(`${nombre}, id, fecha`)
        .limit(1)
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`)
      } else {
        console.log(`   ✅ Éxito con: ${nombre}`)
        console.log(`   Datos:`, data)
        return nombre // Encontramos el nombre correcto
      }
    } catch (err) {
      console.log(`   ❌ Error catch: ${err}`)
    }
  }
}

// Ejecutar pruebas
verificarEstructuraTabla()
probarNombresCampo()