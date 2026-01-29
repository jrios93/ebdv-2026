import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface RankingInvitados {
  alumno: {
    id: string
    nombre: string
    apellidos: string
    classroom_id: string
    classrooms: {
      nombre: string
    }
  }
  totalInvitados: number
  posicion: number
}

interface InvitadosPorDia {
  fecha: string
  invitados: number
  classroom_nombre: string
}

export async function getRankingInvitados(
  dias: number = 7
): Promise<RankingInvitados[] | null> {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - dias)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    console.log(`🔍 Buscando invitados desde ${startDateStr} hasta ${endDateStr}`)

    // Obtener todas las puntuaciones individuales en el rango de fechas
    const { data: evaluaciones, error } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
        invitados_hoy,
        fecha,
        alumno_id,
        alumnos!inner(
          id,
          nombre,
          apellidos,
          classroom_id,
          classrooms!classroom_id(nombre)
        )
      `)
      .gte('fecha', startDateStr)
      .lte('fecha', endDateStr)
      .not('invitados_hoy', 'is', null)
      .order('fecha', { ascending: false })

    if (error) throw error

    console.log(`📊 Se encontraron ${evaluaciones?.length || 0} registros de evaluaciones`)

    if (!evaluaciones || evaluaciones.length === 0) {
      return []
    }

    // Agrupar por alumno y sumar invitados acumulados
    const mapaInvitados = new Map<string, RankingInvitados>()

    evaluaciones.forEach((evaluacion: any) => {
      const alumnoId = evaluacion.alumno_id
      const alumno = evaluacion.alumnos
      const invitadosHoy = evaluacion.invitados_hoy || 0

      console.log(`➕ Alumno ${alumno.nombre}: ${invitadosHoy} invitados en ${evaluacion.fecha}`)

      if (!mapaInvitados.has(alumnoId)) {
        mapaInvitados.set(alumnoId, {
          alumno: {
            id: alumno.id,
            nombre: alumno.nombre,
            apellidos: alumno.apellidos,
            classroom_id: alumno.classroom_id,
            classrooms: {
              nombre: alumno.classrooms.nombre
            }
          },
          totalInvitados: invitadosHoy,
          posicion: 0
        })
      } else {
        const existente = mapaInvitados.get(alumnoId)!
        existente.totalInvitados += invitadosHoy
        console.log(`📈 Total acumulado para ${alumno.nombre}: ${existente.totalInvitados} invitados`)
      }
    })

    // Convertir a array y ordenar por total de invitados (primero por total, luego por nombre para desempates)
    const ranking = Array.from(mapaInvitados.values())
      .sort((a, b) => {
        // Primario: más invitados totales
        if (b.totalInvitados !== a.totalInvitados) {
          return b.totalInvitados - a.totalInvitados
        }
        // Secundario: nombre alfabético (para consistencia en empates)
        return a.alumno.nombre.localeCompare(b.alumno.nombre)
      })
      .map((item, index) => ({
        ...item,
        posicion: index + 1
      }))

    console.log(`🏆 Ranking final (ordenado por total descendente, luego nombre): ${ranking.length} alumnos`)
    ranking.forEach((item, index) => {
      console.log(`${index + 1}. ${item.alumno.nombre} ${item.alumno.apellidos}: ${item.totalInvitados} invitados (Salón: ${item.alumno.classrooms?.nombre || 'N/A'})`)
    })

    return ranking

  } catch (error) {
    console.error('Error obteniendo ranking de invitados:', error)
    return null
  }
}

export async function getInvitadosPorAlumno(
  alumnoId: string,
  dias: number = 7
): Promise<InvitadosPorDia[] | null> {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - dias)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    console.log(`🔍 Buscando invitados de alumno ${alumnoId} desde ${startDateStr} hasta ${endDateStr}`)

    const { data, error } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
        invitados_hoy,
        fecha,
        alumnos!inner(
          classroom_id,
          classrooms!classroom_id(nombre)
        )
      `)
      .eq('alumno_id', alumnoId)
      .gte('fecha', startDateStr)
      .lte('fecha', endDateStr)
      .order('fecha', { ascending: true })

    if (error) throw error

    console.log(`📊 Se encontraron ${data?.length || 0} días con registros para este alumno`)

    if (!data) return []

    const resultado = data.map((item: any) => ({
      fecha: item.fecha,
      invitados: item.invitados_hoy || 0,
      classroom_nombre: item.alumnos?.classrooms?.nombre || 'Desconocido'
    }))

    // Calcular acumulado
    let acumulado = 0
    resultado.forEach(dia => {
      acumulado += dia.invitados
      console.log(`📅 ${dia.fecha}: +${dia.invitados} invitados (total: ${acumulado})`)
    })

    console.log(`🏆 Total acumulado para el alumno: ${acumulado} invitados`)

    return resultado

  } catch (error) {
    console.error('Error obteniendo invitados por alumno:', error)
    return null
  }
}

export async function getCampeonInvitados(
  dias: number = 7
): Promise<RankingInvitados | null> {
  console.log(`🏆 Buscando campeón de invitados de los últimos ${dias} días`)
  const ranking = await getRankingInvitados(dias)
  const campeon = ranking && ranking.length > 0 ? ranking[0] : null

  if (campeon) {
    console.log(`🥇 Campeón actual: ${campeon.alumno.nombre} con ${campeon.totalInvitados} invitados`)
  } else {
    console.log('📭 No hay campeón todavía')
  }

  return campeon
}

export async function getTotalInvitadosPeriodo(
  dias: number = 7
): Promise<number> {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - dias)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('puntuacion_individual_diaria')
      .select('invitados_hoy')
      .gte('fecha', startDateStr)
      .lte('fecha', endDateStr)
      .not('invitados_hoy', 'is', null)

    if (error) throw error

    const total = data?.reduce((sum, record) => sum + (record.invitados_hoy || 0), 0) || 0
    console.log(`📈 Total de invitados en los últimos ${dias} días: ${total}`)

    return total
  } catch (error) {
    console.error('Error obteniendo total de invitados:', error)
    return 0
  }
}

export function getInvitadosLevel(totalInvitados: number): {
  level: string
  color: string
  icon: string
  description: string
} {
  if (totalInvitados >= 15) {
    return {
      level: "Leyenda de la Evangelización",
      color: "text-purple-600 bg-purple-50 border-purple-200",
      icon: "👑",
      description: "¡Excelente misionero!"
    }
  } else if (totalInvitados >= 10) {
    return {
      level: "Misionero Estrella",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      icon: "⭐",
      description: "Gran trabajo compartiendo"
    }
  } else if (totalInvitados >= 5) {
    return {
      level: "Amigo Fiel",
      color: "text-green-600 bg-green-50 border-green-200",
      icon: "🌟",
      description: "Buen esfuerzo invitando"
    }
  } else {
    return {
      level: "Comenzando",
      color: "text-gray-600 bg-gray-50 border-gray-200",
      icon: "🌱",
      description: "Sigue invitando amigos"
    }
  }
}
