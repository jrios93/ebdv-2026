"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StaffGuard } from "@/components/StaffGuard"
import { Search, ArrowLeft, Users, Star, Award, RotateCcw, Filter, CheckCircle, Clock, Zap } from "lucide-react"
import { getClassroomInfo } from "@/lib/classroom"
import {
  getAlumnosByClassroom,
  getClassroomIdByName,
  getPuntuacionIndividualHoy,
  type Alumno
} from "@/lib/supabaseQueries"

interface AlumnoConEstado extends Alumno {
  evaluado: boolean
  puntosHoy: number
}

export default function MaestrosClassroomPage({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
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

  // Función para cargar alumnos con su estado (memoizada)
  const loadAlumnosConEstado = useCallback(async () => {
    if (!classroomName || classroomName.trim() === '') return []

    try {
      const classroomId = await getClassroomIdByName(classroomName.trim())
      if (!classroomId) {
        console.error('Classroom no encontrado:', classroomName)
        return []
      }

      // Cargar alumnos del classroom
      const alumnosData = await getAlumnosByClassroom(classroomId)
      const today = new Date().toISOString().split('T')[0]

      // Para cada alumno, verificar si ya fue evaluado hoy
      const alumnosConEstado = await Promise.all(
        alumnosData.map(async (alumno: Alumno) => {
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

      return alumnosConEstado
    } catch (error) {
      console.error('Error loading alumnos:', error)
      return []
    }
  }, [classroomName])

  // Carga simple sin hooks complicados
  const [alumnos, setAlumnos] = useState<AlumnoConEstado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  const reload = useCallback(async () => {
    console.log('🔄 reload llamado')
    setIsLoading(true)
    try {
      const result = await loadAlumnosConEstado()
      console.log('📥 Resultado de loadAlumnosConEstado:', result)
      setAlumnos(result || [])
      setLastUpdate(new Date())
      console.log('✅ Estado actualizado')
    } catch (error) {
      console.error('❌ Error al recargar:', error)
    } finally {
      setIsLoading(false)
    }
  }, [loadAlumnosConEstado])
  
  // Carga inicial cuando classroomName cambia
  useEffect(() => {
    console.log('🔄 useEffect ejecutado con classroomName:', classroomName)
    if (classroomName) {
      console.log('📞 Llamando a reload...')
      reload()
    }
  }, [classroomName, reload])

  const filteredAlumnos = alumnos?.filter(alumno =>
    alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.apellidos.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const evaluadosCount = alumnos?.filter(a => a.evaluado).length || 0
  const pendientesCount = alumnos?.filter(a => !a.evaluado).length || 0

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
                    {alumnos?.length || 0} alumnos inscritos
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    <Award className="w-3 h-3 mr-1" />
                    {evaluadosCount} evaluados
                  </Badge>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                    <Users className="w-3 h-3 mr-1" />
                    {pendientesCount} pendientes
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/staff/maestros/${classroomName}/evaluacion-rapida`)}
                    className="h-8 px-3 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Zap className="w-3 h-3" />
                    Evaluación Rápida
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={reload}
                    disabled={isLoading}
                    className="h-8 px-3 text-xs gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {isLoading ? 'Actualizando...' : 'Actualizar'}
                  </Button>
                </div>
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

          {/* Tabs de filtrado */}
          <Tabs defaultValue="todos" className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="todos" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Todos ({alumnos?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pendientes" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pendientes ({pendientesCount})
              </TabsTrigger>
              <TabsTrigger value="evaluados" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Evaluados ({evaluadosCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todos">
              <AlumnosGrid alumnos={filteredAlumnos} classroomInfo={classroomInfo} classroomName={classroomName} />
            </TabsContent>

            <TabsContent value="pendientes">
              <AlumnosGrid 
                alumnos={filteredAlumnos.filter(alumno => !alumno.evaluado)} 
                classroomInfo={classroomInfo} 
                classroomName={classroomName}
              />
            </TabsContent>

            <TabsContent value="evaluados">
              <AlumnosGrid 
                alumnos={filteredAlumnos.filter(alumno => alumno.evaluado)} 
                classroomInfo={classroomInfo}
                classroomName={classroomName} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </StaffGuard>
  )
}

// Componente para la grid de alumnos
function AlumnosGrid({ alumnos, classroomInfo, classroomName }: { 
  alumnos: any[], 
  classroomInfo: any, 
  classroomName: string 
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {alumnos.map((alumno) => (
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
  )
}