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
import { getFechaHoyPeru } from "@/lib/date/config"

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
    { value: 0, label: "Ausente", color: "text-red-600" },
    { value: 5, label: "Tardío", color: "text-yellow-600" },
    { value: 10, label: "Presente", color: "text-green-600" }
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
  const today = getFechaHoyPeru()

  // Filtrar alumnos por búsqueda y asistencia
  const filteredAlumnos = alumnos.filter(alumno => {
    // Filtro de búsqueda
    const matchesSearch = alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alumno.apellidos.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro de asistencia: mostrar alumnos con puntualidad_asistencia >= 5 (presentes o tardíazos)
    // EXCEPTO en el tab de puntualidad (donde se registra la asistencia)
    const evaluation = evaluations[alumno.id]
    const hasAssistance = evaluation && evaluation.puntualidad_asistencia >= 5
    const showInOtherTabs = subTab === "puntualidad_asistencia" || hasAssistance
    
    return matchesSearch && showInOtherTabs
  })

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
        console.log('🔍 Cargando evaluaciones de HOY:', { today, alumnoCount: alumnos.length, maestroId })
        console.log('📝 NOTA: Filtrando por maestro_registro_id para mostrar solo evaluaciones del maestro actual')

        // IMPORTANTE: Solo cargar evaluaciones de HOY y del maestro actual
        console.log('📝 FILTRANDO por maestro_registro_id:', maestroId)
        const { data, error } = await supabase
          .from('puntuacion_individual_diaria')
          .select('*')
          .eq('fecha', today)  // <- Clave: SOLO fecha de hoy
          .eq('maestro_registro_id', maestroId)  // <- Filtrar por maestro actual
          .in('alumno_id', alumnos.map(a => a.id))

        if (error) throw error

        console.log('📊 Evaluaciones de HOY encontradas:', data?.length || 0)

        // Si no hay evaluaciones de hoy, iniciar con valores por defecto (0 = ausente)
        if (!data || data.length === 0) {
          console.log('🆕 Sin evaluaciones hoy - iniciando con valores por defecto (0 = ausente)')
          
          // Crear evaluaciones por defecto para todos los alumnos
          const defaultEvaluations = alumnos.reduce((acc, alumno) => {
            acc[alumno.id] = {
              alumno_id: alumno.id,
              fecha: today,
              puntualidad_asistencia: 0,    // Ausente por defecto
              actitud: 0,                   // No cumple por defecto
              animo: 0,                     // No cumple por defecto
              trabajo_manual: 0,            // No cumple por defecto
              verso_memoria: 0,             // No cumple por defecto
              aprestamiento_biblico: 0,     // No cumple por defecto
              invitados_hoy: 0,             // Sin invitados por defecto
            }
            return acc
          }, {} as Record<string, any>)
          
          // NO guardar automáticamente - mostrar valores por defecto pero esperar acción
          console.log('📋 Mostrando evaluaciones por defecto (esperando acción del maestro)')
          setEvaluations(defaultEvaluations)
          console.log(`✅ Creadas ${Object.keys(defaultEvaluations).length} evaluaciones por defecto en memoria local`)
          console.log('⏸️ Esperando acción del maestro para guardar en BD')
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

      console.log(`🔄 Guardando ${alumnoId} - ${field}: ${value}`, { existingEvaluation, updateData })

      if (existingEvaluation?.id) {
        // Actualizar evaluación existente - VERIFICAR SI TIENE ID
        console.log('📝 Actualizando evaluación existente:', existingEvaluation.id)
        const { data, error } = await supabase
          .from('puntuacion_individual_diaria')
          .update(updateData)
          .eq('id', existingEvaluation.id)
          .select()

        if (error) {
          console.error('❌ Error actualizando:', error)
          throw error
        }

        setEvaluations(prev => ({
          ...prev,
          [alumnoId]: { ...prev[alumnoId], ...updateData, id: data[0].id }
        }))
      } else {
        // Crear nueva evaluación con todos los campos por defecto
        console.log('➕ Creando nueva evaluación')
        const fullEvaluation = {
          alumno_id: alumnoId,
          fecha: today,
          puntualidad_asistencia: 0,
          actitud: 0,
          animo: 0,
          trabajo_manual: 0,
          verso_memoria: 0,
          aprestamiento_biblico: 0,
          invitados_hoy: 0,
          ...updateData  // Sobrescribe el campo específico que se está guardando
        }
        
        const { data, error } = await supabase
          .from('puntuacion_individual_diaria')
          .insert(fullEvaluation)
          .select()

        if (error) {
          console.error('❌ Error insertando:', error)
          throw error
        }

        setEvaluations(prev => ({
          ...prev,
          [alumnoId]: data[0]
        }))
      }

      // Mostrar indicador visual en lugar de toast
      const alumno = alumnos.find(a => a.id === alumnoId)
      const criterionOption = PUNTUACION_OPTIONS[field as keyof typeof PUNTUACION_OPTIONS]?.find(opt => opt.value === value)

      console.log(`✅ ${alumno?.nombre} - ${criterionOption?.label} - ${field} guardado automáticamente`)

      // Añadir a recent saves para feedback visual extendido
      setRecentSaves(prev => new Set(prev).add(`${alumnoId}-${field}`))
      setTimeout(() => {
        setRecentSaves(prev => {
          const newSet = new Set(prev)
          newSet.delete(`${alumnoId}-${field}`)
          return newSet
        })
      }, 3000) // Aumentado a 3 segundos para mejor visibilidad

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
            .update({
              ...evaluationData,
              maestro_registro_id: maestroId  // Asegurar que se incluya
            })
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
    const present = Object.values(evaluations).filter(e => e.puntualidad_asistencia >= 5).length
    const pending = total - present
    const completed = Object.values(evaluations).filter(evaluation =>
      evaluation.actitud !== undefined &&
      evaluation.puntualidad_asistencia !== undefined &&
      evaluation.animo !== undefined
    ).length

    return { total, evaluated, present, pending, completed }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Diseño responsivo */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              <h1 className="text-xl sm:text-2xl font-bold">Evaluación Rápida</h1>
            </div>

            <Button variant="outline" size="sm" onClick={onBack} className="w-full sm:w-auto min-h-[44px] px-4 py-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>

        {/* Estadísticas responsivas */}
        <Card className="shadow-sm mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 text-center sm:text-left">
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-xl font-semibold text-blue-600">{stats.total}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-xl font-semibold text-green-600">{stats.present}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Presentes</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-xl font-semibold text-yellow-600">{stats.evaluated}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Evaluados</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-xl font-semibold text-orange-600">{stats.pending}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Ausentes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buscador responsivo */}
        <Card className="shadow-sm mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="relative w-full max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre o apellido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vista Rápida (Batch) */}
        {viewMode === "batch" && (
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
                 <div className="bg-gray-100 rounded-lg p-1 overflow-x-auto">
                   <TabsList className="grid w-full min-w-max grid-cols-3 h-auto bg-transparent p-0 gap-1">
                     <TabsTrigger
                       value="basicos"
                       className="text-xs sm:text-sm py-2.5 px-2 sm:px-3 h-auto min-h-[40px] sm:min-h-[44px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md whitespace-nowrap"
                     >
                       Básicos
                     </TabsTrigger>
                     <TabsTrigger
                       value="especiales"
                       className="text-xs sm:text-sm py-2.5 px-2 sm:px-3 h-auto min-h-[40px] sm:min-h-[44px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md whitespace-nowrap"
                     >
                       Especiales
                     </TabsTrigger>
                     <TabsTrigger
                       value="visitas"
                       className="text-xs sm:text-sm py-2.5 px-2 sm:px-3 h-auto min-h-[40px] sm:min-h-[44px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md whitespace-nowrap"
                     >
                       Visitas
                     </TabsTrigger>
                   </TabsList>
                 </div>

                {/* Criterios Básicos */}
                <TabsContent value="basicos" className="mt-6">
                  <div className="sticky top-0 bg-background z-20 pb-4 border-b">
                    <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
                      <div className="bg-gray-100 rounded-lg p-1 overflow-x-auto">
                        <TabsList className="grid w-full min-w-max grid-cols-3 h-auto bg-transparent p-0 gap-1">
                           <TabsTrigger
                             value="puntualidad_asistencia"
                             className="text-xs py-2 px-2 h-auto min-h-[36px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md whitespace-nowrap"
                           >
                             Asistencia
                             <div className="text-xs text-muted-foreground block">
                               Punt.
                             </div>
                           </TabsTrigger>
                          <TabsTrigger
                            value="actitud"
                            className="text-xs py-2 px-2 h-auto min-h-[36px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md whitespace-nowrap"
                          >
                            Actitud
                          </TabsTrigger>
                          <TabsTrigger
                            value="animo"
                            className="text-xs py-2 px-2 h-auto min-h-[36px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md whitespace-nowrap"
                          >
                            Ánimo
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </Tabs>
                  </div>

                   <div className="mt-4">
                     {subTab === "puntualidad_asistencia" && (
                       <div>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            💡 <strong>Registro de Asistencia</strong>: 
                            <br />• Todos los alumnos empiezan como "Ausente (0)"
                            <br />• Cambia a "Presente (10)" si llegó a tiempo
                            <br />• Cambia a "Tardío (5)" si llegó tarde
                            <br />✅ Solo alumnos presentes aparecerán en las demás pestañas.
                          </p>
                        </div>
                         <BatchCriterionTab
                           title="Puntualidad y Asistencia"
                           field="puntualidad_asistencia"
                           alumnos={filteredAlumnos}
                           evaluations={evaluations}
                           onRadioChange={handleRadioChange}
                           recentSaves={recentSaves}
                           options={PUNTUACION_OPTIONS.puntualidad_asistencia}
                         />
                       </div>
                     )}

                     {subTab === "actitud" && (
                       <div>
                         {filteredAlumnos.length === 0 ? (
                           <div className="text-center py-12">
                             <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                             <h3 className="text-lg font-semibold text-gray-600 mb-2">
                               No hay alumnos presentes para evaluar
                             </h3>
                             <p className="text-gray-500 mb-4">
                               Ve a la pestaña "Puntualidad" y marca la asistencia de los alumnos primero.
                             </p>
                             <Button 
                               onClick={() => setSubTab("puntualidad_asistencia")}
                               variant="outline"
                             >
                               Ir a Puntualidad
                             </Button>
                           </div>
                         ) : (
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
                       </div>
                     )}

                     {subTab === "animo" && (
                       <div>
                         {filteredAlumnos.length === 0 ? (
                           <div className="text-center py-12">
                             <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                             <h3 className="text-lg font-semibold text-gray-600 mb-2">
                               No hay alumnos presentes para evaluar
                             </h3>
                             <p className="text-gray-500 mb-4">
                               Ve a la pestaña "Puntualidad" y marca la asistencia de los alumnos primero.
                             </p>
                             <Button 
                               onClick={() => setSubTab("puntualidad_asistencia")}
                               variant="outline"
                             >
                               Ir a Puntualidad
                             </Button>
                           </div>
                         ) : (
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
                     )}
                  </div>
                </TabsContent>

                {/* Criterios Especiales */}
                <TabsContent value="especiales" className="mt-6">
                  <div className="sticky top-0 bg-background z-20 pb-4 border-b">
                    <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
                      <div className="bg-gray-100 rounded-lg p-1 overflow-x-auto">
                        <TabsList className="grid w-full min-w-max grid-cols-3 h-auto bg-transparent p-0 gap-1">
                          <TabsTrigger
                            value="trabajo_manual"
                            className="text-xs py-2 px-2 h-auto min-h-[36px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md whitespace-nowrap"
                          >
                            Trabajo Manual
                          </TabsTrigger>
                          <TabsTrigger
                            value="verso_memoria"
                            className="text-xs py-2 px-2 h-auto min-h-[36px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md whitespace-nowrap"
                          >
                            Verso Memoria
                          </TabsTrigger>
                          <TabsTrigger
                            value="aprestamiento_biblico"
                            className="text-xs py-2 px-2 h-auto min-h-[36px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md whitespace-nowrap"
                          >
                            Aprest. Bíblico
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </Tabs>
                  </div>

                   <div className="mt-4">
                     {subTab === "trabajo_manual" && (
                       <div>
                         {filteredAlumnos.length === 0 ? (
                           <div className="text-center py-12">
                             <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                             <h3 className="text-lg font-semibold text-gray-600 mb-2">
                               No hay alumnos presentes para evaluar
                             </h3>
                             <p className="text-gray-500 mb-4">
                               Ve a la pestaña "Básicos" → "Puntualidad" y marca la asistencia de los alumnos primero.
                             </p>
                             <Button 
                               onClick={() => {setMainTab("basicos"); setSubTab("puntualidad_asistencia")}}
                               variant="outline"
                             >
                               Ir a Puntualidad
                             </Button>
                           </div>
                         ) : (
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
                       </div>
                     )}

                     {subTab === "verso_memoria" && (
                       <div>
                         {filteredAlumnos.length === 0 ? (
                           <div className="text-center py-12">
                             <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                             <h3 className="text-lg font-semibold text-gray-600 mb-2">
                               No hay alumnos presentes para evaluar
                             </h3>
                             <p className="text-gray-500 mb-4">
                               Ve a la pestaña "Básicos" → "Puntualidad" y marca la asistencia de los alumnos primero.
                             </p>
                             <Button 
                               onClick={() => {setMainTab("basicos"); setSubTab("puntualidad_asistencia")}}
                               variant="outline"
                             >
                               Ir a Puntualidad
                             </Button>
                           </div>
                         ) : (
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
                       </div>
                     )}

                     {subTab === "aprestamiento_biblico" && (
                       <div>
                         {filteredAlumnos.length === 0 ? (
                           <div className="text-center py-12">
                             <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                             <h3 className="text-lg font-semibold text-gray-600 mb-2">
                               No hay alumnos presentes para evaluar
                             </h3>
                             <p className="text-gray-500 mb-4">
                               Ve a la pestaña "Básicos" → "Puntualidad" y marca la asistencia de los alumnos primero.
                             </p>
                             <Button 
                               onClick={() => {setMainTab("basicos"); setSubTab("puntualidad_asistencia")}}
                               variant="outline"
                             >
                               Ir a Puntualidad
                             </Button>
                           </div>
                         ) : (
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
                     )}
                  </div>
                </TabsContent>

                 <TabsContent value="visitas" className="mt-6">
                   <div className="mt-4">
                     {filteredAlumnos.length === 0 ? (
                       <div className="text-center py-12">
                         <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                         <h3 className="text-lg font-semibold text-gray-600 mb-2">
                           No hay alumnos presentes para registrar visitas
                         </h3>
                         <p className="text-gray-500 mb-4">
                           Marca asistencia en "Básicos" → "Asistencia" primero.
                         </p>
                         <Button 
                           onClick={() => {setMainTab("basicos"); setSubTab("puntualidad_asistencia")}}
                           variant="outline"
                         >
                           Ir a Asistencia
                         </Button>
                       </div>
                     ) : (
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
                     )}
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
    <div className="space-y-3 sm:space-y-4">
      <div className="sticky top-0 bg-background z-10 pb-3 sm:pb-4 border-b">
        <h3 className="text-lg sm:text-xl font-bold">{title}</h3>
      </div>

      <div className="space-y-2 sm:space-y-3 px-1">
        {alumnos.map((alumno) => {
          const evaluation = evaluations[alumno.id]
          const currentValue = evaluation?.[field]
          const isRecentlySaved = recentSaves.has(`${alumno.id}-${field}`)
          const estadoIconos = getEstadoIconos(alumno)
          const invitadosActuales = invitadosCount[alumno.id] || 0

          return (
             <div
               key={alumno.id}
               className={`p-3 sm:p-4 bg-white border-2 rounded-lg transition-all duration-200 ${isRecentlySaved
                 ? 'border-green-300 bg-green-50'
                 : 'border-gray-200 hover:border-gray-300'
                 }`}
             >
               <div className="w-full">
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                   <div className="flex items-center gap-2 flex-1 min-w-0">
                     <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                       <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                     </div>
                     <span className="font-semibold text-sm sm:text-base truncate">
                       {alumno.nombre} {alumno.apellidos}
                     </span>
                   </div>

                   <div className="flex items-center justify-between sm:justify-end gap-2">
                     {!isVisitas && (
                       <div className="flex items-center gap-1 flex-shrink-0">
                         {estadoIconos}
                       </div>
                     )}

                   {isRecentlySaved && (
                     <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-medium animate-pulse">
                       <CheckCircle className="w-3 h-3" />
                       <span className="hidden sm:inline">Guardado</span>
                     </div>
                   )}
                   </div>
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
                       <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-medium animate-pulse ml-2">
                         <CheckCircle className="w-3 h-3" />
                         <span className="hidden sm:inline">Guardado</span>
                       </div>
                     )}
                  </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                      {options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => onRadioChange(alumno.id, field, option.value)}
                          className={`px-2 py-2 sm:px-3 sm:py-2 rounded border font-medium transition-all duration-200 min-w-[60px] sm:min-w-[70px] ${currentValue === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            } ${option.color}`}
                          title={`${option.label} (${option.value} puntos)`}
                        >
                          <div className="text-xs font-medium leading-tight">
                            {option.label}
                          </div>
                          <div className="text-xs sm:text-sm font-bold">
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
