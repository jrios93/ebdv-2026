import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getFechaHoyPeru } from '@/lib/date/config'

export interface VotoJurado {
  id: string
  classroom_id: string
  jurado_id: string
  fecha: string
  puntualidad: number
  animo_y_barras: number
  orden: number
  verso_memoria: number
  preguntas_correctas: number
  creado_en: string
}

export interface PuntuacionPromedio {
  classroom_id: string
  classroom_nombre?: string
  fecha: string
  total_jurados: number
  puntualidad_promedio: number
  animo_y_barras_promedio: number
  orden_promedio: number
  verso_memoria_promedio: number
  preguntas_correctas_promedio: number
  puntaje_total_promedio: number
  estado: string
  ultima_actualizacion?: string
}

export function useRealtimeVotos(classroomId?: string, fecha: string = getFechaHoyPeru()) {
  const [votos, setVotos] = useState<VotoJurado[]>([])
  const [promedio, setPromedio] = useState<PuntuacionPromedio | null>(null)
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Cargar votos del día
      const { data: votosData, error: votosError } = await supabase
        .from('puntuacion_grupal_diaria')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('fecha', fecha)
        .order('creado_en', { ascending: false })

      if (votosError) throw votosError

      // Cargar promedio usando la vista
      const { data: promedioData, error: promedioError } = await supabase
        .from('v_promedios_diarios')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('fecha', fecha)
        .single()

      if (promedioError && promedioError.code !== 'PGRST116') {
        // PGRST116 es el código para "no rows returned", lo cual es normal
        throw promedioError
      }

      setVotos(votosData || [])
      setPromedio(promedioData || null)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!classroomId) return

    cargarDatos()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`evaluaciones-${classroomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'puntuacion_grupal_diaria',
          filter: `classroom_id=eq.${classroomId}&fecha=eq.${fecha}`
        },
        (payload) => {
          console.log('Cambio en evaluaciones:', payload)
          
          // Actualizar votos en tiempo real
          if (payload.eventType === 'INSERT') {
            setVotos(prev => [payload.new as VotoJurado, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setVotos(prev => 
              prev.map(voto => 
                voto.id === payload.new.id ? payload.new as VotoJurado : voto
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setVotos(prev => prev.filter(voto => voto.id !== payload.old.id))
          }
          
          // NO recargar datos automáticamente para evitar bucles infinitos
          // cargarDatos() // Comentado para evitar el problema de bucle infinito en resultados
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [classroomId, fecha])

  const guardarVoto = async (voto: Omit<VotoJurado, 'id' | 'creado_en'>) => {
    const { data, error } = await supabase
      .from('puntuacion_grupal_diaria')
      .insert({
        ...voto,
        fecha: fecha
      })
      .select(`
        *,
        maestros!inner(
          nombre
        )
      `)
      .single()

    if (error) throw error
    return data
  }

  const validarPuedeEvaluar = async (juradoId: string) => {
    const { data, error } = await supabase
      .rpc('jurado_puede_evaluar', {
        p_jurado_id: juradoId,
        p_classroom_id: classroomId,
        p_fecha: fecha
      })

    if (error) throw error
    return data?.[0] || { puede_evaluar: false, mensaje: 'Error al validar', ya_evaluado: false, total_evaluaciones: 0 }
  }

  return {
    votos,
    promedio,
    loading,
    guardarVoto,
    validarPuedeEvaluar,
    refrescarDatos: cargarDatos
  }
}