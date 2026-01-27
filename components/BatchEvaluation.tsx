"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

import { Users, Zap, User, CheckCircle, Clock, AlertCircle, RefreshCw, Save, Undo2, Search, ArrowLeft, Clock as ClockIcon, Smile, Wrench, FileText, BookOpen, Users as UsersIcon, Minus, Plus } from "lucide-react"
import { getClassroomInfo } from "@/lib/classroom"
import { supabase } from "@/lib/supabase"

// Mapa de IDs a nombres de salones
const CLASSROOM_IDS: Record<string, string> = {
  "eda65bd9-dadd-4f74-954e-b952a91845a3": "vida",
  "d863c43d-9b83-494a-a88b-c3973a31bfd7": "luz",
  "9b8a58b3-6356-4b75-b28b-d5f5d8e596fd": "gracia",
  "5272477b-26a4-4179-a276-1c4730238974": "verdad"
}

// Opciones de puntuación para cada criterio
const PUNTUACION_OPTIONS = {
  actitud: [
    { value: 0, label: "No cumple", color: "text-red-600" },
    { value: 5, label: "Parcial", color: "text-yellow-600" },
    { value: 10, label: "Cumple", color: "text-green-600" }
  ],
  puntualidad_asistencia: [
    { value: 0, label: "No cumple", color: "text-red-600" },
    { value: 5, label: "Parcial", color: "text-yellow-600" },
    { value: 10, label: "Cumple", color: "text-green-600" }
  ],
  animo: [
    { value: 0, label: "No cumple", color: "text-red-600" },
    { value: 5, label: "Parcial", color: "text-yellow-600" },
    { value: 10, label: "Cumple", color: "text-green-600" }
  ],
  trabajo_manual: [
    { value: 0, label: "No cumple", color: "text-red-600" },
    { value: 5, label: "Parcial", color: "text-yellow-600" },
    { value: 10, label: "Cumple", color: "text-green-600" }
  ],
  verso_memoria: [
    { value: 0, label: "No cumple", color: "text-red-600" },
    { value: 15, label: "Parcial", color: "text-yellow-600" },
    { value: 30, label: "Cumple", color: "text-green-600" }
  ],
  aprestamiento_biblico: [
    { value: 0, label: "No cumple", color: "text-red-600" },
    { value: 15, label: "Parcial", color: "text-yellow-600" },
    { value: 30, label: "Cumple", color: "text-green-600" }
  ]
}

// Configuración de iconos para cada criterio
const CRITERION_ICONS = {
  puntualidad_asistencia: ClockIcon,
  actitud: Smile,
  animo: Smile,
  trabajo_manual: Wrench,
  verso_memoria: FileText,
  aprestamiento_biblico: BookOpen,
  invitados_hoy: UsersIcon
}

// Labels de los criterios
const CRITERION_LABELS = {
  puntualidad_asistencia: "Puntualidad",
  actitud: "Actitud",
  animo: "Ánimo",
  trabajo_manual: "Trabajo Manual",
  verso_memoria: "Verso Memoria",
  aprestamiento_biblico: "Aprest. Bíblico",
  invitados_hoy: "Visitas"
}

interface BatchEvaluationProps {
  classroomId: string
  maestroId: string
  alumnos: any[]
  onBack: () => void
}

export default function BatchEvaluation({ classroomId, maestroId, alumnos, onBack }: BatchEvaluationProps) {
  const [viewMode, setViewMode] = useState<"individual" | "batch">("batch")
  const [mainTab, setMainTab] = useState("basicos")
  const [subTab, setSubTab] = useState("puntualidad_asistencia")
  const [searchTerm, setSearchTerm] = useState("")
  const [autoSave, setAutoSave] = useState(true)
  const [loading, setLoading] = useState(false)
  const [evaluations, setEvaluations] = useState<Record<string, any>>({})
  const [recentSaves, setRecentSaves] = useState<Set<string>>(new Set())
  const [undoStack, setUndoStack] = useState<Array<{ alumnoId: string, field: string, oldValue: any }>>([])
  const [invitadosCount, setInvitadosCount] = useState<Record<string, number>>({})

  const classroomInfo = getClassroomInfo(CLASSROOM_IDS[classroomId] || "vida")
  const today = new Date().toISOString().split('T')[0]

  // Filtrar alumnos por búsqueda
  const filteredAlumnos = alumnos.filter(alumno =>
    alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.apellidos.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Establecer subtab inicial según el tab principal
  useEffect(() => {
    if (mainTab === "basicos") {
      setSubTab("puntualidad_asistencia")
    } else if (mainTab === "especiales") {
      setSubTab("trabajo_manual")
    } else {
      setSubTab("invitados_hoy")
    }
  }, [mainTab])

  // Cargar evaluaciones existentes SOLO del día de hoy
  useEffect(() => {
    const loadExistingEvaluations = async () => {
      if (!maestroId || alumnos.length === 0) return

      try {
        console.log('🔍 Cargando evaluaciones de HOY:', { maestroId, today, alumnoCount: alumnos.length })

        // IMPORTANTE: Solo cargar evaluaciones de HOY para no confundir con días anteriores
        const { data, error } = await supabase
          .from('puntuacion_individual_diaria')
          .select('*')
          .eq('maestro_registro_id', maestroId)
          .eq('fecha', today)  // <- Clave: SOLO fecha de hoy
          .in('alumno_id', alumnos.map(a => a.id))

        if (error) throw error

        console.log('📊 Evaluaciones de HOY encontradas:', data?.length || 0)

        // Si no hay evaluaciones de hoy, empezar con evaluaciones vacías (en 0)
        if (!data || data.length === 0) {
          console.log('🆕 Sin evaluaciones hoy - empezando desde 0')
          setEvaluations({})  // Evaluaciones vacías
          return
        }

        // Si hay evaluaciones de hoy, cargarlas
        const existingEvals = data.reduce((acc, evaluation) => {
          acc[evaluation.alumno_id] = evaluation
          return acc
        }, {} as Record<string, any>)

        console.log('✅ Evaluaciones de HOY cargadas:', Object.keys(existingEvals).length)
        setEvaluations(existingEvals)

        // Resumen para maestros
        const evaluadosCount = Object.keys(existingEvals).length
        const pendientesCount = alumnos.length - evaluadosCount
        console.log(`📋 Resumen: ${evaluadosCount} evaluados hoy, ${pendientesCount} pendientes`)

      } catch (error) {
        console.error('❌ Error loading evaluations:', error)
        toast.error('Error al cargar evaluaciones de hoy')
      }
    }

    loadExistingEvaluations()
  }, [alumnos, maestroId, today])

  // Auto-guardar evaluación
  const saveEvaluation = async (alumnoId: string, field: string, value: number) => {
    try {
      setLoading(true)

      const existingEvaluation = evaluations[alumnoId]
      const updateData = { [field]: value, maestro_registro_id: maestroId }

      if (existingEvaluation) {
        // Actualizar evaluación existente
        const { error } = await supabase
          .from('puntuacion_individual_diaria')
          .update(updateData)
          .eq('id', existingEvaluation.id)

        if (error) throw error

        setEvaluations(prev => ({
          ...prev,
          [alumnoId]: { ...prev[alumnoId], ...updateData }
        }))
      } else {
        // Crear nueva evaluación
        const { data, error } = await supabase
          .from('puntuacion_individual_diaria')
          .insert({
            alumno_id: alumnoId,
            fecha: today,
            ...updateData
          })
          .select()

        if (error) throw error

        setEvaluations(prev => ({
          ...prev,
          [alumnoId]: data[0]
        }))
      }

      // Mostrar toast de confirmación
      const alumno = alumnos.find(a => a.id === alumnoId)
      const criterionOption = PUNTUACION_OPTIONS[field as keyof typeof PUNTUACION_OPTIONS]?.find(opt => opt.value === value)

      toast.success(`✅ ${alumno?.nombre} - ${criterionOption?.label}`, {
        description: `${field} guardado automáticamente`
      })

      // Añadir a recent saves para feedback visual
      setRecentSaves(prev => new Set(prev).add(`${alumnoId}-${field}`))
      setTimeout(() => {
        setRecentSaves(prev => {
          const newSet = new Set(prev)
          newSet.delete(`${alumnoId}-${field}`)
          return newSet
        })
      }, 2000)

    } catch (error) {
      console.error('Error saving evaluation:', error)
      toast.error('Error al guardar evaluación')
    } finally {
      setLoading(false)
    }
  }

  // Manejar cambio en radio button
  const handleRadioChange = (alumnoId: string, field: string, value: number) => {
    // Guardar en undo stack
    const oldValue = evaluations[alumnoId]?.[field] || 0
    setUndoStack(prev => [...prev, { alumnoId, field, oldValue }])

    // Actualizar estado
    setEvaluations(prev => ({
      ...prev,
      [alumnoId]: {
        ...prev[alumnoId],
        [field]: value
      }
    }))

    // Auto-guardar si está activado
    if (autoSave) {
      saveEvaluation(alumnoId, field, value)
    }
  }

  // Deshacer último cambio
  const handleUndo = () => {
    if (undoStack.length === 0) {
      toast.info('No hay cambios para deshacer')
      return
    }

    const lastChange = undoStack[undoStack.length - 1]
    const { alumnoId, field, oldValue } = lastChange

    // Revertir valor
    setEvaluations(prev => ({
      ...prev,
      [alumnoId]: {
        ...prev[alumnoId],
        [field]: oldValue
      }
    }))

    // Eliminar del undo stack
    setUndoStack(prev => prev.slice(0, -1))

    // Guardar el valor revertido
    if (autoSave) {
      saveEvaluation(alumnoId, field, oldValue)
    }

    toast.info('↩️ Cambio deshecho')
  }

  // Guardar todas las evaluaciones pendientes
  const saveAllPending = async () => {
    try {
      setLoading(true)
      let savedCount = 0

      for (const alumno of alumnos) {
        const evaluationData = evaluations[alumno.id]
        if (!evaluationData) continue

        const existingEvaluation = evaluations[alumno.id]

        if (existingEvaluation?.id) {
          // Actualizar
          const { error } = await supabase
            .from('puntuacion_individual_diaria')
            .update(evaluationData)
            .eq('id', existingEvaluation.id)

          if (!error) savedCount++
        } else {
          // Crear
          const { error } = await supabase
            .from('puntuacion_individual_diaria')
            .insert({
              alumno_id: alumno.id,
              fecha: today,
              maestro_registro_id: maestroId,
              ...evaluationData
            })

          if (!error) savedCount++
        }
      }

      toast.success(`✅ ${savedCount} evaluaciones guardadas`)
    } catch (error) {
      console.error('Error saving all:', error)
      toast.error('Error al guardar evaluaciones')
    } finally {
      setLoading(false)
    }
  }

  // Obtener estadísticas
  const getStats = () => {
    const total = alumnos.length
    const evaluated = Object.keys(evaluations).length
    const pending = total - evaluated
    const completed = Object.values(evaluations).filter(evaluation =>
      evaluation.actitud !== undefined &&
      evaluation.puntualidad_asistencia !== undefined &&
      evaluation.animo !== undefined
    ).length

    return { total, evaluated, pending, completed }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Diseño mejorado */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold">Evaluación Rápida</h1>
            </div>

            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>

        {/* Estadísticas simplificadas */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6 text-base">
              <span className="font-medium">
                Total: <span className="text-blue-600">{stats.total}</span>
              </span>
              <span className="font-medium">
                Evaluados: <span className="text-green-600">{stats.evaluated}</span>
              </span>
              <span className="font-medium">
                Pendientes: <span className="text-orange-600">{stats.pending}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Buscador */}
        <Card className="shadow-sm mb-6">
          <CardContent className="flex items-center justify-center mx-auto p-4 w-full">
            <div className="relative flex-1 max-w-md md:w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre o apellido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

          </CardContent>
        </Card>

        {/* Vista Rápida (Batch) */}
        {viewMode === "batch" && (
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                  <TabsTrigger
                    value="basicos"
                    className="text-base py-3 px-4 h-auto min-h-[44px] font-medium"
                  >
                    Criterios Básicos
                  </TabsTrigger>
                  <TabsTrigger
                    value="especiales"
                    className="text-base py-3 px-4 h-auto min-h-[44px] font-medium"
                  >
                    Criterios Especiales
                  </TabsTrigger>
                  <TabsTrigger
                    value="visitas"
                    className="text-base py-3 px-4 h-auto min-h-[44px] font-medium"
                  >
                    Visitas
                  </TabsTrigger>
                </TabsList>

                {/* Criterios Básicos */}
                <TabsContent value="basicos" className="mt-6">
                  <div className="sticky top-0 bg-background z-20 pb-4 border-b">
                    <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                        <TabsTrigger
                          value="puntualidad_asistencia"
                          className="text-sm py-2 px-3 h-auto min-h-[40px] font-medium"
                        >
                          Puntualidad
                        </TabsTrigger>
                        <TabsTrigger
                          value="actitud"
                          className="text-sm py-2 px-3 h-auto min-h-[40px] font-medium"
                        >
                          Actitud
                        </TabsTrigger>
                        <TabsTrigger
                          value="animo"
                          className="text-sm py-2 px-3 h-auto min-h-[40px] font-medium"
                        >
                          Ánimo
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="mt-4">
                    {subTab === "puntualidad_asistencia" && (
                      <BatchCriterionTab
                        title="Puntualidad y Asistencia"
                        field="puntualidad_asistencia"
                        alumnos={filteredAlumnos}
                        evaluations={evaluations}
                        onRadioChange={handleRadioChange}
                        recentSaves={recentSaves}
                        options={PUNTUACION_OPTIONS.puntualidad_asistencia}
                      />
                    )}

                    {subTab === "actitud" && (
                      <BatchCriterionTab
                        title="Actitud"
                        field="actitud"
                        alumnos={filteredAlumnos}
                        evaluations={evaluations}
                        onRadioChange={handleRadioChange}
                        recentSaves={recentSaves}
                        options={PUNTUACION_OPTIONS.actitud}
                      />
                    )}

                    {subTab === "animo" && (
                      <BatchCriterionTab
                        title="Ánimo"
                        field="animo"
                        alumnos={filteredAlumnos}
                        evaluations={evaluations}
                        onRadioChange={handleRadioChange}
                        recentSaves={recentSaves}
                        options={PUNTUACION_OPTIONS.animo}
                      />
                    )}
                  </div>
                </TabsContent>

                {/* Criterios Especiales */}
                <TabsContent value="especiales" className="mt-6">
                  <div className="sticky top-0 bg-background z-20 pb-4 border-b">
                    <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                        <TabsTrigger
                          value="trabajo_manual"
                          className="text-sm py-2 px-3 h-auto min-h-[40px] font-medium"
                        >
                          Trabajo Manual
                        </TabsTrigger>
                        <TabsTrigger
                          value="verso_memoria"
                          className="text-sm py-2 px-3 h-auto min-h-[40px] font-medium"
                        >
                          Verso Memoria
                        </TabsTrigger>
                        <TabsTrigger
                          value="aprestamiento_biblico"
                          className="text-sm py-2 px-3 h-auto min-h-[40px] font-medium"
                        >
                          Aprest. Bíblico
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="mt-4">
                    {subTab === "trabajo_manual" && (
                      <BatchCriterionTab
                        title="Trabajo Manual"
                        field="trabajo_manual"
                        alumnos={filteredAlumnos}
                        evaluations={evaluations}
                        onRadioChange={handleRadioChange}
                        recentSaves={recentSaves}
                        options={PUNTUACION_OPTIONS.trabajo_manual}
                      />
                    )}

                    {subTab === "verso_memoria" && (
                      <BatchCriterionTab
                        title="Verso de Memoria"
                        field="verso_memoria"
                        alumnos={filteredAlumnos}
                        evaluations={evaluations}
                        onRadioChange={handleRadioChange}
                        recentSaves={recentSaves}
                        options={PUNTUACION_OPTIONS.verso_memoria}
                      />
                    )}

                    {subTab === "aprestamiento_biblico" && (
                      <BatchCriterionTab
                        title="Aprestamiento Bíblico"
                        field="aprestamiento_biblico"
                        alumnos={filteredAlumnos}
                        evaluations={evaluations}
                        onRadioChange={handleRadioChange}
                        recentSaves={recentSaves}
                        options={PUNTUACION_OPTIONS.aprestamiento_biblico}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="visitas" className="mt-6">
                  <div className="mt-4">
                    <BatchCriterionTab
                      title="Visitas e Invitados"
                      field="invitados_hoy"
                      alumnos={filteredAlumnos}
                      evaluations={evaluations}
                      onRadioChange={handleRadioChange}
                      recentSaves={recentSaves}
                      options={[]} // Sin opciones, usa botón clásico
                      isVisitas={true}
                      invitadosCount={invitadosCount}
                      onInvitadosChange={setInvitadosCount}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Vista Individual (Placeholder) */}
        {viewMode === "individual" && (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Vista Individual</h3>
              <p className="text-muted-foreground">
                Esta vista mostrará las tarjetas individuales de cada alumno como antes.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                (Implementación pendiente - por ahora usa la Vista Rápida)
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Componente para cada criterio con el nuevo diseño
interface BatchCriterionTabProps {
  title: string
  field: string
  alumnos: any[]
  evaluations: Record<string, any>
  onRadioChange: (alumnoId: string, field: string, value: number) => void
  recentSaves: Set<string>
  options: Array<{ value: number, label: string, color: string }>
  isVisitas?: boolean
  invitadosCount?: Record<string, number>
  onInvitadosChange?: React.Dispatch<React.SetStateAction<Record<string, number>>>
}

function BatchCriterionTab({
  title,
  field,
  alumnos,
  evaluations,
  onRadioChange,
  recentSaves,
  options,
  isVisitas = false,
  invitadosCount = {},
  onInvitadosChange
}: BatchCriterionTabProps) {

  // Obtener iconos de estado para cada alumno
  const getEstadoIconos = (alumno: any) => {
    const criterios = ['puntualidad_asistencia', 'actitud', 'animo', 'trabajo_manual', 'verso_memoria', 'aprestamiento_biblico']

    return criterios.map(criterio => {
      const evaluation = evaluations[alumno.id]
      const hasValue = evaluation?.[criterio] !== undefined && evaluation?.[criterio] !== null && evaluation?.[criterio] >= 0
      const Icon = CRITERION_ICONS[criterio as keyof typeof CRITERION_ICONS]

      // Debug para console
      if (alumno.nombre.includes('Mateo')) {
        console.log(`🐛 Debug ${alumno.nombre} - ${criterio}:`, {
          evaluation: evaluation,
          hasValue: hasValue,
          value: evaluation?.[criterio]
        })
      }

      // No mostrar icono de visitas
      if (criterio === 'invitados_hoy') return null

      return (
        <div key={criterio} title={`${CRITERION_LABELS[criterio as keyof typeof CRITERION_LABELS]}: ${hasValue ? 'Evaluado' : 'Pendiente'}`}>
          <Icon
            className={`w-4 h-4 ${hasValue ? 'text-orange-500' : 'text-gray-400 font-bold'}`}
          />
        </div>
      )
    }).filter(Boolean)
  }

  const handleInvitadosChange = (alumnoId: string, delta: number) => {
    if (onInvitadosChange) {
      const currentCount = invitadosCount[alumnoId] || 0
      const newCount = Math.max(0, currentCount + delta)
      onInvitadosChange(prev => ({
        ...prev,
        [alumnoId]: newCount
      }))

      // Auto-guardar invitados
      onRadioChange(alumnoId, 'invitados_hoy', newCount)
    }
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-background z-10 pb-4 border-b">
        <h3 className="text-xl font-bold">{title}</h3>
      </div>

      <div className="space-y-3">
        {alumnos.map((alumno) => {
          const evaluation = evaluations[alumno.id]
          const currentValue = evaluation?.[field]
          const isRecentlySaved = recentSaves.has(`${alumno.id}-${field}`)
          const estadoIconos = getEstadoIconos(alumno)
          const invitadosActuales = invitadosCount[alumno.id] || 0

          return (
            <div
              key={alumno.id}
              className={`p-4 bg-white border-2 rounded-lg transition-all duration-200 ${isRecentlySaved
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="w-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="font-semibold text-base truncate">
                      {alumno.nombre} {alumno.apellidos}
                    </span>
                  </div>

                  {!isVisitas && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {estadoIconos}
                    </div>
                  )}

                  {isRecentlySaved && (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                  )}
                </div>

                {isVisitas ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInvitadosChange(alumno.id, -1)}
                      className="px-3 py-2 rounded border border-gray-300 hover:border-gray-400 font-medium transition-all duration-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={invitadosActuales}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        if (onInvitadosChange) {
                          onInvitadosChange(prev => ({
                            ...prev,
                            [alumno.id]: value
                          }))
                          onRadioChange(alumno.id, 'invitados_hoy', value)
                        }
                      }}
                      className="w-16 px-3 py-2 border border-gray-300 rounded text-center font-medium"
                      min="0"
                      max="20"
                    />
                    <button
                      onClick={() => handleInvitadosChange(alumno.id, 1)}
                      className="px-3 py-2 rounded border border-gray-300 hover:border-gray-400 font-medium transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {isRecentlySaved && (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onRadioChange(alumno.id, field, option.value)}
                        className={`px-3 py-2 rounded border font-medium transition-all duration-200 min-w-[70px] ${currentValue === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          } ${option.color}`}
                        title={`${option.label} (${option.value} puntos)`}
                      >
                        <div className="text-xs font-medium leading-tight">
                          {option.label}
                        </div>
                        <div className="text-sm font-bold">
                          ({option.value})
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
