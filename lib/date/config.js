// Configuración de timezone
export const TIMEZONE = 'UTC-5' // UTC-5 = Perú
export const LOCALE = 'es-PE'

// Opciones de formato por defecto
export const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}

// Opciones de formato para hora
export const DEFAULT_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}

// Función principal para obtener fecha actual en formato YYYY-MM-DD (Perú)
export function getFechaHoyPeru(): string {
  // Usar método simple y confiable para timezone Perú
  const now = new Date()
  const offset = -5 // Perú es UTC-5
  
  // Crear fecha Perú ajustada
  const peruTime = new Date(now.getTime() + offset * 60 * 60 * 1000)
  
  // Retornar en formato YYYY-MM-DD
  const year = peruTime.getFullYear()
  const month = String(peruTime.getMonth() + 1).padStart(2, '0')
  const day = String(peruTime.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}