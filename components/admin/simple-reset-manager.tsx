"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, AlertTriangle, CheckCircle, Users } from "lucide-react"

export function SimpleResetManager() {
  const [isClient, setIsClient] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetHistory, setResetHistory] = useState<Array<{
    date: string
    type: 'manual'
    user: string
    reason: string
  }>>([])

  useEffect(() => {
    setIsClient(true)
    // Cargar historial del localStorage
    const savedHistory = localStorage.getItem('resetHistory')
    if (savedHistory) {
      try {
        setResetHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Error loading reset history:', error)
      }
    }
  }, [])

  // Función segura para localStorage
  const safeLocalStorage = {
    getItem: (key: string) => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key)
      }
      return null
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value)
      }
    },
    removeItem: (key: string) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
      }
    }
  }

  const performManualReset = async (type: 'full' | 'individual', classroom?: string) => {
    const confirmMessages = {
      full: '⚠️ ¿Resetear TODAS las evaluaciones del día actual?\n\nEsta acción establece todos los valores a 0 para empezar un nuevo día.\n\nLos datos anteriores quedarán guardados por fecha.',
      individual: `⚠️ ¿Resetear evaluaciones del salón "${classroom}"?`
    }

    if (!confirm(confirmMessages[type])) {
      return
    }

    setIsResetting(true)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const currentUser = safeLocalStorage.getItem('staffName') || 'Admin'
      
      if (type === 'full') {
        // Reset completo del día
        safeLocalStorage.setItem('lastManualReset', today)
        safeLocalStorage.setItem('lastManualResetTime', new Date().toISOString())
        
        // Limpiar estados de evaluación
        safeLocalStorage.removeItem('currentEvaluations')
        safeLocalStorage.removeItem('pendingEvaluations')
        safeLocalStorage.removeItem('evaluationStates')
        
        // Agregar al historial
        const newEntry = {
          date: new Date().toLocaleString(),
          type: 'manual' as const,
          user: currentUser,
          reason: 'Reseteo completo del día'
        }
        const updatedHistory = [newEntry, ...resetHistory.slice(0, 4)]
        setResetHistory(updatedHistory)
        safeLocalStorage.setItem('resetHistory', JSON.stringify(updatedHistory))
        
        alert('✅ Reseteo diario completado.\n\nTodos los formularios mostrarán valores en 0.\nLos datos anteriores quedan guardados por fecha.')
        
      } else {
        // Reset individual por salón
        const evaluations = JSON.parse(safeLocalStorage.getItem('currentEvaluations') || '{}')
        const classroomKey = `${classroom}_${today}`
        
        delete evaluations[classroomKey]
        safeLocalStorage.setItem('currentEvaluations', JSON.stringify(evaluations))
        
        const newEntry = {
          date: new Date().toLocaleString(),
          type: 'manual' as const,
          user: currentUser,
          reason: `Reset individual: salón ${classroom}`
        }
        const updatedHistory = [newEntry, ...resetHistory.slice(0, 4)]
        setResetHistory(updatedHistory)
        safeLocalStorage.setItem('resetHistory', JSON.stringify(updatedHistory))
        
        alert(`✅ Evaluaciones del salón "${classroom}" reseteadas.`)
      }
      
    } catch (error) {
      console.error('Error en reseteo:', error)
      alert('❌ Error al realizar el reseteo. Por favor intenta de nuevo.')
    } finally {
      setIsResetting(false)
    }
  }

  const getResetStatus = () => {
    const lastReset = safeLocalStorage.getItem('lastManualReset')
    const today = new Date().toISOString().split('T')[0]
    const hasBeenResetToday = lastReset === today
    
    return {
      hasBeenResetToday,
      lastReset,
      today,
      needsReset: !hasBeenResetToday
    }
  }

  const resetStatus = getResetStatus()

  if (!isClient) {
    return (
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Cargando gestor de reseteo...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Reseteo Manual de Evaluaciones
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Para reiniciar los valores diarios cuando comience un nuevo día de evaluaciones
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado Actual */}
        <div className={`p-4 rounded-lg border ${
          resetStatus.hasBeenResetToday 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {resetStatus.hasBeenResetToday ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
            <span className="font-medium">
              {resetStatus.hasBeenResetToday ? 'Día ya reseteado' : 'Pendiente de reseteo'}
            </span>
          </div>
          <div className="text-sm space-y-1">
            <div>📅 Fecha actual: <strong>{resetStatus.today}</strong></div>
            {resetStatus.lastReset && (
              <div>🔄 Último reseteo: <strong>{resetStatus.lastReset}</strong></div>
            )}
            <div className="text-xs mt-2">
              {resetStatus.hasBeenResetToday 
                ? '✅ Los formularios están listos para nuevas evaluaciones'
                : '⚠️ Se recomienda resetear antes de empezar nuevas evaluaciones'
              }
            </div>
          </div>
        </div>

        {/* Botones de Reset */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Reseteo General</h4>
            <Button
              onClick={() => performManualReset('full')}
              disabled={isResetting}
              className="w-full"
              variant={resetStatus.needsReset ? "default" : "outline"}
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Reseteando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resetear Todas las Evaluaciones del Día
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Establece todos los valores a 0 para un nuevo día de evaluaciones
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Reset Individual por Salón</h4>
            <div className="grid grid-cols-2 gap-2">
              {['vida', 'luz', 'gracia', 'verdad'].map((classroom) => (
                <Button
                  key={classroom}
                  variant="outline"
                  size="sm"
                  onClick={() => performManualReset('individual', classroom)}
                  disabled={isResetting}
                  className="text-xs"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Resetear {classroom}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Para resetear solo un salón específico si hay problemas
            </p>
          </div>
        </div>

        {/* Historial de Reseteos */}
        {resetHistory.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Historial Reciente</h4>
            <div className="space-y-2">
              {resetHistory.map((entry, index) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded border">
                  <div className="font-medium">{entry.date}</div>
                  <div className="text-gray-600">
                    {entry.user} - {entry.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información Importante */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-700 mb-1">📋 Información Importante</h4>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• <strong>Cuándo resetear:</strong> Al comenzar un nuevo día de evaluaciones</li>
            <li>• <strong>Qué sucede:</strong> Todos los valores se establecen en 0</li>
            <li>• <strong>Seguridad:</strong> Los datos anteriores quedan guardados por fecha</li>
            <li>• <strong>Flexibilidad:</strong> Los maestros pueden seguir evaluando aunque no se resetee inmediatamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}