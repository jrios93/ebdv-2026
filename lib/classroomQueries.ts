import { supabase } from '@/lib/supabase'

// Función para obtener el ID de un classroom por su nombre
export async function getClassroomIdByName(classroomName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('classrooms')
      .select('id')
      .eq('nombre', classroomName.charAt(0).toUpperCase() + classroomName.slice(1))
      .single()
    
    if (error) {
      console.error('Error obteniendo classroom ID:', error)
      return null
    }
    
    return data?.id || null
  } catch (error) {
    console.error('Error en getClassroomIdByName:', error)
    return null
  }
}

// Función para obtener todos los classrooms con sus IDs
export async function getAllClassrooms(): Promise<Array<{id: string, nombre: string}>> {
  try {
    const { data, error } = await supabase
      .from('classrooms')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre')
    
    if (error) {
      console.error('Error obteniendo classrooms:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error en getAllClassrooms:', error)
    return []
  }
}

// Función para obtener información completa de un classroom
export async function getClassroomInfo(classroomId: string) {
  try {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', classroomId)
      .single()
    
    if (error) {
      console.error('Error obteniendo classroom info:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error en getClassroomInfo:', error)
    return null
  }
}