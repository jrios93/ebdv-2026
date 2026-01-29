import { supabase } from '@/lib/supabase'
import { getFechaHoyPeru } from '@/lib/date/config'
import { getRankingInvitados } from '@/lib/invitados'

// Tipos basados en tu documentación
export interface Alumno {
  id: string
  nombre: string
  apellidos: string
  edad: number
  genero: 'niño' | 'niña'
  nombre_padre: string
  telefono: string
  classroom_id: string
  activo: boolean
  fecha_inscripcion: string
  classroom_forzado_id?: string | null
}

export interface Classroom {
  id: string
  nombre: string
  descripcion?: string
}

export interface PuntuacionIndividualDiaria {
  id: string
  alumno_id: string
  fecha: string
  actitud: number
  puntualidad_asistencia: number
  animo: number
  trabajo_manual: number
  verso_memoria: number
  aprestamiento_biblico: number
  invitados_hoy: number
  maestro_registro_id: string
  created_at: string
}

export interface PuntuacionGrupalDiaria {
  id: string
  classroom_id: string
  fecha: string
  puntualidad: number  // Ahora puede ser decimal (0, 2.5, 5, 7.5, 10)
  animo_y_barras: number
  orden: number
  verso_memoria: number
  preguntas_correctas: number
  jurado_id?: string
  created_at: string
}

export interface PuntajePorDiaYSalon {
  fecha: string
  salon: string
  color: string
  jurados_evaluaron: number
  puntaje_promedio: number
}

export interface Maestro {
  id: string
  nombre: string
  rol: 'maestro' | 'jurado' | 'admin'
  classroom_id?: string | null
}

// Funciones para alumnos
export async function getAlumnosByClassroom(classroomId: string): Promise<Alumno[]> {
  try {
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('classroom_id', classroomId)
      .eq('activo', true)
      .order('apellidos, nombre')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching alumnos:', error)
    return []
  }
}

export async function getAlumnoById(id: string): Promise<Alumno | null> {
  try {
    // Simplificar consulta sin relaciones problemáticas
    const { data, error } = await supabase
      .from('alumnos')
      .select(`
        id,
        nombre,
        apellidos,
        edad,
        genero,
        nombre_padre,
        telefono,
        classroom_id,
        activo,
        fecha_inscripcion
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching alumno:', error)
      return null
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching alumno:', error)
    return null
  }
}

// Funciones para classrooms
export async function getClassroomByName(nombre: string): Promise<Classroom | null> {
  try {
    const { data: classroomArray, error } = await supabase
      .from('classrooms')
      .select('*')
      .ilike('nombre', nombre) // Case insensitive

    if (error) throw error
    return classroomArray?.[0] || null
  } catch (error) {
    console.error('Error fetching classroom:', error)
    return null
  }
}

export async function getAllClassrooms(): Promise<Classroom[]> {
  try {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .order('nombre')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching classrooms:', error)
    return []
  }
}

// Funciones para puntuación individual
export async function savePuntuacionIndividual(
  puntuacion: Omit<PuntuacionIndividualDiaria, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('puntuacion_individual_diaria')
      .insert(puntuacion)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving puntuacion individual:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return false
  }
}

export async function updatePuntuacionIndividual(
  id: string,
  puntuacion: Partial<PuntuacionIndividualDiaria>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('puntuacion_individual_diaria')
      .update(puntuacion)
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating puntuacion individual:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return false
  }
}

export async function getPuntuacionIndividualHoy(
  alumnoId: string,
  fecha: string = new Date().toISOString().split('T')[0]
): Promise<PuntuacionIndividualDiaria | null> {
  try {
    const { data, error } = await supabase
      .from('puntuacion_individual_diaria')
      .select('*')
      .eq('alumno_id', alumnoId)
      .eq('fecha', fecha)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Error fetching puntuacion individual:', error)
    return null
  }
}

// Funciones para puntuación grupal
export async function savePuntuacionGrupal(
  puntuacion: Omit<PuntuacionGrupalDiaria, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Primero verificar si ya existe un registro para este classroom y fecha
    const { data: existingRecord, error: checkError } = await supabase
      .from('puntuacion_grupal_diaria')
      .select('id')
      .eq('classroom_id', puntuacion.classroom_id)
      .eq('fecha', puntuacion.fecha)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    let result;
    if (existingRecord) {
      // Si existe, actualizar
      result = await supabase
        .from('puntuacion_grupal_diaria')
        .update(puntuacion)
        .eq('id', existingRecord.id)
    } else {
      // Si no existe, insertar
      result = await supabase
        .from('puntuacion_grupal_diaria')
        .insert(puntuacion)
    }

    if (result.error) throw result.error
    return true
  } catch (error) {
    console.error('Error saving puntuacion grupal:', error)
    return false
  }
}

// Funciones de estadísticas para el admin
export async function getStatsDashboard(): Promise<{
  totalAlumnos: number
  evaluacionesHoy: number
  totalHoy: number
  mejorClassroom: string | null
  puntualidadAsistencia: number
}> {
  try {
    const today = getFechaHoyPeru()

    // Total alumnos activos
    const { count: totalAlumnos } = await supabase
      .from('alumnos')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true)

    // Evaluaciones individuales hoy
    const { count: evaluacionesHoy } = await supabase
      .from('puntuacion_individual_diaria')
      .select('*', { count: 'exact', head: true })
      .eq('fecha', today)

    // Promedio de puntualidad y asistencia hoy
    const { data: puntualidadData } = await supabase
      .from('puntuacion_individual_diaria')
      .select('puntualidad_asistencia')
      .eq('fecha', today)

    const puntualidadAsistencia = puntualidadData && puntualidadData.length > 0
      ? puntualidadData.reduce((sum, p) => sum + p.puntualidad_asistencia, 0) / puntualidadData.length
      : 0

    // Calcular mejor classroom (basado en evaluaciones grupales)
    const { data: grupalesHoy } = await supabase
      .from('v_promedios_diarios')
      .select(`
        classroom_nombre,
        puntaje_total_promedio,
        estado
      `)
      .eq('fecha', today)
    // Mostrar todos los salones evaluados hoy (completado + en_progreso)

    let mejorClassroom = null
    if (grupalesHoy && grupalesHoy.length > 0) {
      const scores = grupalesHoy.reduce((acc, grupal: any) => {
        acc[grupal.classroom_nombre] = grupal.puntaje_total_promedio
        return acc
      }, {} as Record<string, number>)

      mejorClassroom = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0]
    }

    return {
      totalAlumnos: totalAlumnos || 0,
      evaluacionesHoy: evaluacionesHoy || 0,
      totalHoy: puntualidadData?.length || 0,
      mejorClassroom,
      puntualidadAsistencia: Math.round(puntualidadAsistencia * 10) / 10
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    return {
      totalAlumnos: 0,
      evaluacionesHoy: 0,
      totalHoy: 0,
      mejorClassroom: null,
      puntualidadAsistencia: 0
    }
  }
}

export async function getTopAlumnosToday(limit: number = 5): Promise<Array<{
  alumno: Alumno
  totalPuntos: number
  evaluacion: PuntuacionIndividualDiaria
}> | null> {
  try {
    const today = getFechaHoyPeru()
    console.log('🔍 Buscando top alumnos para fecha:', today)

    const { data, error } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
        *,
        alumnos!inner(
          id,
          nombre,
          apellidos,
          classroom_id,
          classroom_forzado_id,
          classrooms!classroom_id(nombre)
        )
      `)
      .eq('fecha', today)
      .order('creado_el', { ascending: false })

    if (error) {
      console.error('❌ Error en consulta top alumnos:', error)
      throw error
    }

    console.log('📊 Datos top alumnos encontrados:', data)

    if (!data || data.length === 0) {
      console.log('📭 No hay evaluaciones hoy')
      return null
    }

    // Calcular puntos totales y ordenar
    const alumnosConPuntos = data.map(item => {
      const total = item.actitud + item.puntualidad_asistencia + item.animo +
        item.trabajo_manual + item.verso_memoria + item.aprestamiento_biblico
      return {
        alumno: {
          id: item.alumnos.id,
          nombre: item.alumnos.nombre,
          apellidos: item.alumnos.apellidos,
          edad: 0, // placeholder
          genero: 'niño' as const, // placeholder
          nombre_padre: '',
          telefono: '',
          classroom_id: item.alumnos.classroom_id,
          activo: true,
          fecha_inscripcion: ''
        },
        totalPuntos: total,
        evaluacion: item
      }
    }).sort((a, b) => b.totalPuntos - a.totalPuntos)

    return alumnosConPuntos.slice(0, limit)
  } catch (error) {
    console.error('Error getting top alumnos:', error)
    return null
  }
}

export async function getTopInvitadosToday(limit: number = 3): Promise<Array<{
  alumno: Alumno
  invitados: number
}> | null> {
  try {
    const today = getFechaHoyPeru()
    console.log('📋 Buscando invitados para fecha:', today)

    const { data, error } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
        invitados_hoy,
        alumnos!inner(
          id,
          nombre,
          apellidos,
          classroom_id,
          classroom_forzado_id,
          classrooms!classroom_id(nombre)
        )
      `)
      .eq('fecha', today)
      .gt('invitados_hoy', 0)
      .order('invitados_hoy', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error en consulta invitados:', error)
      throw error
    }

    console.log('📊 Datos invitados encontrados:', data)

    if (!data || data.length === 0) {
      console.log('📭 No hay invitados hoy')
      return null
    }

    const result = data.map((item: any) => ({
      alumno: {
        id: item.alumnos.id,
        nombre: item.alumnos.nombre,
        apellidos: item.alumnos.apellidos,
        edad: 0, // placeholder
        genero: 'niño' as const, // placeholder
        nombre_padre: '',
        telefono: '',
        classroom_id: item.alumnos.classroom_id,
        activo: true,
        fecha_inscripcion: ''
      },
      invitados: item.invitados_hoy
    }))

    console.log('✅ Resultado procesado:', result)
    return result
  } catch (error) {
    console.error('Error getting top invitados:', error)
    return null
  }
}

// Funciones para exportar a Excel
export async function getAllEvaluacionesToday(): Promise<Array<{
  alumno: string
  salon: string
  actitud: number
  puntualidad_asistencia: number
  animo: number
  trabajo_manual: number
  verso_memoria: number
  aprestamiento_biblico: number
  invitados_hoy: number
  total_puntos: number
}> | null> {
  try {
    const today = getFechaHoyPeru()
    console.log('🔍 Buscando todas las evaluaciones para exportar, fecha:', today)

    const { data, error } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
        actitud,
        puntualidad_asistencia,
        animo,
        trabajo_manual,
        verso_memoria,
        aprestamiento_biblico,
        invitados_hoy,
        alumnos!inner(
          nombre,
          apellidos,
          classroom_id,
          classroom_forzado_id,
          classrooms!classroom_id(nombre)
        )
      `)
      .eq('fecha', today)

    if (error) {
      console.error('❌ Error en consulta todas evaluaciones:', error)
      throw error
    }

    console.log('📊 Todas las evaluaciones encontradas:', data)

    if (!data || data.length === 0) {
      console.log('📭 No hay evaluaciones para exportar')
      return null
    }

    return data.map((item: any) => {
      const total = item.actitud + item.puntualidad_asistencia + item.animo +
        item.trabajo_manual + item.verso_memoria + item.aprestamiento_biblico
      return {
        alumno: `${item.alumnos.nombre} ${item.alumnos.apellidos}`,
        salon: item.alumnos.classrooms.nombre,
        actitud: item.actitud,
        puntualidad_asistencia: item.puntualidad_asistencia,
        animo: item.animo,
        trabajo_manual: item.trabajo_manual,
        verso_memoria: item.verso_memoria,
        aprestamiento_biblico: item.aprestamiento_biblico,
        invitados_hoy: item.invitados_hoy,
        total_puntos: total
      }
    })
  } catch (error) {
    console.error('Error getting all evaluaciones:', error)
    return null
  }
}

export async function reasignarAlumnoASalon(
  alumnoId: string,
  nuevoClassroomId: string,
  esForzado: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('alumnos')
      .update({
        [esForzado ? 'classroom_forzado_id' : 'classroom_id']: nuevoClassroomId
      })
      .eq('id', alumnoId)

    if (error) {
      console.error('Error reasignando alumno:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error reasignando alumno:', error)
    return { success: false, error: 'Error al reasignar alumno' }
  }
}



export async function buscarAlumnosPorNombreONombrePadre(
  termino: string
): Promise<Array<Alumno> | null> {
  try {
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .or(`nombre.ilike.%${termino}%,apellidos.ilike.%${termino}%,nombre_padre.ilike.%${termino}%`)
      .eq('activo', true)
      .order('nombre')
      .limit(20)

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Error searching alumnos:', error)
    return null
  }
}

export async function getAllSalonesEvaluadosToday(): Promise<Array<{
  salon: string
  puntualidad: number
  animo_y_barras: number
  orden: number
  verso_memoria: number
  preguntas_correctas: number
  total_puntos: number
  evaluado: boolean
}> | null> {
  try {
    const today = getFechaHoyPeru()

    // Obtener todos los salones
    const { data: allClassrooms } = await supabase
      .from('classrooms')
      .select('id, nombre')
      .eq('activo', true)

    if (!allClassrooms) return null

    // Obtener evaluaciones grupales
    const { data: grupalesData } = await supabase
      .from('puntuacion_grupal_diaria')
      .select('*')
      .eq('fecha', today)

    return allClassrooms.map((classroom: any) => {
      const evaluacion = grupalesData?.find((g: any) => g.classroom_id === classroom.id)
      const total = evaluacion ?
        evaluacion.puntualidad + evaluacion.animo_y_barras +
        evaluacion.orden + evaluacion.verso_memoria + evaluacion.preguntas_correctas
        : 0

      return {
        salon: classroom.nombre,
        puntualidad: evaluacion?.puntualidad || 0,
        animo_y_barras: evaluacion?.animo_y_barras || 0,
        orden: evaluacion?.orden || 0,
        verso_memoria: evaluacion?.verso_memoria || 0,
        preguntas_correctas: evaluacion?.preguntas_correctas || 0,
        preguntas: evaluacion?.preguntas_correctas || 0,
        total_puntos: total,
        evaluado: !!evaluacion
      }
    })
  } catch (error) {
    console.error('Error getting all salones evaluados:', error)
    return null
  }
}

export async function getClassroomRankingToday(): Promise<Array<{
  classroom: string
  totalPuntos: number
  evaluaciones: number
}> | null> {
  try {
    const today = getFechaHoyPeru()

    const { data, error } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
        *,
        alumnos!inner(classroom_id, classrooms!classroom_id(nombre))
      `)
      .eq('fecha', today)

    if (error) throw error

    if (!data || data.length === 0) return null

    // Agrupar por classroom
    const classroomScores = data.reduce((acc, item: any) => {
      const classroomName = item.alumnos.classrooms.nombre
      const total = item.actitud + item.puntualidad_asistencia + item.animo +
        item.trabajo_manual + item.verso_memoria + item.aprestamiento_biblico

      if (!acc[classroomName]) {
        acc[classroomName] = { total: 0, count: 0 }
      }
      acc[classroomName].total += total
      acc[classroomName].count += 1

      return acc
    }, {} as Record<string, { total: number; count: number }>)

    // Definir todos los salones existentes
    const allClassrooms = ['vida', 'luz', 'gracia', 'verdad']

    // Convertir a array y asegurar que todos los salones estén presentes
    const ranking = allClassrooms.map(classroom => ({
      classroom,
      totalPuntos: classroomScores[classroom]?.total || 0,
      evaluaciones: classroomScores[classroom]?.count || 0
    }))
      .sort((a, b) => b.totalPuntos - a.totalPuntos)

    console.log('📊 Ranking de salones hoy:', ranking)

    return ranking
  } catch (error) {
    console.error('Error getting classroom ranking:', error)
    return null
  }
}

export async function getPuntuacionGrupalHoy(
  classroomId: string,
  fecha: string = new Date().toISOString().split('T')[0]
): Promise<PuntuacionGrupalDiaria | null> {
  try {
    const { data, error } = await supabase
      .from('puntuacion_grupal_diaria')
      .select('*')
      .eq('classroom_id', classroomId)
      .eq('fecha', fecha)
      .maybeSingle()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching puntuacion grupal:', error)
    return null
  }
}

// Funciones para rankings (usando tus vistas)
export async function getRankingIndividual(limit: number = 20): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('v_ranking_individual')
      .select('*')
      .order('puntaje_total', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching ranking individual:', error)
    return []
  }
}

export async function getRankingGrupal(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('v_ranking_grupal')
      .select('*')
      .order('puntaje_total', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching ranking grupal:', error)
    return []
  }
}

// Funciones de utilidad
export async function getClassroomIdByName(nombre: string): Promise<string | null> {
  try {
    // Lista hardcoded con los IDs reales de tu DB
    const classroomIds: Record<string, string> = {
      vida: "eda65bd9-dadd-4f74-954e-b952a91845a3",
      luz: "d863c43d-9b83-494a-a88b-c3973a31bfd7",
      gracia: "9b8a58b3-6356-4b75-b28b-d5f5d8e596fd",
      verdad: "5272477b-26a4-4179-a276-1c4730238974"
    }

    const id = classroomIds[nombre.toLowerCase()]
    console.log(`🎯getClassroomIdByName: ${nombre} → ${id}`)

    return id || null
  } catch (error) {
    console.error('Error getting classroom ID by name:', error)
    return null
  }
}

export async function getStatsGenerales(): Promise<{
  totalAlumnos: number
  totalEvaluacionesHoy: number
  totalPuntuacionesGrupalHoy: number
  evaluadosHoy: number
}> {
  const today = new Date().toISOString().split('T')[0]

  try {
    // Total alumnos activos
    const { count: totalAlumnos } = await supabase
      .from('alumnos')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true)

    // Evaluaciones individuales hoy
    const { count: totalEvaluacionesHoy } = await supabase
      .from('puntuacion_individual_diaria')
      .select('*', { count: 'exact', head: true })
      .eq('fecha', today)

    // Puntuaciones grupales hoy
    const { count: totalPuntuacionesGrupalHoy } = await supabase
      .from('puntuacion_grupal_diaria')
      .select('*', { count: 'exact', head: true })
      .eq('fecha', today)

    // Alumnos únicos evaluados hoy
    const { data: evaluadosUnicos } = await supabase
      .from('puntuacion_individual_diaria')
      .select('alumno_id')
      .eq('fecha', today)

    const evaluadosHoy = evaluadosUnicos ?
      new Set(evaluadosUnicos.map(e => e.alumno_id)).size : 0

    return {
      totalAlumnos: totalAlumnos || 0,
      totalEvaluacionesHoy: totalEvaluacionesHoy || 0,
      totalPuntuacionesGrupalHoy: totalPuntuacionesGrupalHoy || 0,
      evaluadosHoy
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      totalAlumnos: 0,
      totalEvaluacionesHoy: 0,
      totalPuntuacionesGrupalHoy: 0,
      evaluadosHoy: 0
    }
  }
}

export async function getAlumnosPorSalon(): Promise<Array<{
  salon: string
  cantidad: number
  asistidos: number
}> | null> {
  try {
    const today = getFechaHoyPeru()

    // Primero, encontrar el último día con evaluaciones (puede ser hoy o ayer)
    const { data: diasConEvaluaciones, error: diasError } = await supabase
      .from('puntuacion_individual_diaria')
      .select('fecha')
      .gte('fecha', '2026-01-25') // Últimos días
      .order('fecha', { ascending: false })
      .limit(1)

    if (diasError) throw diasError

    // Usar el último día con evaluaciones, si no hay datos usar hoy
    const fechaConDatos = diasConEvaluaciones && diasConEvaluaciones.length > 0
      ? diasConEvaluaciones[0].fecha
      : today

    // Obtener todos los alumnos activos
    const { data: alumnos, error: errorAlumnos } = await supabase
      .from('alumnos')
      .select(`
        id,
        classrooms!classroom_id(nombre)
      `)
      .eq('activo', true)

    if (errorAlumnos) throw errorAlumnos

    // Obtener evaluaciones del día con datos para ver quiénes asistieron
    // SOLO se considera asistencia si puntualidad_asistencia > 0
    const { data: evaluacionesHoy, error: evaluacionesError } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
        alumno_id
      `)
      .eq('fecha', fechaConDatos) // Usar el día que realmente tiene datos
      .gt('puntualidad_asistencia', 0) // Solo quienes tienen puntualidad > 0

    if (evaluacionesError) throw evaluacionesError

    // DEBUG: Mostrar qué está pasando
    console.log('🔍 DEBUG - getAlumnosPorSalon():')
    console.log('📅 Fecha Usando:', fechaConDatos)
    console.log('📝 Total con Asistencia Real (>0):', evaluacionesHoy?.length)
    console.log('👥 Alumnos con Puntualidad > 0 Hoy:', Array.from(new Set(evaluacionesHoy?.map(e => e.alumno_id))))

    // Crear set de IDs de alumnos que REALMENTE asistieron hoy (puntualidad_asistencia > 0)
    const asistenciasSet = new Set(evaluacionesHoy?.map(e => e.alumno_id) || [])

    // Agrupar por salón y contar tanto inscritos como asistidos
    const conteo = alumnos?.reduce((acc: Record<string, { inscritos: number, asistidos: number }>, alumno: any) => {
      const salon = alumno.classrooms?.nombre || 'Sin asignar'

      if (!acc[salon]) {
        acc[salon] = { inscritos: 0, asistidos: 0 }
      }

      acc[salon].inscritos += 1

      // Si este alumno REALMENTE asistió hoy (puntualidad_asistencia > 0)
      if (asistenciasSet.has(alumno.id)) {
        acc[salon].asistidos += 1
      }

      return acc
    }, {})

    // Convertir a array y ordenar
    return Object.entries(conteo || {})
      .map(([salon, datos]) => ({
        salon,
        cantidad: (datos as any).inscritos,
        asistidos: (datos as any).asistidos
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
  } catch (error) {
    console.error('Error getting alumnos por salon:', error)
    return null
  }
}

export async function getPuntajesPorDiaYSalon(): Promise<Array<PuntajePorDiaYSalon> | null> {
  try {
    console.log('🔍 Buscando puntajes por día y salón...')

    // Consulta directa usando el campo 'preguntas' como en tu SQL
    const { data, error } = await supabase
      .from('puntuacion_grupal_diaria')
      .select(`
        fecha,
        classrooms!inner(
          nombre,
          color
        ),
        preguntas
      `)
      .not('preguntas', 'is', null)
      .gte('fecha', '2026-01-26') // Desde el lunes 26 (inicio del evento)
      .order('fecha', { ascending: false })

    if (error) {
      console.error('❌ Error en consulta directa:', error)
      throw error
    }

    console.log('📊 Datos crudos encontrados:', data?.length, 'registros')
    console.log('🗓️ Fechas encontradas:', [...new Set(data?.map(d => d.fecha))].sort())
    console.log('📍 Rango de datos: Desde 2026-01-26 (lunes) hacia adelante')

    if (!data || data.length === 0) {
      console.log('📭 No hay datos de puntajes')
      return null
    }

    // Agrupar exactamente como en tu SQL: GROUP BY pgd.fecha, c.nombre, c.color
    const agrupado = data.reduce((acc: Record<string, any>, item: any) => {
      const key = `${item.fecha}-${item.classrooms.nombre}-${item.classrooms.color}`

      if (!acc[key]) {
        acc[key] = {
          fecha: item.fecha,
          salon: item.classrooms.nombre,
          color: item.classrooms.color || '#gray',
          jurados_evaluaron: 0,
          total_preguntas: 0
        }
      }

      acc[key].jurados_evaluaron += 1
      acc[key].total_preguntas += item.preguntas || 0

      return acc
    }, {})

    console.log('📊 Agrupados por día y salón:', Object.keys(agrupado).length, 'grupos')

    const resultado = Object.values(agrupado || {}).map((item: any) => {
      const promedio = item.total_preguntas / item.jurados_evaluaron
      return {
        fecha: item.fecha,
        salon: item.salon,
        color: item.color,
        jurados_evaluaron: item.jurados_evaluaron,
        puntaje_promedio: parseFloat(Math.round(promedio * 100) / 100 + '') // ROUND(AVG(pgd.preguntas), 2)
      }
    })

    console.log('✅ Resultado procesado:', resultado)

    // Ordenar: ORDER BY pgd.fecha DESC, puntaje_promedio DESC
    return resultado.sort((a: any, b: any) => {
      if (a.fecha !== b.fecha) {
        return b.fecha.localeCompare(a.fecha) // Fecha descendente
      }
      return b.puntaje_promedio - a.puntaje_promedio // Puntaje descendente
    })
  } catch (error) {
    console.error('❌ Error getting puntajes por día y salón:', error)
    return null
  }
}

// Nuevo tipo para el tablero de progreso diario
export interface TableroDiarioPorSalon {
  salon: string
  dia: string
  alumnos: Array<{
    alumno: Alumno
    puntosDia: number
    totalAcumulado: number
    esDestacado: boolean
  }>
}

export async function getTableroProgresoDiario(dias: number = 7): Promise<TableroDiarioPorSalon[]> {
  try {
    const today = getFechaHoyPeru()
    console.log('🔍 Obteniendo tablero de progreso diario para últimos', dias, 'días')

    const { data: evaluaciones, error: evaluacionesError } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
        *,
        alumnos!inner(
          id,
          nombre,
          apellidos,
          classroom_id,
          classrooms!classroom_id(nombre)
        )
      `)
      .gte('fecha', new Date(Date.now() - (dias * 24 * 60 * 60 * 1000)).toISOString().split('T')[0])
      .lte('fecha', today)
      .gt('puntualidad_asistencia', 0)
      .order('fecha', { ascending: false })

    if (evaluacionesError) {
      console.error('❌ Error obteniendo evaluaciones:', evaluacionesError)
      throw evaluacionesError
    }

    console.log('📊 Evaluaciones encontradas:', evaluaciones?.length)

    if (!evaluaciones || evaluaciones.length === 0) {
      return []
    }

    // 1. Agrupar por salón y día
    const datosPorSalonDia = evaluaciones.reduce((acc: Record<string, any>, item: any) => {
      const salon = item.alumnos.classrooms?.nombre || 'sin-salon'
      const dia = item.fecha
      const key = `${salon}-${dia}`

      if (!acc[key]) {
        acc[key] = {
          salon,
          dia,
          alumnos: []
        }
      }

      const puntosDia = (item.actitud || 0) +
        (item.puntualidad_asistencia || 0) +
        (item.animo || 0) +
        (item.trabajo_manual || 0) +
        (item.verso_memoria || 0) +
        (item.aprestamiento_biblico || 0)

      acc[key].alumnos.push({
        alumno: {
          id: item.alumnos.id,
          nombre: item.alumnos.nombre,
          apellidos: item.alumnos.apellidos,
          edad: 0,
          genero: 'niño' as const,
          nombre_padre: '',
          telefono: '',
          classroom_id: item.alumnos.classroom_id,
          activo: true,
          fecha_inscripcion: ''
        },
        puntosDia,
        totalAcumulado: 0, // Se calculará
        esDestacado: false
      })

      return acc
    }, {})

    // 2. Calcular acumulados para cada día
    const salones = [...new Set(evaluaciones.map((e: any) => e.alumnos.classrooms?.nombre))]

    salones.forEach(salon => {
      // Obtener todos los días para este salón, ordenados
      const diasSalon = Object.keys(datosPorSalonDia)
        .filter(key => key.startsWith(salon + '-'))
        .map(key => datosPorSalonDia[key].dia)
        .sort() // Más antiguo a más reciente

      // Para cada alumno en cada día, calcular acumulado progresivo
      diasSalon.forEach((dia, diaIndex) => {
        const key = `${salon}-${dia}`
        const grupo = datosPorSalonDia[key]

        if (!grupo) return

        // Para cada alumno en este día
        grupo.alumnos.forEach((alumnoGrupo: any) => {
          let totalAcumulado = alumnoGrupo.puntosDia

          // Sumar puntos de días anteriores para el MISMO alumno
          for (let i = 0; i < diaIndex; i++) {
            const diaAnterior = diasSalon[i]
            const keyAnterior = `${salon}-${diaAnterior}`
            const grupoAnterior = datosPorSalonDia[keyAnterior]

            if (grupoAnterior) {
              const alumnoAnterior = grupoAnterior.alumnos.find((a: any) =>
                a.alumno.id === alumnoGrupo.alumno.id
              )
              if (alumnoAnterior) {
                totalAcumulado += alumnoAnterior.puntosDia
              }
            }
          }

          alumnoGrupo.totalAcumulado = totalAcumulado
        })
      })
    })

    // 3. Determinar destacados por ACUMULADO en cada día
    Object.values(datosPorSalonDia).forEach((grupo: any) => {
      if (grupo.alumnos.length === 0) return

      // NO REORDENAR aquí - mantener el orden original o por puntosDia
      // Solo determinar quiénes son destacados por acumulado

      // Encontrar el/los mejores acumulados
      // Opción A: Solo el mejor
      const mejorAcumulado = Math.max(...grupo.alumnos.map((a: any) => a.totalAcumulado))

      // Opción B: Todos los que están cerca del mejor (90% o más)
      const umbralDestacado = mejorAcumulado * 0.9

      grupo.alumnos.forEach((alumno: any) => {
        // Si quieres solo el mejor absoluto:
        // alumno.esDestacado = alumno.totalAcumulado === mejorAcumulado && mejorAcumulado > 0

        // Si quieres flexibilidad (recomendado):
        alumno.esDestacado = alumno.totalAcumulado >= umbralDestacado &&
          alumno.totalAcumulado > 0 &&
          mejorAcumulado > 0
      })

      console.log(`🏆 ${grupo.salon} - ${grupo.dia}:`, {
        totalAlumnos: grupo.alumnos.length,
        mejorAcumulado,
        umbralDestacado,
        destacados: grupo.alumnos.filter((a: any) => a.esDestacado).length,
        alumnos: grupo.alumnos
          .filter((a: any) => a.esDestacado)
          .map((a: any) => ({
            nombre: a.alumno.nombre.split(' ')[0],
            puntosDia: a.puntosDia,
            acumulado: a.totalAcumulado
          }))
      })
    })

    // 4. Ordenar resultado final
    const resultado = Object.values(datosPorSalonDia)
      .sort((a: any, b: any) => {
        if (a.salon !== b.salon) {
          return a.salon.localeCompare(b.salon)
        }
        return b.dia.localeCompare(a.dia) // Más reciente primero
      })

    console.log('✅ Tablero procesado:', resultado.length, 'grupos')
    return resultado

  } catch (error) {
    console.error('❌ Error:', error)
    return []
  }
}




export async function getResumenSemanal(): Promise<{
  rankingAlumnos: Array<{
    alumno: Alumno
    totalPuntos: number
    totalInvitados: number
    posicion: number
  }>
  rankingSalones: Array<{
    salon: string
    totalPuntos: number
    posicion: number
  }>
  campeonInvitados: {
    alumno: Alumno
    totalInvitados: number
  } | null
}> {
  try {
    // Obtener fecha de inicio de la semana (lunes de esta semana)
    const today = new Date()
    const monday = new Date(today)
    const day = monday.getDay()
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1) // Ajustar para que lunes = 1
    monday.setDate(diff)
    const fechaInicio = monday.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]

    console.log('📊 Obteniendo resumen semanal desde:', fechaInicio)

    // 1. Ranking individual de alumnos
    const { data: datosIndividuales, error: errorIndividual } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
        *,
        alumnos!inner(
          id,
          nombre,
          apellidos,
          classroom_id,
          classrooms!classroom_id(nombre)
        )
      `)
      .gte('fecha', fechaInicio).lte('fecha', todayStr)

    if (errorIndividual) {
      console.error('Error en consulta individual:', errorIndividual)
      throw errorIndividual
    }

    console.log('📊 Datos individuales encontrados:', datosIndividuales?.length)

    // Agrupar por alumno y calcular totales
    const scoresAlumnos = datosIndividuales?.reduce((acc: Record<string, any>, item: any) => {
      // Validar que exista el alumno
      if (!item.alumnos || !item.alumnos.id) {
        console.warn('⚠️ Item sin datos de alumno:', item)
        return acc
      }

      const alumnoId = item.alumnos.id
      if (!acc[alumnoId]) {
        acc[alumnoId] = {
          alumno: item.alumnos, // Corregir: es item.alumnos, no item.alumno
          totalPuntos: 0,
          totalInvitados: 0
        }
      }

      acc[alumnoId].totalPuntos +=
        (item.actitud || 0) +
        (item.puntualidad_asistencia || 0) +
        (item.animo || 0) +
        (item.trabajo_manual || 0) +
        (item.verso_memoria || 0) +
        (item.aprestamiento_biblico || 0)

      acc[alumnoId].totalInvitados += (item.invitados_hoy || 0)

      return acc
    }, {})

    // Ranking general de alumnos (para otros usos)
    const rankingGeneralAlumnos = Object.values(scoresAlumnos || {})
      .sort((a: any, b: any) => b.totalPuntos - a.totalPuntos)
      .map((item: any, index) => ({
        ...item,
        posicion: index + 1
      }))

    // Obtener solo el #1 de cada salón para "Ganadores por Salón"
    const ganadoresPorSalon: Record<string, any> = {}
    Object.values(scoresAlumnos || {}).forEach((alumno: any) => {
      const salon = alumno.alumno.classrooms?.nombre || 'sin-salon'
      if (!ganadoresPorSalon[salon] || alumno.totalPuntos > ganadoresPorSalon[salon].totalPuntos) {
        ganadoresPorSalon[salon] = alumno
      }
    })

    // Convertir a array y ordenar por puntos
    const rankingAlumnos = Object.values(ganadoresPorSalon)
      .sort((a: any, b: any) => b.totalPuntos - a.totalPuntos)
      .map((item: any, index) => ({
        ...item,
        posicion: index + 1
      }))

    // 2. Ranking de salones
    const { data: datosGrupales, error: grupalError } = await supabase
      .from('puntuacion_grupal_diaria')
      .select(`
        *,
        classrooms!inner(nombre)
      `)
      .gte('fecha', fechaInicio)

    if (grupalError) {
      console.error('Error en consulta grupal:', grupalError)
      throw grupalError
    }

    console.log('📊 Datos grupales encontrados:', datosGrupales?.length)

    // Para cada salón, guardamos suma, conteo y fechas para calcular días reales
    const scoresSalones = datosGrupales?.reduce((acc: Record<string, { suma: number, conteo: number, fechas: string[] }>, item: any) => {
      // Validar que exista el salón
      if (!item.classrooms || !item.classrooms.nombre) {
        console.warn('⚠️ Item sin datos de salón:', item)
        return acc
      }

      const salon = item.classrooms.nombre
      const total = (item.puntualidad || 0) + (item.animo_y_barras || 0) + (item.orden || 0) + (item.verso_memoria || 0) + (item.preguntas_correctas || 0)

      if (!acc[salon]) {
        acc[salon] = { suma: 0, conteo: 0, fechas: [] }
      }

      acc[salon].suma += total
      acc[salon].conteo += 1
      acc[salon].fechas.push(item.fecha)

      return acc
    }, {})

    const rankingSalones = Object.entries(scoresSalones || {})
      .map(([salon, datos]) => {
        // Calcular días reales entre primera y última fecha
        const fechasUnicas = [...new Set(datos.fechas)].sort()
        const diasReales = fechasUnicas.length > 0 ? fechasUnicas.length : 1

        return {
          salon,
          totalPuntos: Number(datos.suma),
          promedioPuntos: Number((datos.suma / datos.conteo).toFixed(2)),
          diasEvaluados: diasReales,
          fechasUnicas: fechasUnicas // Para debug si se necesita
        }
      })
      .sort((a, b) => b.promedioPuntos - a.promedioPuntos) // Ordenar por promedio, no por suma
      .map((item, index) => ({
        ...item,
        posicion: index + 1
      }))

    console.log('📊 Rankings procesados:', {
      rankingAlumnos: rankingAlumnos.length,
      rankingSalones: rankingSalones.length
    })

    // 3. Campeón de invitados - Mantener la lógica original para no romper tipos
    const alumnosConInvitados = rankingGeneralAlumnos.filter((a: any) => a.totalInvitados > 0)

    console.log('🔍 DEBUG: Ranking completo de alumnos con invitaciones:')
    rankingGeneralAlumnos.forEach((alumno: any, index) => {
      if (alumno.totalInvitados > 0) {
        console.log(`   ${index + 1}. ${alumno.alumno.nombre} ${alumno.alumno.apellidos}: ${alumno.totalInvitados} invitados (Salón: ${alumno.alumno.classrooms?.nombre || 'N/A'})`)
      }
    })

    const campeonInvitados = alumnosConInvitados.length > 0
      ? alumnosConInvitados.reduce((a: any, b: any) =>
        a.totalInvitados > b.totalInvitados ? a : b
      )
      : null
    console.log('🔍 DEBUG: Ranking completo de alumnos con invitaciones:')
    rankingGeneralAlumnos.forEach((alumno: any, index) => {
      if (alumno.totalInvitados > 0) {
        console.log(`   ${index + 1}. ${alumno.alumno.nombre} ${alumno.alumno.apellidos}: ${alumno.totalInvitados} invitaciones (Salón: ${alumno.alumno.classrooms?.nombre || 'N/A'})`)
      }
    })

    console.log('📊 Campeón invitados (selección por reducer):')
    if (campeonInvitados) {
      console.log(`   🏆 ${campeonInvitados.alumno.nombre} ${campeonInvitados.alumno.apellidos} (${campeonInvitados.totalInvitados} invitados)`)
      console.log(`   👥 Salón: ${campeonInvitados.alumno.classrooms?.nombre || 'N/A'}`)
      console.log(`   🆔 ID: ${campeonInvitados.alumno.id}`)
    } else {
      console.log('   ❌ No hay campeón')
    }

    return {
      rankingAlumnos,
      rankingSalones,
      campeonInvitados
    }
  } catch (error) {
    console.error('Error getting resumen semanal:', error)
    return {
      rankingAlumnos: [],
      rankingSalones: [],
      campeonInvitados: null
    }
  }
}
