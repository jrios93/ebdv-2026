"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { StaffGuard } from "@/components/StaffGuard"
import { Search, Users, ArrowLeft, RefreshCw, UserCheck, AlertCircle, Calendar, Filter, CheckCircle, XCircle, Clock, Edit2, Save, X } from "lucide-react"
import { useRealtimeInscripciones } from "@/hooks/useRealtimeInscripciones"
import { getAllClassrooms } from "@/lib/supabaseQueries"
import { supabase } from "@/lib/supabase"
import { getClassroomInfo } from "@/lib/classroom"

// Mapa de IDs a nombres de salones (extraído de los archivos existentes)
const CLASSROOM_IDS: Record<string, string> = {
  "eda65bd9-dadd-4f74-954e-b952a91845a3": "vida",
  "d863c43d-9b83-494a-a88b-c3973a31bfd7": "luz",
  "9b8a58b3-6356-4b75-b28b-d5f5d8e596fd": "gracia",
  "5272477b-26a4-4179-a276-1c4730238974": "verdad"
}

// Mapa inverso de nombres a IDs
const CLASSROOM_NAMES: Record<string, string> = {
  "vida": "eda65bd9-dadd-4f74-954e-b952a91845a3",
  "luz": "d863c43d-9b83-494a-a88b-c3973a31bfd7",
  "gracia": "9b8a58b3-6356-4b75-b28b-d5f5d8e596fd",
  "verdad": "5272477b-26a4-4179-a276-1c4730238974"
}

export default function ReportesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("") // Iniciar vacío para mostrar todos
  const [classroomTab, setClassroomTab] = useState("todos")
  const [evaluacionesHoy, setEvaluacionesHoy] = useState<Set<string>>(new Set())
  const [editingAlumno, setEditingAlumno] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  // Crear una versión memoizada de los filtros para evitar re-renders innecesarios
  const filters = useCallback(() => ({
    classroomFilter: classroomTab === "todos" ? undefined : classroomTab,
    dateFilter: selectedDate || undefined,
    searchTerm: searchTerm.trim() || undefined
  }), [classroomTab, selectedDate, searchTerm])

  console.log('🔍 Filtros aplicados:', filters())

  const { alumnos, loading, error, refrescar } = useRealtimeInscripciones(filters())

  useEffect(() => {
    // Cargar evaluaciones del día para mostrar asistencia
    const cargarEvaluacionesHoy = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/evaluaciones-hoy?fecha=${today}`)
        if (response.ok) {
          const data = await response.json()
          const evaluados = new Set(data.map((e: any) => e.alumno_id) as string[])
          setEvaluacionesHoy(evaluados)
        }
      } catch (error) {
        console.error('Error cargando evaluaciones:', error)
      }
    }

    cargarEvaluacionesHoy()
  }, [])

  const getClassroomName = (alumno: any) => {
    // Verificar si es forzado primero
    if (alumno.classroom_forzado_id) {
      const name = CLASSROOM_IDS[alumno.classroom_forzado_id]
      return name ? `${name} (Forzado)` : `Salón forzado (ID: ${alumno.classroom_forzado_id.slice(0, 8)}...)`
    }

    // Salón normal
    if (alumno.classroom_id) {
      const name = CLASSROOM_IDS[alumno.classroom_id]
      return name || `Salón (ID: ${alumno.classroom_id.slice(0, 8)}...)`
    }

    return 'Sin salón asignado'
  }

  const getClassroomInfoForAlumno = (alumno: any) => {
    // Verificar si es forzado primero
    if (alumno.classroom_forzado_id) {
      const name = CLASSROOM_IDS[alumno.classroom_forzado_id]
      return name ? getClassroomInfo(name) : null
    }

    // Salón normal
    if (alumno.classroom_id) {
      const name = CLASSROOM_IDS[alumno.classroom_id]
      return name ? getClassroomInfo(name) : null
    }

    return null
  }

  const getAsistenciaStatus = (alumno: any) => {
    if (evaluacionesHoy.has(alumno.id)) {
      return { status: 'asistio', label: 'Asistió', color: 'text-green-600', icon: CheckCircle }
    }

    // Si es hoy y no ha sido evaluado, mostrar pendiente
    const today = new Date().toISOString().split('T')[0]
    const inscripcionDate = new Date(alumno.fecha_inscripcion).toISOString().split('T')[0]

    if (inscripcionDate === today) {
      return { status: 'reciente', label: 'Inscrito hoy', color: 'text-blue-600', icon: Clock }
    }

    return { status: 'pendiente', label: 'Sin validar', color: 'text-orange-600', icon: XCircle }
  }

  const getStatsByClassroom = () => {
    const stats = Object.values(CLASSROOM_NAMES).reduce((acc: any, classroomId) => {
      acc[classroomId] = alumnos.filter(a =>
        a.classroom_id === classroomId || a.classroom_forzado_id === classroomId
      ).length
      return acc
    }, {})

    return {
      total: alumnos.length,
      hoy: alumnos.filter(a =>
        new Date(a.fecha_inscripcion).toDateString() === new Date().toDateString()
      ).length,
      asistidosHoy: Array.from(evaluacionesHoy).filter(id =>
        alumnos.some(a => a.id === id)
      ).length,
      porSalon: stats
    }
  }

  const stats = getStatsByClassroom()

  const handleEditAlumno = (alumno: any) => {
    setEditingAlumno(alumno.id)
    setEditForm({
      nombre: alumno.nombre,
      apellidos: alumno.apellidos,
      edad: alumno.edad,
      genero: alumno.genero,
      nombre_padre: alumno.nombre_padre,
      telefono: alumno.telefono,
      telefono_niño: alumno.telefono_niño || ""
    })
  }

  const handleSaveAlumno = async () => {
    if (!editingAlumno) return

    try {
      const { error } = await supabase
        .from('alumnos')
        .update({
          nombre: editForm.nombre.trim(),
          apellidos: editForm.apellidos.trim(),
          edad: editForm.edad,
          genero: editForm.genero,
          nombre_padre: editForm.nombre_padre.trim(),
          telefono: editForm.telefono.trim(),
          telefono_niño: editForm.telefono_niño?.trim() || null
        })
        .eq('id', editingAlumno)

      if (error) {
        console.error('Error actualizando alumno:', error)
        alert('Error al actualizar los datos del alumno')
        return
      }

      setEditingAlumno(null)
      setEditForm({})
      refrescar()
      alert('✅ Datos actualizados exitosamente')
    } catch (error) {
      console.error('Error en actualización:', error)
      alert('Error al actualizar los datos')
    }
  }

  const handleCancelEdit = () => {
    setEditingAlumno(null)
    setEditForm({})
  }

  const handleEditChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <StaffGuard role="inscripciones">
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/staff" className="flex items-start justify-start text-start">
                  <Button variant="outline" size="lg" className="text-sm sm:text-base px-4 py-3 h-auto min-h-[44px]">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Volver
                  </Button>
                </Link>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">📊 Reportes Básicos</h1>
                  <p className="text-base text-muted-foreground">
                    Inscripciones y validación de asistencia en tiempo real
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-start lg:justify-center gap-3">
                <Badge variant="secondary" className="text-base py-3 px-5 h-auto min-h-[44px] flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {stats.total} inscritos
                </Badge>
                <Badge variant="destructive" className="text-base py-3 px-5 h-auto min-h-[44px] flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {stats.hoy} hoy
                </Badge>
                <Badge variant="default" className="text-base py-3 px-5 h-auto min-h-[44px] bg-green-100 text-green-700 border-green-300 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {stats.asistidosHoy} asistieron
                </Badge>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={refrescar}
                  disabled={loading}
                  className="text-sm sm:text-base px-5 py-3 h-auto min-h-[44px]"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refrescar
                </Button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Filter className="w-6 h-6 text-blue-500" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-base font-medium block text-gray-700">
                    <Search className="w-4 h-4 inline mr-2" />
                    Buscar por nombre, apellido o padre
                  </label>
                  <Input
                    placeholder="Ej: Mateo, Pérez, Juan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 text-base px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-base font-medium block text-gray-700">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Fecha de inscripción (dejar vacío para todos)
                  </label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-12 text-base px-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs por salón */}
          <Tabs value={classroomTab} onValueChange={setClassroomTab} className="w-full">
            <TabsList className="grid w-full h-auto p-1 bg-gray-100 rounded-lg grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
              <TabsTrigger
                value="todos"
                className="text-base sm:text-lg py-3 px-4 h-auto min-h-[48px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md font-medium"
              >
                Todos ({stats.total})
              </TabsTrigger>
              {Object.entries(CLASSROOM_NAMES).map(([name, id]) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="text-base sm:text-lg py-3 px-4 h-auto min-h-[48px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md font-medium"
                >
                  {name} ({stats.porSalon[id] || 0})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="todos" className="mt-6">
              <AlumnosList
                alumnos={alumnos}
                loading={loading}
                error={error}
                getClassroomName={getClassroomName}
                getClassroomInfoForAlumno={getClassroomInfoForAlumno}
                getAsistenciaStatus={getAsistenciaStatus}
                evaluacionesHoy={evaluacionesHoy}
                editingAlumno={editingAlumno}
                editForm={editForm}
                onEditAlumno={handleEditAlumno}
                onSaveAlumno={handleSaveAlumno}
                onCancelEdit={handleCancelEdit}
                onEditChange={handleEditChange}
              />
            </TabsContent>

            {Object.entries(CLASSROOM_NAMES).map(([name, id]) => (
              <TabsContent key={id} value={id} className="mt-6">
                <AlumnosList
                  alumnos={alumnos.filter(a =>
                    a.classroom_id === id || a.classroom_forzado_id === id
                  )}
                  loading={loading}
                  error={error}
                  getClassroomName={getClassroomName}
                  getClassroomInfoForAlumno={getClassroomInfoForAlumno}
                  getAsistenciaStatus={getAsistenciaStatus}
                  evaluacionesHoy={evaluacionesHoy}
                  editingAlumno={editingAlumno}
                  editForm={editForm}
                  onEditAlumno={handleEditAlumno}
                  onSaveAlumno={handleSaveAlumno}
                  onCancelEdit={handleCancelEdit}
                  onEditChange={handleEditChange}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </StaffGuard>
  )
}

interface AlumnosListProps {
  alumnos: any[]
  loading: boolean
  error: string | null
  getClassroomName: (alumno: any) => string
  getClassroomInfoForAlumno: (alumno: any) => any
  getAsistenciaStatus: (alumno: any) => { status: string, label: string, color: string, icon: any }
  evaluacionesHoy: Set<string>
  editingAlumno: string | null
  editForm: any
  onEditAlumno: (alumno: any) => void
  onSaveAlumno: () => void
  onCancelEdit: () => void
  onEditChange: (field: string, value: any) => void
}

function AlumnosList({
  alumnos,
  loading,
  error,
  getClassroomName,
  getClassroomInfoForAlumno,
  getAsistenciaStatus,
  evaluacionesHoy,
  editingAlumno,
  editForm,
  onEditAlumno,
  onSaveAlumno,
  onCancelEdit,
  onEditChange
}: AlumnosListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Cargando inscripciones...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (alumnos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay inscripciones para mostrar con los filtros seleccionados</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-green-500" />
          Lista de Alumnos Inscritos ({alumnos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-h-[800px] overflow-y-auto pr-2">
          {alumnos.map((alumno) => {
            const asistencia = getAsistenciaStatus(alumno)
            const IconComponent = asistencia.icon
            const isEditing = editingAlumno === alumno.id
            const classroomInfo = getClassroomInfoForAlumno(alumno)
            const ClassroomIcon = classroomInfo?.icon
            const cardColors = classroomInfo || {
              borderColor: 'border-gray-200',
              bgColor: 'bg-white',
              hoverColor: 'hover:border-blue-300 hover:bg-blue-50/50'
            }

            return (
              <div
                key={alumno.id}
                className={`p-6 ${cardColors.bgColor} border-2 ${cardColors.borderColor} rounded-xl ${cardColors.hoverColor} transition-all duration-200 shadow-sm hover:shadow-md relative overflow-hidden`}
              >
                {/* Color indicator bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${classroomInfo ? classroomInfo.bgColor + ' ' + classroomInfo.textColor : 'bg-gray-200'}`}></div>

                <div className="flex items-start justify-between ml-3">
                  <div className="flex-1">
                    {/* Header con nombre y acciones */}
                    <div className="space-y-3 mb-3">
                      {/* Fila principal: icono, nombre y botón de editar */}
                      <div className="flex items-start gap-3">
                        {/* Icono del salón */}
                        {classroomInfo && (
                          <div className={`p-2 ${classroomInfo.bgColor} rounded-lg border ${classroomInfo.borderColor} flex-shrink-0`}>
                            <ClassroomIcon className={`w-5 h-5 ${classroomInfo.textColor}`} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex flex-col sm:flex-row items-start gap-2">
                              <Input
                                value={editForm.nombre}
                                onChange={(e) => onEditChange('nombre', e.target.value)}
                                className="w-full h-10 text-base"
                                placeholder="Nombre"
                              />
                              <Input
                                value={editForm.apellidos}
                                onChange={(e) => onEditChange('apellidos', e.target.value)}
                                className="w-full h-10 text-base"
                                placeholder="Apellidos"
                              />
                            </div>
                          ) : (
                            <span className="font-semibold text-lg sm:text-xl text-gray-900 block">
                              {alumno.nombre} {alumno.apellidos}
                            </span>
                          )}
                        </div>

                        {/* Botones de acción siempre visibles */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={onSaveAlumno}
                                className="h-8 px-2 min-h-[32px]"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Guardar</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={onCancelEdit}
                                className="h-8 px-2 min-h-[32px]"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditAlumno(alumno)}
                              className="h-8 px-2 min-h-[32px]"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Segunda fila: badges informativos */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs px-2 py-1 h-auto min-h-[28px]">
                          {isEditing ? (
                            <select
                              value={editForm.edad}
                              onChange={(e) => onEditChange('edad', parseInt(e.target.value))}
                              className="bg-transparent border-none outline-none text-xs font-medium"
                            >
                              {[...Array(13)].map((_, i) => {
                                const age = i + 3
                                return (
                                  <option key={age} value={age}>{age} años</option>
                                )
                              })}
                            </select>
                          ) : (
                            `${alumno.edad} años`
                          )}
                        </Badge>

                        <Badge variant="outline" className="text-xs px-2 py-1 h-auto min-h-[28px]">
                          {isEditing ? (
                            <select
                              value={editForm.genero}
                              onChange={(e) => onEditChange('genero', e.target.value)}
                              className="bg-transparent border-none outline-none text-xs font-medium"
                            >
                              <option value="niño">Niño</option>
                              <option value="niña">Niña</option>
                            </select>
                          ) : (
                            alumno.genero
                          )}
                        </Badge>

                        {alumno.classroom_forzado_id && (
                          <Badge variant="destructive" className="text-xs px-2 py-1 h-auto min-h-[28px]">
                            Forzado
                          </Badge>
                        )}

                        <Badge
                          variant={asistencia.status === 'asistio' ? 'default' : 'outline'}
                          className={`text-xs px-2 py-1 h-auto min-h-[28px] ${asistencia.status === 'asistio' ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
                        >
                          <IconComponent className={`w-3 h-3 mr-1 ${asistencia.color}`} />
                          {asistencia.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Información del alumno */}
                    <div className="text-sm text-muted-foreground space-y-2">
                      {isEditing ? (
                        <>
                          <div className="flex items-center gap-2">
                            <strong>Padre:</strong>
                            <Input
                              value={editForm.nombre_padre}
                              onChange={(e) => onEditChange('nombre_padre', e.target.value)}
                              className="flex-1"
                              placeholder="Nombre del padre"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <strong>Teléfono:</strong>
                            <Input
                              value={editForm.telefono}
                              onChange={(e) => onEditChange('telefono', e.target.value)}
                              className="flex-1"
                              placeholder="Teléfono del padre"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <strong>Teléfono niño:</strong>
                            <Input
                              value={editForm.telefono_niño || ''}
                              onChange={(e) => onEditChange('telefono_niño', e.target.value)}
                              className="flex-1"
                              placeholder="Teléfono del niño (opcional)"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <p><strong>Padre:</strong> {alumno.nombre_padre}</p>
                          <p><strong>Teléfono:</strong> {alumno.telefono}</p>
                          {alumno.telefono_niño && (
                            <p><strong>Teléfono niño:</strong> {alumno.telefono_niño}</p>
                          )}
                        </>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className={`font-medium ${classroomInfo ? classroomInfo.textColor : 'text-gray-600'}`}>
                          <strong>Salón:</strong> {getClassroomName(alumno)}
                        </span>
                        <span className="hidden sm:flex">•</span>
                        <span>
                          <strong>Inscrito:</strong> {new Date(alumno.fecha_inscripcion).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
