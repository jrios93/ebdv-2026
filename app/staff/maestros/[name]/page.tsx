"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StaffGuard } from "@/components/StaffGuard"
import { Search, ArrowLeft, Users, Star, Award } from "lucide-react"
import { getClassroomInfo } from "@/lib/classroom"
import {
  getAlumnosByClassroom,
  getClassroomIdByName,
  getPuntuacionIndividualHoy,
  type Alumno
} from "@/lib/supabaseQueries"
import { getAlumnosByClassroomId } from "@/lib/testAlumnos"

interface AlumnoConEstado extends Alumno {
  evaluado: boolean
  puntosHoy: number
}

export default function MaestrosClassroomPage({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [alumnos, setAlumnos] = useState<AlumnoConEstado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [classroomName, setClassroomName] = useState<string>("")

  // Manejar params asíncronos
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params
      setClassroomName(resolvedParams.name)
    }
    unwrapParams()
  }, [params])

  const classroomInfo = classroomName ? getClassroomInfo(classroomName) : null

  useEffect(() => {
    if (!classroomName) return

    const loadAlumnos = async () => {
      try {
        const classroomId = await getClassroomIdByName(classroomName)
        if (!classroomId) {
          console.error('Classroom no encontrado:', classroomName)
          setIsLoading(false)
          return
        }

        // Usar query directo para debug
        const alumnosData = await getAlumnosByClassroomId(classroomId)
        console.log("📊 Alumnos cargados:", alumnosData)
        const today = new Date().toISOString().split('T')[0]

        // Para cada alumno, verificar si ya fue evaluado hoy
        const alumnosConEstado = await Promise.all(
          alumnosData.map(async (alumno) => {
            const puntuacion = await getPuntuacionIndividualHoy(alumno.id, today)

            // Calcular puntos totales si fue evaluado
            const puntosHoy = puntuacion
              ? puntuacion.actitud +
              puntuacion.puntualidad_asistencia +
              puntuacion.animo +
              puntuacion.trabajo_manual +
              puntuacion.verso_memoria +
              puntuacion.aprestamiento_biblico
              : 0

            return {
              ...alumno,
              evaluado: !!puntuacion,
              puntosHoy
            }
          })
        )

        setAlumnos(alumnosConEstado)
      } catch (error) {
        console.error('Error loading alumnos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAlumnos()
  }, [classroomName])

  const filteredAlumnos = alumnos.filter(alumno =>
    alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.apellidos.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const evaluadosCount = alumnos.filter(a => a.evaluado).length
  const pendientesCount = alumnos.filter(a => !a.evaluado).length

  if (isLoading) {
    return (
      <StaffGuard role="any">
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando alumnos...</p>
          </div>
        </div>
      </StaffGuard>
    )
  }

  return (
    <StaffGuard role="maestro">
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/staff/maestros" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a salones
            </Link>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 ${classroomInfo?.bgColor} ${classroomInfo?.borderColor} border-2 rounded-full flex items-center justify-center`}>
                  {classroomInfo?.icon && <classroomInfo.icon className={`w-8 h-8 ${classroomInfo.textColor}`} />}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {classroomInfo?.name || classroomName}
                  </h1>
                  <p className="text-muted-foreground">
                    {alumnos.length} alumnos inscritos
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  <Award className="w-3 h-3 mr-1" />
                  {evaluadosCount} evaluados
                </Badge>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                  <Users className="w-3 h-3 mr-1" />
                  {pendientesCount} pendientes
                </Badge>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar alumno por nombre o apellido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-border  py-6"
              />
            </div>
          </div>

          {/* Alumnos Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredAlumnos.map((alumno) => (
              <Card key={alumno.id} className={`${classroomInfo?.borderColor} border-2 hover:shadow-lg transition-all duration-200`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-foreground">
                        {alumno.nombre} {alumno.apellidos}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {alumno.edad} años • {alumno.genero === "niño" ? "👦" : "👧"}
                      </p>
                    </div>
                    <div className={`w-10 h-10 ${alumno.evaluado ? 'bg-green-100' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                      {alumno.evaluado ? (
                        <Star className="w-5 h-5 text-green-600" />
                      ) : (
                        <Users className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Puntuación hoy</span>
                      {alumno.evaluado ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          {alumno.puntosHoy} pts
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          No evaluado
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Link href={`/staff/maestros/${classroomName}/${alumno.id}/evaluar`}>
                    <Button className={`w-full cursor-pointer ${alumno.evaluado ? 'bg-secondary hover:bg-secondary' : 'bg-primary hover:bg-primary'} text-primary-foreground`}>
                      {alumno.evaluado ? "Ver Evaluación" : "Evaluar Alumno"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredAlumnos.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No se encontraron alumnos
              </h3>
              <p className="text-muted-foreground">
                Intenta con otra búsqueda o verifica el salon correcto
              </p>
            </div>
          )}
        </div>
      </div>
    </StaffGuard>
  )
}
