// Script para probar consulta de alumnos
import { supabase } from './lib/supabase'

async function testAlumnosQuery() {
  console.log('🔍 Probando consulta de alumnos...')
  
  // 1. Verificar si hay alumnos en la tabla
  console.log('\n--- 1. Conteo total de alumnos ---')
  const { count: totalCount, error: countError } = await supabase
    .from('alumnos')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error('❌ Error en conteo:', countError)
  } else {
    console.log(`📊 Total alumnos: ${totalCount}`)
  }
  
  // 2. Verificar alumnos activos
  console.log('\n--- 2. Conteo alumnos activos ---')
  const { count: activeCount, error: activeError } = await supabase
    .from('alumnos')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)
  
  if (activeError) {
    console.error('❌ Error en conteo activos:', activeError)
  } else {
    console.log(`📊 Alumnos activos: ${activeCount}`)
  }
  
  // 3. Consulta simple sin relaciones
  console.log('\n--- 3. Consulta simple sin relaciones ---')
  const { data: simpleData, error: simpleError } = await supabase
    .from('alumnos')
    .select('*')
    .eq('activo', true)
    .limit(5)
  
  if (simpleError) {
    console.error('❌ Error en consulta simple:', simpleError)
  } else {
    console.log(`📊 Datos simples:`, simpleData?.map(a => ({
      id: a.id,
      nombre: a.nombre,
      apellidos: a.apellidos,
      classroom_id: a.classroom_id,
      classroom_forzado_id: a.classroom_forzado_id,
      activo: a.activo,
      fecha_inscripcion: a.fecha_inscripcion
    })))
  }
  
  // 4. Consulta con relaciones (la que usamos en el hook)
  console.log('\n--- 4. Consulta con relaciones (hook) ---')
  const { data: relationData, error: relationError } = await supabase
    .from('alumnos')
    .select(`
      *,
      classroom: classrooms!classroom_id(nombre),
      classroom_forzado: classrooms!classroom_forzado_id(nombre)
    `)
    .eq('activo', true)
    .order('fecha_inscripcion', { ascending: false })
    .limit(5)
  
  if (relationError) {
    console.error('❌ Error en consulta con relaciones:', relationError)
  } else {
    console.log(`📊 Datos con relaciones:`, relationData?.map(a => ({
      id: a.id,
      nombre: a.nombre,
      apellidos: a.apellidos,
      classroom: a.classroom,
      classroom_forzado: a.classroom_forzado,
      fecha_inscripcion: a.fecha_inscripcion
    })))
  }
  
  // 5. Verificar si hay inscripciones hoy
  console.log('\n--- 5. Inscripciones hoy ---')
  const today = new Date().toISOString().split('T')[0]
  const { data: todayData, error: todayError } = await supabase
    .from('alumnos')
    .select('*')
    .eq('activo', true)
    .gte('fecha_inscripcion', `${today}T00:00:00.000Z`)
    .lte('fecha_inscripcion', `${today}T23:59:59.999Z`)
    .order('fecha_inscripcion', { ascending: false })
  
  if (todayError) {
    console.error('❌ Error en consulta hoy:', todayError)
  } else {
    console.log(`📊 Inscripciones hoy: ${todayData?.length || 0}`)
    todayData?.forEach(a => {
      console.log(`  - ${a.nombre} ${a.apellidos} (${new Date(a.fecha_inscripcion).toLocaleTimeString()})`)
    })
  }
  
  // 6. Verificar estructura de la tabla alumnos
  console.log('\n--- 6. Estructura de la tabla ---')
  const { data: structureData } = await supabase
    .from('alumnos')
    .select('*')
    .limit(1)
  
  if (structureData && structureData.length > 0) {
    console.log('📋 Columnas disponibles:', Object.keys(structureData[0]))
  }
}

testAlumnosQuery().catch(console.error)