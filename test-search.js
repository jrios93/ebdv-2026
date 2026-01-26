// Prueba simple de búsqueda
import { supabase } from '../lib/supabase'

async function testSearch() {
  console.log('🧪 Probando búsqueda simple...')
  
  // 1. Buscar sin filtros (debe traer todos)
  console.log('\n--- 1. Búsqueda sin filtros ---')
  const { data: allData, error: allError } = await supabase
    .from('alumnos')
    .select('*')
    .eq('activo', true)
    .limit(5)
  
  if (allError) {
    console.error('❌ Error sin filtros:', allError)
  } else {
    console.log('✅ Datos sin filtros:', allData?.length, 'alumnos')
    if (allData && allData.length > 0) {
      console.log('📋 Primer alumno:', allData[0])
    }
  }
  
  // 2. Buscar por nombre específico
  console.log('\n--- 2. Búsqueda por nombre "Daniela" ---')
  const { data: nameData, error: nameError } = await supabase
    .from('alumnos')
    .select('*')
    .eq('activo', true)
    .ilike('nombre', '%Daniela%')
    .limit(5)
  
  if (nameError) {
    console.error('❌ Error buscando por nombre:', nameError)
  } else {
    console.log('✅ Datos por nombre:', nameData?.length, 'alumnos')
    console.log('📋 Resultados:', nameData)
  }
  
  // 3. Buscar por OR con condiciones múltiples
  console.log('\n--- 3. Búsqueda con OR "Daniela" ---')
  const { data: orData, error: orError } = await supabase
    .from('alumnos')
    .select('*')
    .eq('activo', true)
    .or('nombre.ilike.%Daniela%,apellidos.ilike.%Daniela%')
    .limit(5)
  
  if (orError) {
    console.error('❌ Error con OR:', orError)
  } else {
    console.log('✅ Datos con OR:', orData?.length, 'alumnos')
    console.log('📋 Resultados OR:', orData)
  }
  
  // 4. Buscar por término "Ma" 
  console.log('\n--- 4. Búsqueda con OR "Ma" ---')
  const { data: maData, error: maError } = await supabase
    .from('alumnos')
    .select('*')
    .eq('activo', true)
    .or('nombre.ilike.%Ma%,apellidos.ilike.%Ma%')
    .limit(5)
  
  if (maError) {
    console.error('❌ Error con "Ma":', maError)
  } else {
    console.log('✅ Datos con "Ma":', maData?.length, 'alumnos')
    console.log('📋 Resultados "Ma":', maData?.map(a => ({
      nombre: a.nombre,
      apellidos: a.apellidos
    })))
  }
}

testSearch().catch(console.error)