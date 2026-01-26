"use client"

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Alumno } from '@/lib/supabaseQueries'

interface UseRealtimeInscripcionesProps {
  classroomFilter?: string
  dateFilter?: string
  searchTerm?: string
}

export function useRealtimeInscripciones({
  classroomFilter,
  dateFilter,
  searchTerm
}: UseRealtimeInscripcionesProps = {}) {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlumnos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 fetchAlumnos - Iniciando consulta...', { classroomFilter, dateFilter, searchTerm })
      console.log('⏰ fetchAlumnos llamado a las:', new Date().toLocaleTimeString())

      // Construir consulta base
      let query = supabase
        .from('alumnos')
        .select('*')
        .eq('activo', true)
        .order('fecha_inscripcion', { ascending: false })

      console.log('🔍 Iniciando consulta con filtros:', { searchTerm, classroomFilter, dateFilter })

      // Construir todas las condiciones en un solo OR si hay filtros
      const conditions = []
      
      if (searchTerm && searchTerm.trim() !== '') {
        const trimmedSearch = searchTerm.trim()
        conditions.push(`nombre.ilike.%${trimmedSearch}%`)
        conditions.push(`apellidos.ilike.%${trimmedSearch}%`)
        conditions.push(`nombre_padre.ilike.%${trimmedSearch}%`)
      }
      
      if (classroomFilter && classroomFilter !== 'todos') {
        conditions.push(`classroom_id.eq.${classroomFilter}`)
        conditions.push(`classroom_forzado_id.eq.${classroomFilter}`)
      }
      
      if (dateFilter) {
        const startOfDay = new Date(dateFilter + 'T00:00:00.000Z')
        const endOfDay = new Date(dateFilter + 'T23:59:59.999Z')
        // Para fecha necesitamos g/lte, no se puede mezclar fácilmente con OR de texto
        query = query
          .gte('fecha_inscripcion', startOfDay.toISOString())
          .lte('fecha_inscripcion', endOfDay.toISOString())
      }
      
      // Aplicar condiciones OR si existen
      if (conditions.length > 0) {
        const orCondition = conditions.join(',')
        query = query.or(orCondition)
        console.log('🔤 Condición OR final:', orCondition)
      }

      console.log('🚀 Ejecutando consulta SQL...')
      console.log('📋 Query final:', query)
      
      const { data, error: fetchError } = await query

      if (fetchError) {
        console.error('❌ Error fetching alumnos:', fetchError)
        setError(fetchError.message)
        return
      }

      console.log('✅ Datos obtenidos:', data?.length || 0, 'alumnos')
      if (data && data.length > 0) {
        console.log('📋 Primer alumno:', data[0])
      }

      setAlumnos(data || [])
    } catch (err) {
      console.error('💥 Error in fetchAlumnos:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [classroomFilter, dateFilter, searchTerm])

  useEffect(() => {
    fetchAlumnos()
  }, [fetchAlumnos])

  useEffect(() => {
    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('inscripciones-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alumnos',
          filter: 'activo=eq.true'
        },
        (payload) => {
          console.log('Cambio en tiempo real:', payload)
          
          if (payload.eventType === 'INSERT') {
            setAlumnos(prev => [payload.new as Alumno, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setAlumnos(prev => 
              prev.map(alumno => 
                alumno.id === payload.new.id ? payload.new as Alumno : alumno
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setAlumnos(prev => 
              prev.filter(alumno => alumno.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const refrescar = useCallback(() => {
    fetchAlumnos()
  }, [fetchAlumnos])

  return {
    alumnos,
    loading,
    error,
    refrescar
  }
}