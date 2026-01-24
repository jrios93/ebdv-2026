import { supabase } from '@/lib/supabase'

// Función temporal para debug
export async function debugClassroomSearch(nombre: string) {
  console.log("🔍 Buscando classroom:", nombre)
  
  // 1. Ver todos los classrooms
  const { data: allClassrooms, error: allError } = await supabase
    .from('classrooms')
    .select('*')
  
  console.log("📋 Todos los classrooms:", allClassrooms)
  console.log("❌ Error all:", allError)
  
  // 2. Buscar específico - case insensitive
  const { data: classroomArray, error: searchError } = await supabase
    .from('classrooms')
    .select('*')
    .ilike('nombre', nombre) // Case insensitive
  
  const classroom = classroomArray?.[0] || null
  
  console.log("🎯 Classroom encontrado:", classroom)
  console.log("📊 Array length:", classroomArray?.length || 0)
  console.log("❌ Error search:", searchError)
  
  // 3. Buscar sin single
  const { data: multiple, error: multiError } = await supabase
    .from('classrooms')
    .select('*')
    .eq('nombre', nombre)
  
  console.log("📝 Múltiples resultados:", multiple)
  console.log("❌ Error multiple:", multiError)
  
  return { allClassrooms, classroom, multiple, allError, searchError, multiError }
}

// Simplificar getClassroomIdByName
export async function getClassroomIdByName(nombre: string): Promise<string | null> {
  try {
    console.log("🔍 Buscando classroom ID para:", nombre)
    
    // Primero intentar coincidencia exacta
    const { data, error } = await supabase
      .from('classrooms')
      .select('id')
      .eq('nombre', nombre)
      .maybeSingle()

    if (error) {
      console.log("❌ Error exact:", error)
      
      // Si falla, buscar sin single para ver qué hay
      const { data: allClassrooms } = await supabase
        .from('classrooms')
        .select('id, nombre')
      
      console.log("📋 Todos disponibles:", allClassrooms)
      
      // Buscar coincidencia exacta de los datos reales
      const found = allClassrooms?.find(c => 
        c.nombre.toLowerCase() === nombre.toLowerCase()
      )
      
      if (found) {
        console.log("✅ Encontrado con case-insensitive:", found)
        return found.id
      }
      
      throw error
    }
    
    console.log("✅ Encontrado:", data)
    return data?.id || null
  } catch (error) {
    console.error('Error en getClassroomIdByName:', error)
    return null
  }
}