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
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <Link href="/staff/maestros" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-3 sm:mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a salones
            </Link>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${classroomInfo?.bgColor} ${classroomInfo?.borderColor} border-2 rounded-full flex items-center justify-center flex-shrink-0`}>
                  {classroomInfo?.icon && <classroomInfo.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${classroomInfo.textColor}`} />}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                    {classroomInfo?.name || classroomName}
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {alumnos?.length || 0} alumnos inscritos
                  </p>
                </div>
              </div>

              <div className="w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      <Award className="w-3 h-3 mr-1" />
                      {evaluadosCount} evaluados
                    </Badge>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                      <Users className="w-3 h-3 mr-1" />
                      {pendientesCount} pendientes
                    </Badge>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push(`/staff/maestros/${classroomName}/evaluacion-rapida`)}
                      className="h-8 px-3 text-xs gap-1 bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none min-h-[44px]"
                    >
                      <Zap className="w-3 h-3" />
                      <span className="hidden sm:inline">Evaluación Rápida</span>
                      <span className="sm:hidden">Eval. Rápida</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reload}
                      disabled={isLoading}
                      className="h-8 px-3 text-xs gap-1 flex-1 sm:flex-none min-h-[44px] whitespace-nowrap"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Actualizar</span>
                      <span className="sm:hidden">Actualizar</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar alumno por nombre o apellido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>

          {/* Tabs de filtrado */}
          <Tabs defaultValue="todos" className="mb-4 sm:mb-6">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-gray-100 rounded-lg gap-1">
              <TabsTrigger 
                value="todos" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2.5 px-2 h-auto min-h-[44px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Todos</span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                  {alumnos?.length || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="pendientes" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2.5 px-2 h-auto min-h-[44px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Pendientes</span>
                </div>
                <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                  {pendientesCount}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="evaluados" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2.5 px-2 h-auto min-h-[44px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Evaluados</span>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                  {evaluadosCount}
                </span>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      {alumnos.map((alumno) => (
        <Card key={alumno.id} className={`${classroomInfo?.borderColor} border-2 hover:shadow-lg transition-all duration-200`}>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg text-foreground truncate">
                  {alumno.nombre} {alumno.apellidos}
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {alumno.edad} años • {alumno.genero === "niño" ? "👦" : "👧"}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${alumno.evaluado ? 'bg-green-100' : 'bg-gray-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                {alumno.evaluado ? (
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                ) : (
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Puntuación hoy</span>
                {alumno.evaluado ? (
                  <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                    {alumno.puntosHoy} pts
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 text-xs">
                    No evaluado
                  </Badge>
                )}
              </div>
            </div>

            <Link href={`/staff/maestros/${classroomName}/${alumno.id}/evaluar`}>
              <Button 
                className={`w-full cursor-pointer min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm ${alumno.evaluado ? 'bg-secondary hover:bg-secondary' : 'bg-primary hover:bg-primary'} text-primary-foreground`}
                size="sm"
              >
                {alumno.evaluado ? "Ver Evaluación" : "Evaluar Alumno"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}