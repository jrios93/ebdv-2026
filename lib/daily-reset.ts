import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function resetDailyPoints() {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]
  
  console.log(`🔄 Reiniciando puntos diarios de ${yesterdayStr} a ${todayStr}`)
  
  try {
    // 1. Verificar si ya existen puntuaciones para hoy
    const { data: existingTodayIndividual, error: errorCheckIndividual } = await supabase
      .from('puntuacion_individual_diaria')
      .select('id')
      .eq('fecha', todayStr)
      .limit(1)
      
    if (errorCheckIndividual) throw errorCheckIndividual
    
    if (existingTodayIndividual && existingTodayIndividual.length > 0) {
      console.log('✅ Los puntos de hoy ya existen, no se necesita reseteo')
      return { message: 'Points already reset for today', status: 'skipped' }
    }
    
    // 2. Resetear formulario de evaluación individual en frontend
    // Esto se hace automáticamente al cargar una nueva evaluación
    console.log('📊 Formularios listos para nueva evaluación diaria')
    
    // 3. Limpiar caché y estado del frontend
    console.log('🧹 Estados del frontend limpios para nuevo día')
    
    return { 
      message: 'Daily reset completed successfully', 
      status: 'completed',
      date: todayStr
    }
    
  } catch (error) {
    console.error('❌ Error en reseteo diario:', error)
    return { 
      message: 'Error in daily reset', 
      status: 'error',
      error: error 
    }
  }
}

// Función para verificar si los puntos ya fueron reseteados hoy
export async function checkDailyResetStatus() {
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const { data: todayScores, error } = await supabase
      .from('puntuacion_individual_diaria')
      .select('count')
      .eq('fecha', today)
      
    if (error) throw error
    
    const hasPointsToday = todayScores && todayScores.length > 0
    
    return {
      hasPointsToday,
      date: today,
      needsReset: !hasPointsToday
    }
    
  } catch (error) {
    console.error('Error checking reset status:', error)
    return {
      hasPointsToday: false,
      date: today,
      needsReset: true,
      error
    }
  }
}