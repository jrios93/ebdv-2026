import { useState, useEffect } from 'react'

/**
 * Hook para recargar datos automáticamente cada N segundos
 * @param reloadFunction - Función que se ejecutará para recargar datos
 * @param intervalSeconds - Segundos entre recargas (default: 3)
 * @param enabled - Si está activo el auto-recarga (default: true)
 */
export function useAutoReload<T>(
  reloadFunction: () => Promise<T> | T,
  intervalSeconds: number = 3,
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Función para recargar datos
  const reload = async () => {
    if (!enabled) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await reloadFunction()
      setData(result)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error en auto-recarga:', err)
      setError(err instanceof Error ? err.message : 'Error al recargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Configurar intervalo de auto-recarga
  useEffect(() => {
    if (!enabled) return

    // Primera carga
    reload()

    const interval = setInterval(reload, intervalSeconds * 1000)

    return () => clearInterval(interval)
  }, [intervalSeconds, enabled]) // QUITAR reloadFunction de dependencias

  return {
    data,
    loading,
    lastUpdate,
    error,
    reload
  }
}