// Script de prueba actualizado para verificar el cálculo del rango semanal corregido

function testWeeklyRangeFixed() {
  console.log('🧪 Probando cálculo CORREGIDO de rango semanal...\n')
  
  // Casos de prueba para diferentes días de la semana
  const testCases = [
    { date: '2026-01-26', day: 'Domingo', expectedMonday: '2026-01-20' }, // Corregido: debe ser lunes 20, no 19
    { date: '2026-01-20', day: 'Lunes', expectedMonday: '2026-01-20' },
    { date: '2026-01-21', day: 'Martes', expectedMonday: '2026-01-20' },
    { date: '2026-01-22', day: 'Miércoles', expectedMonday: '2026-01-20' },
    { date: '2026-01-23', day: 'Jueves', expectedMonday: '2026-01-20' },
    { date: '2026-01-24', day: 'Viernes', expectedMonday: '2026-01-20' },
    { date: '2026-01-25', day: 'Sábado', expectedMonday: '2026-01-20' },
  ]
  
  let allCorrect = true
  
  testCases.forEach(({ date, day, expectedMonday }) => {
    // Usar la lógica CORREGIDA del export function
    const today = new Date(date)
    const monday = new Date(today)
    const dayOfWeek = monday.getDay()
    const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    monday.setDate(diff)
    
    const dataInicio = monday.toISOString().split('T')[0]
    const dataFim = today.toISOString().split('T')[0]
    
    const isCorrect = dataInicio === expectedMonday
    
    if (!isCorrect) allCorrect = false
    
    console.log(`📅 ${day} (${date}):`)
    console.log(`   Inicio semana: ${dataInicio} ${isCorrect ? '✅' : '❌ (esperado: ' + expectedMonday + ')'}`)
    console.log(`   Fin semana: ${dataFim}`)
    console.log(`   Rango: ${dataInicio} a ${dataFim}\n`)
  })
  
  console.log(`🎯 Resultado: ${allCorrect ? '✅ Todos los cálculos correctos' : '❌ Hay errores en el cálculo'}`)
  
  // Probar con fecha actual
  console.log('\n🕐 Fecha actual con lógica corregida:')
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
  
  // Verificar lógica específica para domingo
  console.log('\n🔍 Verificación especial para domingo:')
  const domingo = new Date('2026-01-26') // Domingo
  console.log(`   Día de la semana: ${domingo.getDay()} (0 = domingo)`)
  console.log(`   Cálculo diff: ${domingo.getDate()} - ${domingo.getDay()} + ${domingo.getDay() === 0 ? '-6' : '1'} = ${domingo.getDate() - domingo.getDay() + (domingo.getDay() === 0 ? -6 : 1)}`)
  const lunesCalc = new Date(domingo)
  lunesCalc.setDate(domingo.getDate() - domingo.getDay() + (domingo.getDay() === 0 ? -6 : 1))
  console.log(`   Lunes calculado: ${lunesCalc.toISOString().split('T')[0]}`)
}

// Ejecutar la prueba corregida
testWeeklyRangeFixed()