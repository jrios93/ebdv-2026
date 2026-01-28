import { TIMEZONE, LOCALE, DEFAULT_DATE_OPTIONS, DEFAULT_TIME_OPTIONS, DEFAULT_DATETIME_OPTIONS } from './config'

/**
 * Obtiene la fecha actual en el timezone configurado (America/Lima)
 */
export function getCurrentDate(): Date {
  return new Date()
}

/**
 * Obtiene la fecha actual formateada como YYYY-MM-DD en el timezone configurado
 */
export function getCurrentDateString(): string {
  return formatDateToString(getCurrentDate())
}

/**
 * Formatea una fecha al formato YYYY-MM-DD en el timezone configurado
 */
export function formatDateToString(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    ...DEFAULT_DATE_OPTIONS,
    timeZone: TIMEZONE
  }).split('/').reverse().join('-') // Formato DD/MM/YYYY -> YYYY-MM-DD
}

/**
 * Formatea una fecha para visualización en el timezone configurado
 */
export function formatDateForDisplay(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(LOCALE, {
    ...DEFAULT_DATE_OPTIONS,
    ...options
  })
}

/**
 * Formatea una hora para visualización en el timezone configurado
 */
export function formatTimeForDisplay(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleTimeString(LOCALE, {
    ...DEFAULT_TIME_OPTIONS,
    ...options
  })
}

/**
 * Formatea fecha y hora para visualización en el timezone configurado
 */
export function formatDateTimeForDisplay(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString(LOCALE, {
    ...DEFAULT_DATETIME_OPTIONS,
    ...options
  })
}

/**
 * Obtiene el inicio del día en el timezone configurado
 */
export function getStartOfDay(date?: Date): Date {
  const targetDate = date || getCurrentDate()
  const result = new Date(targetDate)
  
  // Obtener la fecha en el timezone configurado y establecer a medianoche
  const dateStr = formatDateToString(targetDate)
  const [year, month, day] = dateStr.split('-').map(Number)
  
  result.setFullYear(year, month - 1, day)
  result.setHours(0, 0, 0, 0)
  
  return result
}

/**
 * Obtiene el fin del día en el timezone configurado
 */
export function getEndOfDay(date?: Date): Date {
  const targetDate = date || getCurrentDate()
  const result = new Date(targetDate)
  
  // Obtener la fecha en el timezone configurado y establecer a 23:59:59.999
  const dateStr = formatDateToString(targetDate)
  const [year, month, day] = dateStr.split('-').map(Number)
  
  result.setFullYear(year, month - 1, day)
  result.setHours(23, 59, 59, 999)
  
  return result
}

/**
 * Convierte una fecha al formato ISO pero manteniendo el timezone local
 */
export function toISOStringLocal(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60000 // Offset en milisegundos
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, -1)
}

/**
 * Crea una fecha a partir de un string YYYY-MM-DD en el timezone configurado
 */
export function createDateFromString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date()
  date.setFullYear(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}

/**
 * Verifica si una fecha es hoy en el timezone configurado
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const todayStr = getCurrentDateString()
  const dateStr = formatDateToString(dateObj)
  return todayStr === dateStr
}
