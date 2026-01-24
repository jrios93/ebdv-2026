"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import { StaffGuard } from "@/components/StaffGuard"
import { Search, Users, ArrowLeft, RefreshCw, UserCheck, AlertCircle } from "lucide-react"
import { 
  reasignarAlumnoASalon, 
  getAllClassrooms, 
  buscarAlumnosPorNombreONombrePadre,
  getAlumnosByClassroom,
  type Alumno 
} from "@/lib/supabaseQueries"


export default function AdminAlumnosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null)
  const [selectedClassroom, setSelectedClassroom] = useState("")
  const [esForzado, setEsForzado] = useState(false)
  const [isReasignando, setIsReasignando] = useState(false)
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [alumnosResults, setAlumnosResults] = useState<Alumno[]>([])
  const [currentClassroomId, setCurrentClassroomId] = useState("")
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const classroomsData = await getAllClassrooms()
      setClassrooms(classroomsData || [])
    }
    loadData()
  }, [])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const buscarAlumnos = async () => {
        const results = await buscarAlumnosPorNombreONombrePadre(searchTerm)
        setAlumnosResults(results || [])
      }
      
      const timeoutId = setTimeout(buscarAlumnos, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setAlumnosResults([])
    }
  }, [searchTerm])

  const handleReasignar = async () => {
    if (!selectedAlumno || !selectedClassroom) {
      setMessage({ type: 'error', text: 'Selecciona un alumno y un salón' })
      return
    }

    setIsReasignando(true)
    setMessage(null)

    try {
      const result = await reasignarAlumnoASalon(
        selectedAlumno.id, 
        selectedClassroom, 
        esForzado
      )

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `${selectedAlumno.nombre} ${selectedAlumno.apellidos} reasignado exitosamente al salón` 
        })
        
        // Limpiar selección
        setSelectedAlumno(null)
        setSelectedClassroom("")
        setEsForzado(false)
        setSearchTerm("")
        setAlumnosResults([])
      } else {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Error al reasignar alumno' 
        })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error al reasignar alumno' 
      })
    } finally {
      setIsReasignando(false)
    }
  }

  const handleSelectAlumno = (alumno: Alumno) => {
    setSelectedAlumno(alumno)
    setCurrentClassroomId(alumno.classroom_id || alumno.classroom_forzado_id || "")
    setSelectedClassroom("")
    setEsForzado(!!alumno.classroom_forzado_id)
  }

  const getCurrentClassroomName = () => {
    if (!currentClassroomId) return "Sin salón asignado"
    const classroom = classrooms.find(c => c.id === currentClassroomId)
    return classroom ? classroom.nombre : "Salón no encontrado"
  }

  return (
    <StaffGuard role="admin">
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/staff/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reasignación de Alumnos</h1>
              <p className="text-sm text-muted-foreground">
                Mueve un alumno a otro salón (función solo para administradores)
              </p>
            </div>
          </div>

          {/* Mensaje */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }`}>
              <div className={`flex items-center gap-2 ${message.type === 'error' ? 'text-red-700' : 'text-green-700'}`}>
                <AlertCircle className={`h-4 w-4`} />
                <p className="font-medium">{message.text}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Buscar y seleccionar alumno */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-500" />
                  Buscar Alumno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Buscar por nombre, apellido o nombre del padre
                  </label>
                  <Input
                    placeholder="Ej: Mateo, Pérez, Juan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Resultados de búsqueda */}
                {alumnosResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <p className="text-sm font-medium text-muted-foreground">
                      {alumnosResults.length} alumno(s) encontrado(s)
                    </p>
                    {alumnosResults.map((alumno) => (
                      <div
                        key={alumno.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAlumno?.id === alumno.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-border hover:bg-muted'
                        }`}
                        onClick={() => handleSelectAlumno(alumno)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {alumno.nombre} {alumno.apellidos}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Padre: {alumno.nombre_padre}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Edad: {alumno.edad} años
                            </p>
                          </div>
                          {alumno.classroom_forzado_id && (
                            <Badge variant="destructive" className="text-xs">
                              Forzado
                            </Badge>
                          )}
                        </div>
                        {alumno.classroom_id || alumno.classroom_forzado_id ? (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Salón actual: {getCurrentClassroomName()}
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-orange-600">
                            Sin salón asignado
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedAlumno && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                      <h3 className="font-medium text-blue-900">Alumno seleccionado</h3>
                    </div>
                    <div className="space-y-1">
                      <p><strong>Nombre:</strong> {selectedAlumno.nombre} {selectedAlumno.apellidos}</p>
                      <p><strong>Padre:</strong> {selectedAlumno.nombre_padre}</p>
                      <p><strong>Teléfono:</strong> {selectedAlumno.telefono}</p>
                      <p><strong>Salón actual:</strong> {getCurrentClassroomName()}</p>
                      {selectedAlumno.classroom_forzado_id && (
                        <p className="text-orange-600"><strong>⚠️ Asignación forzada</strong></p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selección de nuevo salón */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-green-500" />
                  Nuevo Salón
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAlumno ? (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Seleccionar nuevo salón
                      </label>
                      <select 
                        value={selectedClassroom} 
                        onChange={(e) => setSelectedClassroom(e.target.value)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Selecciona un salón...</option>
                        {classrooms.map((classroom) => (
                          <option 
                            key={classroom.id} 
                            value={classroom.id}
                            disabled={classroom.id === (selectedAlumno.classroom_id || selectedAlumno.classroom_forzado_id)}
                          >
                            {classroom.nombre} ({classroom.edad_min}-{classroom.edad_max} años)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="esForzado"
                        checked={esForzado}
                        onChange={(e) => setEsForzado(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="esForzado" className="text-sm">
                        Asignación forzada (use si hay inconvenientes)
                      </label>
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={handleReasignar}
                        disabled={!selectedAlumno || !selectedClassroom || isReasignando}
                        className="w-full"
                      >
                        {isReasignando ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Reasignando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reasignar Alumno
                          </>
                        )}
                      </Button>
                    </div>

                    {esForzado && (
                      <div className="border-orange-200 bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-orange-700">
                          <AlertCircle className="h-4 w-4" />
                          <div className="text-sm">
                            <strong>Atención:</strong> La asignación forzada se usa solo cuando hay 
                            inconvenientes y el alumno no puede asistir a su salón actual. 
                            El salón original quedará registrado para cuando se resuelva la situación.
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Selecciona primero un alumno de la lista de búsqueda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StaffGuard>
  )
}