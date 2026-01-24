import { supabase } from '@/lib/supabase'

export async function getAlumnosByClassroomId(classroomId: string) {
  console.log("🔍 Buscando alumnos para classroom ID:", classroomId)
  
  const { data, error } = await supabase
    .from('alumnos')
    .select('*')
    .eq('classroom_id', classroomId)
    .eq('activo', true)

  console.log("👦 Alumnos encontrados:", data?.length || 0)
  console.log("❌ Error:", error)
  
  if (error) {
    console.error("Full error:", error)
  }
  
  return data || []
}

// Test directo
export async function testDirectQuery() {
  const classroomId = "eda65bd9-dadd-4f74-954e-b952a91845a3" // ID de Vida
  
  const results = await getAlumnosByClassroomId(classroomId)
  return results
}