// Test script para verificar datos en la base de datos
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xhslnlccbsoyiylmrmxb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc2xubGNjYnNveWl5bG1ybXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMzc2ODQsImV4cCI6MjA4NDcxMzY4NH0.v7IzfGPgeugvl_qejITew44FTNg4AvLmUyIYU2JvndM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 Verificando datos en la base de datos...')
  
  // 1. Verificar tabla alumnos
  console.log('\n📋 Verificando tabla alumnos...')
  const { data: alumnos, error: errorAlumnos } = await supabase
    .from('alumnos')
    .select('id, nombre, apellidos, classroom_id')
    .limit(5)
  
  if (errorAlumnos) {
    console.error('❌ Error en alumnos:', errorAlumnos)
  } else {
    console.log(`✅ Encontrados ${alumnos.length} alumnos:`, alumnos)
  }
  
  // 2. Verificar tabla puntuacion_individual_diaria
  console.log('\n📊 Verificando tabla puntuacion_individual_diaria...')
  const { data: puntajes, error: errorPuntajes } = await supabase
    .from('puntuacion_individual_diaria')
    .select('*')
    .gte('fecha', new Date().toISOString().split('T')[0])
    .limit(5)
  
  if (errorPuntajes) {
    console.error('❌ Error en puntuaciones:', errorPuntajes)
  } else {
    console.log(`✅ Encontradas ${puntajes.length} puntuaciones hoy:`, puntajes)
  }
  
  // 3. Verificar tabla puntuacion_grupal_diaria
  console.log('\n🏛️ Verificando tabla puntuacion_grupal_diaria...')
  const { data: grupales, error: errorGrupales } = await supabase
    .from('puntuacion_grupal_diaria')
    .select('*')
    .gte('fecha', new Date().toISOString().split('T')[0])
    .limit(5)
  
  if (errorGrupales) {
    console.error('❌ Error en puntuaciones grupales:', errorGrupales)
  } else {
    console.log(`✅ Encontradas ${grupales.length} puntuaciones grupales hoy:`, grupales)
  }
  
  // 4. Verificar tabla evaluaciones_hoy
  console.log('\n🎯 Verificando tabla evaluaciones_hoy...')
  const { data: evaluaciones, error: errorEvaluaciones } = await supabase
    .from('evaluaciones_hoy')
    .select('*')
    .limit(5)
  
  if (errorEvaluaciones) {
    console.error('❌ Error en evaluaciones:', errorEvaluaciones)
  } else {
    console.log(`✅ Encontradas ${evaluaciones.length} evaluaciones hoy:`, evaluaciones)
  }
  
  // 5. Verificar tabla classrooms
  console.log('\n🏫 Verificando tabla classrooms...')
  const { data: classrooms, error: errorClassrooms } = await supabase
    .from('classrooms')
    .select('*')
  
  if (errorClassrooms) {
    console.error('❌ Error en classrooms:', errorClassrooms)
  } else {
    console.log(`✅ Encontrados ${classrooms.length} classrooms:`, classrooms)
  }
  
  // 6. Contar totales de la semana
  console.log('\n📈 Contando datos de la semana...')
  const today = new Date()
  const monday = new Date(today)
  const day = monday.getDay()
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
  monday.setDate(diff)
  const fechaInicio = monday.toISOString().split('T')[0]
  
  console.log(`📅 Desde: ${fechaInicio} hasta: ${new Date().toISOString().split('T')[0]}`)
  
  const { count: countIndividual, error: errorCountIndividual } = await supabase
    .from('puntuacion_individual_diaria')
    .select('*', { count: 'exact', head: true })
    .gte('fecha', fechaInicio)
    
  if (errorCountIndividual) {
    console.error('❌ Error contando individuales:', errorCountIndividual)
  } else {
    console.log(`📊 Total puntuaciones individuales esta semana: ${countIndividual}`)
  }
  
  const { count: countGrupal, error: errorCountGrupal } = await supabase
    .from('puntuacion_grupal_diaria')
    .select('*', { count: 'exact', head: true })
    .gte('fecha', fechaInicio)
    
  if (errorCountGrupal) {
    console.error('❌ Error contando grupales:', errorCountGrupal)
  } else {
    console.log(`📊 Total puntuaciones grupales esta semana: ${countGrupal}`)
  }
}

checkData().catch(console.error)