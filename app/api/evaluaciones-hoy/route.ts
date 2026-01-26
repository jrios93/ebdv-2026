import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    
    if (!fecha) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('puntuacion_individual_diaria')
      .select('alumno_id, fecha')
      .eq('fecha', fecha)

    if (error) {
      console.error('Error en API de evaluaciones:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error en servidor:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}