import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook para carga manual con control total del usuario
 * @param loadFunction - Función que se ejecutará para cargar datos
 * @param initialLoad - Si carga automáticamente al montar (default: true)
 */
export function useManualLoad<T>(
  loadFunction: () => Promise<T> | T,
  initialLoad: boolean = true
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Función para cargar datos (estable para evitar bucles)
  const reload = useRef<(() => Promise<void>) | null>(null)

  // Inicializar la función de recarga solo una vez
  if (!reload.current) {
    reload.current = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const result = await loadFunction()
        setData(result)
        setLastUpdate(new Date())
      } catch (err) {
        console.error('Error en carga manual:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }
  }

  // Carga inicial (se ejecuta solo una vez)
  useEffect(() => {
    if (initialLoad) {
      reload.current?.()
    }
  }, []) // Sin dependencias para evitar bucles

  return {
    data,
    loading,
    lastUpdate,
    error,
    reload: reload.current || (() => Promise.resolve())
  }
}