import { supabase } from '@/lib/supabase'

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
  puntualidad: number
  animo_y_barras: number
  orden: number
  verso_memoria: number
  preguntas_correctas: number
  jurado_registro_id?: string
  created_at: string
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
    const { error } = await supabase
      .from('puntuacion_grupal_diaria')
      .insert(puntuacion)

    if (error) throw error
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
    const today = new Date().toISOString().split('T')[0]
    
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
      .from('puntuacion_grupal_diaria')
      .select(`
        classroom_id,
        puntualidad,
        animo_y_barras,
        orden,
        verso_memoria,
        preguntas_correctas,
        classrooms!inner(nombre)
      `)
      .eq('fecha', today)
    
    let mejorClassroom = null
    if (grupalesHoy && grupalesHoy.length > 0) {
      const scores = grupalesHoy.reduce((acc, grupal: any) => {
        const total = grupal.puntualidad + grupal.animo_y_barras + 
                    grupal.orden + grupal.verso_memoria + grupal.preguntas_correctas
        acc[grupal.classrooms.nombre] = (acc[grupal.classrooms.nombre] || 0) + total
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
    const today = new Date().toISOString().split('T')[0]
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
    const today = new Date().toISOString().split('T')[0]
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
    const today = new Date().toISOString().split('T')[0]
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
    const today = new Date().toISOString().split('T')[0]
    
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
    console.error('Error getting salones evaluados:', error)
    return null
  }
}

export async function getClassroomRankingToday(): Promise<Array<{
  classroom: string
  totalPuntos: number
  evaluaciones: number
}> | null> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
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
    
    // Convertir a array y ordenar
    const ranking = Object.entries(classroomScores)
      .map(([classroom, scores]: [string, any]) => ({
        classroom,
        totalPuntos: scores.total,
        evaluaciones: scores.count
      }))
      .sort((a, b) => b.totalPuntos - a.totalPuntos)
    
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
    console.error('Error en getClassroomIdByName:', error)
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

    return {
      totalAlumnos: totalAlumnos || 0,
      totalEvaluacionesHoy: totalEvaluacionesHoy || 0,
      totalPuntuacionesGrupalHoy: totalPuntuacionesGrupalHoy || 0,
      evaluadosHoy: new Set(evaluadosUnicos?.map(e => e.alumno_id) || []).size
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
}> | null> {
  try {
    const { data, error } = await supabase
      .from('alumnos')
      .select(`
        classrooms!classroom_id(nombre)
      `)
      .eq('activo', true)
    
    if (error) throw error
    
    // Contar alumnos por salón
    const conteo = data?.reduce((acc: Record<string, number>, alumno: any) => {
      const salon = alumno.classrooms?.nombre || 'Sin asignar'
      acc[salon] = (acc[salon] || 0) + 1
      return acc
    }, {})
    
    // Convertir a array y ordenar
    return Object.entries(conteo || {})
      .map(([salon, cantidad]) => ({ salon, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
  } catch (error) {
    console.error('Error getting alumnos por salon:', error)
    return null
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
      .gte('fecha', fechaInicio)
    
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
    
    const rankingAlumnos = Object.values(scoresAlumnos || {})
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
    
    const scoresSalones = datosGrupales?.reduce((acc: Record<string, number>, item: any) => {
      // Validar que exista el salón
      if (!item.classrooms || !item.classrooms.nombre) {
        console.warn('⚠️ Item sin datos de salón:', item)
        return acc
      }
      
      const salon = item.classrooms.nombre
      const total = (item.puntualidad || 0) + (item.animo_y_barras || 0) + (item.orden || 0) + (item.verso_memoria || 0) + (item.preguntas_correctas || 0)
      acc[salon] = (acc[salon] || 0) + total
      return acc
    }, {})
    
    const rankingSalones = Object.entries(scoresSalones || {})
      .map(([salon, totalPuntos]) => ({ salon, totalPuntos }))
      .sort((a, b) => b.totalPuntos - a.totalPuntos)
      .map((item, index) => ({
        ...item,
        posicion: index + 1
      }))
    
    console.log('📊 Rankings procesados:', {
      rankingAlumnos: rankingAlumnos.length,
      rankingSalones: rankingSalones.length
    })
    
    // 3. Campeón de invitados
    const campeonInvitados = rankingAlumnos.length > 0 && rankingAlumnos.some(a => a.totalInvitados > 0)
      ? rankingAlumnos.reduce((a, b) => a.totalInvitados > b.totalInvitados ? a : b)
      : null
    
    console.log('📊 Campeón invitados:', campeonInvitados ? `${campeonInvitados.alumno.nombre} - ${campeonInvitados.totalInvitados} invitados` : 'Ninguno')
    
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