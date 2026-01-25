"use server"

import { projectSchema } from "@/schemas/project"
import { supabase } from "@/lib/supabase"
import z from "zod"

export async function createProject(unsafeData: z.infer<typeof projectSchema>) {
  const data = projectSchema.safeParse(unsafeData)
  if (!data.success) return { success: false, error: "Datos inválidos" }

  try {
    // Obtener classroom_id basado en el nombre del classroom
    const { data: classroomData, error: classroomError } = await supabase
      .from('classrooms')
      .select('id')
      .eq('nombre', data.data.classroom)
      .single()

    if (classroomError || !classroomData) {
      return { success: false, error: `Classroom "${data.data.classroom}" no encontrado` }
    }

    // Verificar si el alumno ya existe (búsqueda más flexible)
    const { data: existingAlumnos, error: checkError } = await supabase
      .from('alumnos')
      .select('id, nombre, apellidos, telefono, edad')
      .or(`nombre.ilike.%${data.data.childName}%,apellidos.ilike.%${data.data.childLastname}%,telefono.eq.${data.data.parentPhone}`)
      .eq('edad', data.data.age)

    if (checkError) {
      return { success: false, error: "Error al verificar datos del alumno" }
    }

    // Verificar coincidencias exactas o muy similares
    const exactMatch = existingAlumnos?.find(alumno => 
      (alumno.nombre.toLowerCase().trim() === data.data.childName.toLowerCase().trim() &&
       alumno.apellidos.toLowerCase().trim() === data.data.childLastname.toLowerCase().trim()) ||
      alumno.telefono === data.data.parentPhone
    )

    if (exactMatch) {
      return { success: false, error: "⚠️ Este alumno ya está registrado. Si crees que es un error, contacta al administrador." }
    }

    // Insertar en tabla alumnos
    const insertData: any = {
      nombre: data.data.childName,
      apellidos: data.data.childLastname,
      edad: data.data.age,
      genero: data.data.gender,
      nombre_padre: data.data.parentName,
      telefono: data.data.parentPhone,
      classroom_id: classroomData.id
    }
    
    // Solo incluir telefono_niño si no es undefined
    if (data.data.childPhone !== undefined) {
      insertData.telefono_niño = data.data.childPhone
    }
    
    const { error: insertError } = await supabase
      .from('alumnos')
      .insert(insertData)

    if (insertError) {
      return { success: false, error: "Error al guardar en la base de datos" }
    }

    return { success: true, classroom: data.data.classroom }
    
  } catch (error) {
    console.error('Error en createProject:', error)
    return { 
      success: false, 
      error: "Error de conexión. Por favor intenta de nuevo." 
    }
  }
}
