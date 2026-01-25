// Fix classroom name using existing supabaseQueries
const { getClassroomIdByName } = require('../lib/supabaseQueries')

async function fixClassroomName() {
  console.log('🔧 Verificando nombres de salones...')
  
  try {
    // Get current mapping
    const vidaId = await getClassroomIdByName('vida')
    const luzId = await getClassroomIdByName('luz') 
    const graciaId = await getClassroomIdByName('gracia')
    const verdadId = await getClassroomIdByName('verdad')
    
    console.log('Salones encontrados:')
    console.log(`✅ Vida: ${vidaId}`)
    console.log(`✅ Luz: ${luzId}`)
    console.log(`✅ Gracia: ${graciaId}`)
    console.log(`⚠️  Verdad: ${verdadId} (necesita capitalización)`)
    
    console.log('\n📝 Para corregir "verdad" → "Verdad", ejecuta este SQL en Supabase:')
    console.log("UPDATE classrooms SET nombre = 'Verdad' WHERE id = '5272477b-26a4-4179-a276-1c4730238974';")
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixClassroomName()