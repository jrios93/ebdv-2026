// Configuración global de timezone para toda la aplicación
export const TIMEZONE = 'America/Lima'
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
