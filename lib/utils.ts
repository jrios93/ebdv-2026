import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-exportar utilidades de fecha para facilitar el acceso
export * from './date/config'
export * from './date/utils'
