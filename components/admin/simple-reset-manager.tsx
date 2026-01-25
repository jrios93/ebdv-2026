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
      const today = new Date()
      const todayISO = today.toISOString().split('T')[0]
      const currentUser = safeLocalStorage.getItem('staffName') || 'Admin'
      
      if (type === 'full') {
        // Reset completo del día
        safeLocalStorage.setItem('lastManualReset', todayISO)
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
        const classroomKey = `${classroom}_${todayISO}`
        
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
    const today = new Date()
    const todayString = today.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).replace(/\//g, '-')
    const todayISO = today.toISOString().split('T')[0]
    
    // Para comparación, usamos ISO pero mostramos el formato legible
    const hasBeenResetToday = lastReset === todayISO
    
    return {
      hasBeenResetToday,
      lastReset,
      today: todayString,
      todayISO,
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
          <CheckCircle className="w-5 h-5 text-green-600" />
          Sistema de Evaluaciones Automático
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Los formularios inician automáticamente en valores predeterminados cada nuevo día
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-700">Sistema Automático Activo</span>
          </div>
          <div className="text-sm space-y-1">
            <div>✅ Formularios listos para evaluación diaria</div>
            <div>✅ Cada nuevo día inicia con valores predeterminados</div>
            <div>✅ Sin confusión entre días diferentes</div>
            <div>✅ Datos guardados correctamente por fecha</div>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-700 mb-1">📋 Información Importante</h4>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• <strong>Inicio automático:</strong> Los formularios inician con valores base cada día</li>
            <li>• <strong>Sobreescribir permitido:</strong> Se pueden modificar los valores al evaluar</li>
            <li>• <strong>Guardado por fecha:</strong> Cada día mantiene sus propios registros</li>
            <li>• <strong>No requiere intervención:</strong> Sin necesidad de reseteos manuales</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}