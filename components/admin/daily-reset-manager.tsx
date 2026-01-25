"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface DailyResetStatus {
  needsReset: boolean
  lastResetDate: string | null
  todayDate: string
  nextResetIn: string | null
  systemStatus: 'ready' | 'needs-reset' | 'error'
}

export function DailyResetManager() {
  const [resetStatus, setResetStatus] = useState<DailyResetStatus>({
    needsReset: false,
    lastResetDate: null,
    todayDate: new Date().toISOString().split('T')[0],
    nextResetIn: null,
    systemStatus: 'ready'
  })
  const [isResetting, setIsResetting] = useState(false)
  const [lastManualReset, setLastManualReset] = useState<string | null>(null)

  useEffect(() => {
    checkResetStatus()
    
    // Check every 30 minutes
    const interval = setInterval(checkResetStatus, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const checkResetStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const storedResetDate = localStorage.getItem('lastEvaluationReset')
      
      // Verificar si hay evaluaciones de hoy
      const response = await fetch('/api/evaluations/today-check')
      const hasEvaluationsToday = await response.json()
      
      const needsReset = storedResetDate !== today && hasEvaluationsToday
      
      setResetStatus({
        needsReset,
        lastResetDate: storedResetDate,
        todayDate: today,
        nextResetIn: calculateTimeUntilMidnight(),
        systemStatus: needsReset ? 'needs-reset' : 'ready'
      })
      
    } catch (error) {
      console.error('Error checking reset status:', error)
      setResetStatus(prev => ({ ...prev, systemStatus: 'error' }))
    }
  }

  const calculateTimeUntilMidnight = (): string => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const diff = tomorrow.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  const performManualReset = async () => {
    if (!confirm('⚠️ ¿Estás seguro de resetear todas las evaluaciones del día? Esta acción es irreversible.')) {
      return
    }

    setIsResetting(true)
    try {
      // Clear frontend cache/states
      localStorage.setItem('lastEvaluationReset', new Date().toISOString().split('T')[0])
      localStorage.setItem('manualResetPerformed', new Date().toISOString())
      
      // Reset other cache items
      localStorage.removeItem('currentEvaluationStates')
      localStorage.removeItem('pendingEvaluations')
      
      setLastManualReset(new Date().toLocaleString())
      
      // Update status
      await checkResetStatus()
      
      alert('✅ Reseteo diario completado. Los formularios mostrarán valores en 0.')
      
    } catch (error) {
      console.error('Error performing manual reset:', error)
      alert('❌ Error al realizar el reseteo. Por favor intenta de nuevo.')
    } finally {
      setIsResetting(false)
    }
  }

  const resetIndividualClassroom = async (classroomName: string) => {
    if (!confirm(`¿Resetear evaluaciones para el salón ${classroomName}?`)) {
      return
    }

    try {
      // Clear specific classroom state
      const classroomStates = JSON.parse(localStorage.getItem('currentEvaluationStates') || '{}')
      delete classroomStates[classroomName]
      localStorage.setItem('currentEvaluationStates', JSON.stringify(classroomStates))
      
      alert(`✅ Evaluaciones de ${classroomName} reseteadas.`)
      
    } catch (error) {
      console.error('Error resetting classroom:', error)
      alert('❌ Error al resetear el salón.')
    }
  }

  const getStatusColor = () => {
    switch (resetStatus.systemStatus) {
      case 'ready': return 'text-green-600 bg-green-50 border-green-200'
      case 'needs-reset': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = () => {
    switch (resetStatus.systemStatus) {
      case 'ready': return <CheckCircle className="w-4 h-4" />
      case 'needs-reset': return <AlertCircle className="w-4 h-4" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusMessage = () => {
    switch (resetStatus.systemStatus) {
      case 'ready':
        return 'Sistema listo para nuevas evaluaciones'
      case 'needs-reset':
        return 'Se requiere reseteo para nuevo día de evaluaciones'
      case 'error':
        return 'Error verificando estado del sistema'
      default:
        return 'Verificando estado...'
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Gestión de Reseteo Diario
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado Actual */}
        <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon()}
            <span className="font-medium">Estado del Sistema</span>
          </div>
          <p className="text-sm">{getStatusMessage()}</p>
          
          <div className="mt-3 space-y-1 text-xs">
            <div>📅 Fecha actual: {resetStatus.todayDate}</div>
            {resetStatus.lastResetDate && (
              <div>🔄 Último reseteo: {resetStatus.lastResetDate}</div>
            )}
            {resetStatus.nextResetIn && (
              <div>⏰ Próximo reseteo automático en: {resetStatus.nextResetIn}</div>
            )}
            {lastManualReset && (
              <div>✋ Último reseteo manual: {lastManualReset}</div>
            )}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-3">
          <Button
            onClick={performManualReset}
            disabled={isResetting || !resetStatus.needsReset}
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
                Resetear Día Manualmente
              </>
            )}
          </Button>

          {!resetStatus.needsReset && (
            <p className="text-xs text-muted-foreground text-center">
              No se requiere reseteo actualmente. El sistema está listo.
            </p>
          )}
        </div>

        {/* Reset Individual por Salón */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Reset Individual por Salón</h4>
          <div className="grid grid-cols-2 gap-2">
            {['vida', 'luz', 'gracia', 'verdad'].map((classroom) => (
              <Button
                key={classroom}
                variant="outline"
                size="sm"
                onClick={() => resetIndividualClassroom(classroom)}
                className="text-xs"
              >
                Resetear {classroom}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Usa estos botones si necesitas resetear solo un salón específico.
          </p>
        </div>

        {/* Información */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-700 mb-1">📋 ¿Cómo funciona?</h4>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• <strong>Automático:</strong> El sistema detecta automáticamente el cambio de día</li>
            <li>• <strong>Manual:</strong> Botón para reseteo inmediato si es necesario</li>
            <li>• <strong>Individual:</strong> Reset específico por salón si hay problemas</li>
            <li>• <strong>Seguro:</strong> Los datos anteriores quedan guardados por fecha</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}