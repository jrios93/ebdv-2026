// Configuración global de timezone para toda la aplicación
export const TIMEZONE = 'UTC-5'
export const LOCALE = 'es-PE'

// Opciones de formato por defecto
export const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}

export const DEFAULT_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}

export const DEFAULT_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}

// Función centralizada para obtener fecha actual en formato YYYY-MM-DD (Perú)
export function getFechaHoyPeru(): string {
  // Usar método más robusto con timezone específico
  return new Date().toLocaleDateString('en-CA', { 
    timeZone: 'America/Lima',
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }) // YYYY-MM-DD
}
