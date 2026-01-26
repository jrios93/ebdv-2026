// Test para verificar la lógica del rango semanal
// Ejecuta esto para ver diferentes opciones

function testRangoSemanal() {
  console.log('🧪 Probando diferentes rangos semanales...\n')
  
  const today = new Date() // Domingo 26 de enero
  const monday = new Date(today)
  const dayOfWeek = monday.getDay()
  const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  monday.setDate(diff)
  
  const fechaInicio = monday.toISOString().split('T')[0]
  const fechaFinHoy = today.toISOString().split('T')[0]
  
  // Opción 1: Semana actual (lunes a hoy)
  console.log('📅 Opción 1 - Semana Actual:')
  console.log(`   Inicio: ${fechaInicio} (lunes)`)
  console.log(`   Fin: ${fechaFinHoy} (hoy domingo)`)
  console.log(`   Rango: ${fechaInicio} a ${fechaFinHoy}`)
  
  // Opción 2: Semana completa (lunes a domingo)
  const domingoSemana = new Date(monday)
  domingoSemana.setDate(monday.getDate() + 6) // Sumar 6 días para llegar al domingo
  
  const fechaFinSemana = domingoSemana.toISOString().split('T')[0]
  console.log('\n📅 Opción 2 - Semana Completa:')
  console.log(`   Inicio: ${fechaInicio} (lunes)`)
  console.log(`   Fin: ${fechaFinSemana} (domingo de esta semana)`)
  console.log(`   Rango: ${fechaInicio} a ${fechaFinSemana}`)
  
  // Opción 3: Fin de mes
  const finDeMes = new Date(today.getFullYear(), today.getMonth() + 1, 0) // Último día del mes
  const fechaFinMes = finDeMes.toISOString().split('T')[0]
  
  console.log('\n📅 Opción 3 - Fin de Mes:')
  console.log(`   Inicio: ${fechaInicio} (lunes)`)
  console.log(`   Fin: ${fechaFinMes} (fin de mes)`)
  console.log(`   Rango: ${fechaInicio} a ${fechaFinMes}`)
  
  console.log('\n🤔 ¿Cuál debería ser la fecha fin correcta?')
  console.log('   Opción 1: Exportar solo hasta hoy')
  console.log('   Opción 2: Exportar semana completa (lunes a domingo)')
  console.log('   Opción 3: Exportar hasta fin de mes')
  
  return { fechaInicio, fechaFinHoy, fechaFinSemana, fechaFinMes }
}

testRangoSemanal()