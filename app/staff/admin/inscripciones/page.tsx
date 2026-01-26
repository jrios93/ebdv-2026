"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { StaffGuard } from "@/components/StaffGuard"
import { Search, Users, ArrowLeft, RefreshCw, UserCheck, AlertCircle, Calendar, Filter } from "lucide-react"
import { useRealtimeInscripciones } from "@/hooks/useRealtimeInscripciones"
import { getAllClassrooms } from "@/lib/supabaseQueries"

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

export default function InscripcionesAdminPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("") // Iniciar vacío para mostrar todos
  const [classroomTab, setClassroomTab] = useState("todos")
  const [classrooms, setClassrooms] = useState<any[]>([])

  const { alumnos, loading, error, refrescar } = useRealtimeInscripciones({
    classroomFilter: classroomTab === "todos" ? undefined : classroomTab,
    dateFilter: selectedDate || undefined, // No pasar filtro si está vacío
    searchTerm: searchTerm.length >= 2 ? searchTerm : undefined
  })

  useEffect(() => {
    // Convertir las constantes a formato de array para los tabs
    const classroomsArray = Object.entries(CLASSROOM_NAMES).map(([name, id]) => ({
      id,
      nombre: name
    }))
    setClassrooms(classroomsArray)
  }, [])

  const getClassroomName = (alumno: any) => {
    // Usar el mapa predefinido de IDs a nombres
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
      porSalon: stats
    }
  }

  const stats = getStatsByClassroom()

  // Debug logs más detallados
  console.log('📊 Estado actual:', { 
    loading, 
    error, 
    alumnosCount: alumnos.length, 
    searchTerm, 
    selectedDate, 
    classroomTab,
    classroomsCount: classrooms.length 
  })
  
  console.log('🏢 CLASSROOM_IDS disponibles:', Object.keys(CLASSROOM_IDS))
  console.log('📋 CLASSROOM_NAMES disponibles:', Object.keys(CLASSROOM_NAMES))
  
  if (alumnos.length > 0) {
    console.log('👥 Primeros 3 alumnos con datos procesados:', alumnos.slice(0, 3).map(a => ({
      nombre: a.nombre,
      classroom_id: a.classroom_id,
      classroom_forzado_id: a.classroom_forzado_id,
      classroom_name: getClassroomName(a),
      fecha_inscripcion: a.fecha_inscripcion
    })))
  } else {
    console.log('❌ No hay alumnos para mostrar')
  }

  

  return (
    <StaffGuard role="admin">
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/staff/admin">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Inscripciones en Tiempo Real</h1>
                <p className="text-sm text-muted-foreground">
                  Monitoreo de inscripciones de alumnos actualizado automáticamente
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                <Users className="w-3 h-3 mr-1" />
                {stats.total} inscritos
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Calendar className="w-3 h-3 mr-1" />
                {stats.hoy} hoy
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={refrescar}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refrescar
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-500" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <Search className="w-3 h-3 inline mr-1" />
                    Buscar por nombre, apellido o padre
                  </label>
                  <Input
                    placeholder="Ej: Mateo, Pérez, Juan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Fecha de inscripción
                  </label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs por salón */}
          <Tabs value={classroomTab} onValueChange={setClassroomTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="todos">Todos ({stats.total})</TabsTrigger>
              {Object.entries(CLASSROOM_NAMES).map(([name, id]) => (
                <TabsTrigger key={id} value={id}>
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
}

function AlumnosList({ alumnos, loading, error, getClassroomName }: AlumnosListProps) {
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
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {alumnos.map((alumno) => (
            <div
              key={alumno.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-lg">
                      {alumno.nombre} {alumno.apellidos}
                    </span>
                    <Badge variant="secondary">
                      {alumno.edad} años
                    </Badge>
                    <Badge variant="outline">
                      {alumno.genero}
                    </Badge>
                    {alumno.classroom_forzado_id && (
                      <Badge variant="destructive" className="text-xs">
                        Forzado
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Padre:</strong> {alumno.nombre_padre}</p>
                    <p><strong>Teléfono:</strong> {alumno.telefono}</p>
                    {alumno.telefono_niño && (
                      <p><strong>Teléfono niño:</strong> {alumno.telefono_niño}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span><strong>Salón:</strong> {getClassroomName(alumno)}</span>
                      <span>•</span>
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}