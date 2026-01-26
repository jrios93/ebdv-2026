// Script de prueba para verificar el cálculo del rango semanal
// Copia y pega esto en la consola del navegador o ejecútalo con Node.js

function testWeeklyRange() {
  console.log('🧪 Probando cálculo de rango semanal...\n')
  
  // Casos de prueba para diferentes días de la semana
  const testCases = [
    { date: '2026-01-26', day: 'Domingo', expectedMonday: '2026-01-19' },
    { date: '2026-01-20', day: 'Lunes', expectedMonday: '2026-01-20' },
    { date: '2026-01-21', day: 'Martes', expectedMonday: '2026-01-20' },
    { date: '2026-01-22', day: 'Miércoles', expectedMonday: '2026-01-20' },
    { date: '2026-01-23', day: 'Jueves', expectedMonday: '2026-01-20' },
    { date: '2026-01-24', day: 'Viernes', expectedMonday: '2026-01-20' },
    { date: '2026-01-25', day: 'Sábado', expectedMonday: '2026-01-20' },
  ]
  
  testCases.forEach(({ date, day, expectedMonday }) => {
    // Simular la lógica del export function
    const today = new Date(date)
    const monday = new Date(today)
    const dayOfWeek = monday.getDay()
    const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    monday.setDate(diff)
    
    const dataInicio = monday.toISOString().split('T')[0]
    const dataFim = today.toISOString().split('T')[0]
    
    const isCorrect = dataInicio === expectedMonday
    
    console.log(`📅 ${day} (${date}):`)
    console.log(`   Inicio semana: ${dataInicio} ${isCorrect ? '✅' : '❌ (esperado: ' + expectedMonday + ')'}`)
    console.log(`   Fin semana: ${dataFim}`)
    console.log(`   Rango: ${dataInicio} a ${dataFim}\n`)
  })
  
  // Probar con fecha actual
  console.log('🕐 Fecha actual:')
  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = monday.getDay()
  const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  monday.setDate(diff)
  
  const dataInicio = monday.toISOString().split('T')[0]
  const dataFim = today.toISOString().split('T')[0]
  
  console.log(`   Hoy es: ${today.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`)
  console.log(`   Inicio semana: ${dataInicio}`)
  console.log(`   Fin semana: ${dataFim}`)
  console.log(`   Rango exportación: ${dataInicio} a ${dataFim}`)
}

// Ejecutar la prueba
testWeeklyRange()

// También verificar formato de fechas en español
console.log('\n🌍 Formato de fechas en español:')
const testDate = new Date('2026-01-26T00:00:00')
console.log(`   Date: ${testDate.toLocaleDateString('es-PE')}`)
console.log(`   Time: ${testDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`)
console.log(`   DateTime: ${testDate.toLocaleDateString('es-PE')} ${testDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`)