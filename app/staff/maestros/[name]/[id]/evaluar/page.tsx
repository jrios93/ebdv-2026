"use client"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StaffGuard } from "@/components/StaffGuard"
import { ArrowLeft, Users, Star, CheckCircle, Clock, Save } from "lucide-react"
import { getClassroomInfo } from "@/lib/classroom"
import { 
  getAlumnoById, 
  savePuntuacionIndividual, 
  getPuntuacionIndividualHoy 
} from "@/lib/supabaseQueries"

interface EvaluationForm {
  actitud: 0 | 5 | 10
  puntualidad_asistencia: 0 | 5 | 10
  animo: 0 | 5 | 10
  trabajo_manual: 0 | 5 | 10
  verso_memoria: 0 | 15 | 30
  aprestamiento_biblico: 0 | 15 | 30
  invitados_hoy: number
}

export default function EvaluarAlumnoPage({ params }: { params: Promise<{ name: string; id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const classroomName = resolvedParams.name
  const alumnoId = resolvedParams.id
  const [alumno, setAlumno] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationForm>({
    actitud: 5,
    puntualidad_asistencia: 5,
    animo: 5,
    trabajo_manual: 5,
    verso_memoria: 15,
    aprestamiento_biblico: 15,
    invitados_hoy: 0
  })

  const classroomInfo = getClassroomInfo(classroomName)

  useEffect(() => {
    const loadAlumnoYPuntuacion = async () => {
      if (!alumnoId) return
      try {
        // Cargar datos del alumno
        const alumnoData = await getAlumnoById(alumnoId)
        setAlumno(alumnoData)

        // Verificar si ya tiene puntuación hoy
      if (!alumnoId) return
      const today = new Date().toISOString().split('T')[0]
        const puntuacionExistente = await getPuntuacionIndividualHoy(alumnoId, today)
        
        if (puntuacionExistente) {
          // Cargar evaluación existente
          setEvaluation({
            actitud: puntuacionExistente.actitud as 0 | 5 | 10,
            puntualidad_asistencia: puntuacionExistente.puntualidad_asistencia as 0 | 5 | 10,
            animo: puntuacionExistente.animo as 0 | 5 | 10,
            trabajo_manual: puntuacionExistente.trabajo_manual as 0 | 5 | 10,
            verso_memoria: puntuacionExistente.verso_memoria as 0 | 15 | 30,
            aprestamiento_biblico: puntuacionExistente.aprestamiento_biblico as 0 | 15 | 30,
            invitados_hoy: puntuacionExistente.invitados_hoy
          })
        }
      } catch (error) {
        console.error('Error loading alumno:', error)
      }
    }

    loadAlumnoYPuntuacion()
  }, [alumnoId])

  const calculateTotal = () => {
    return evaluation.actitud + 
           evaluation.puntualidad_asistencia + 
           evaluation.animo + 
           evaluation.trabajo_manual + 
           evaluation.verso_memoria + 
           evaluation.aprestamiento_biblico
  }

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: "Excelente", color: "bg-green-100 text-green-700 border-green-300" }
    if (score >= 75) return { grade: "Muy Bueno", color: "bg-blue-100 text-blue-700 border-blue-300" }
    if (score >= 60) return { grade: "Bueno", color: "bg-yellow-100 text-yellow-700 border-yellow-300" }
    return { grade: "Mejorable", color: "bg-red-100 text-red-700 border-red-300" }
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Obtener classroom_id y maestro_id (del localStorage o auth)
      const classroomId = await (await import('@/lib/supabaseQueries')).getClassroomIdByName(classroomName)
      const maestroId = localStorage.getItem('staffUserId') || null
      
      if (!classroomId) {
        throw new Error('Classroom no encontrado')
      }

        const puntuacionData: any = {
          alumno_id: alumnoId,
          fecha: new Date().toISOString().split('T')[0],
          actitud: evaluation.actitud,
          puntualidad_asistencia: evaluation.puntualidad_asistencia,
          animo: evaluation.animo,
          trabajo_manual: evaluation.trabajo_manual,
          verso_memoria: evaluation.verso_memoria,
          aprestamiento_biblico: evaluation.aprestamiento_biblico,
          invitados_hoy: evaluation.invitados_hoy,
        }
        
        // Solo incluir maestro_registro_id si es un UUID válido
        if (maestroId && maestroId !== 'temp-maestro-id') {
          puntuacionData.maestro_registro_id = maestroId
        }

      // Primero intentar guardar, si ya existe, actualizarlo
      const { savePuntuacionIndividual, updatePuntuacionIndividual, getPuntuacionIndividualHoy } = await import('@/lib/supabaseQueries')
      const existente = await getPuntuacionIndividualHoy(alumnoId, puntuacionData.fecha)
      
      let success
      if (existente) {
        // Actualizar el registro existente
        success = await updatePuntuacionIndividual(existente.id, puntuacionData)
      } else {
        // Crear nuevo registro
        success = await savePuntuacionIndividual(puntuacionData)
      }
      
      if (success) {
          router.push(`/staff/maestros/${classroomName}`)
      } else {
        throw new Error('Error al guardar puntuación')
      }
    } catch (error) {
      console.error('Error saving evaluation:', error)
      // Mostrar error al usuario
    } finally {
      setIsSaving(false)
    }
  }

  const TabSelector = ({ 
    label, 
    field, 
    options 
  }: { 
    label: string
    field: keyof EvaluationForm
    options: { value: number; label: string }[] 
  }) => (
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-foreground">{label}</h4>
      <div className="flex gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={evaluation[field] === option.value ? "default" : "outline"}
            size="sm"
            className={`flex-1 ${evaluation[field] === option.value ? 'bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}
            onClick={() => setEvaluation(prev => ({ ...prev, [field]: option.value as any }))}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )

  if (!alumno) {
    return (
      <StaffGuard role="maestro">
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando datos del alumno...</p>
          </div>
        </div>
      </StaffGuard>
    )
  }

  const totalScore = calculateTotal()
  const grade = getGrade(totalScore)

  return (
    <StaffGuard role="maestro">
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/staff/maestros/${classroomName}`} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a lista de alumnos
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Evaluación Individual
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span className="text-lg font-medium text-foreground">
                      {alumno.nombre} {alumno.apellidos}
                    </span>
                  </div>
                  <Badge variant="outline" className={classroomInfo.borderColor}>
                    {classroomInfo.name}
                  </Badge>
                  <Badge variant="outline">
                    {alumno.edad} años • {alumno.genero === "niño" ? "👦" : "👧"}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Puntuación Total</div>
                <div className="text-3xl font-bold text-foreground">{totalScore}</div>
                <Badge className={grade.color}>
                  {grade.grade}
                </Badge>
              </div>
            </div>
          </div>

          {/* Evaluación Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Criterios Básicos (0-10 pts)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TabSelector
                  label="Actitud"
                  field="actitud"
                  options={[
                    { value: 0, label: "No cumple (0)" },
                    { value: 5, label: "Parcial (5)" },
                    { value: 10, label: "Cumple (10)" }
                  ]}
                />
                
                <TabSelector
                  label="Puntualidad y Asistencia"
                  field="puntualidad_asistencia"
                  options={[
                    { value: 0, label: "No cumple (0)" },
                    { value: 5, label: "Parcial (5)" },
                    { value: 10, label: "Cumple (10)" }
                  ]}
                />
                
                <TabSelector
                  label="Ánimo y Participación"
                  field="animo"
                  options={[
                    { value: 0, label: "No cumple (0)" },
                    { value: 5, label: "Parcial (5)" },
                    { value: 10, label: "Cumple (10)" }
                  ]}
                />
                
                <TabSelector
                  label="Trabajo Manual"
                  field="trabajo_manual"
                  options={[
                    { value: 0, label: "No cumple (0)" },
                    { value: 5, label: "Parcial (5)" },
                    { value: 10, label: "Cumple (10)" }
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  Criterios Especiales (0-30 pts)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TabSelector
                  label="Verso de Memoria"
                  field="verso_memoria"
                  options={[
                    { value: 0, label: "No recita (0)" },
                    { value: 15, label: "Parcial (15)" },
                    { value: 30, label: "Completo (30)" }
                  ]}
                />
                
                <TabSelector
                  label="Aprestamiento Bíblico"
                  field="aprestamiento_biblico"
                  options={[
                    { value: 0, label: "No cumple (0)" },
                    { value: 15, label: "Parcial (15)" },
                    { value: 30, label: "Cumple (30)" }
                  ]}
                />
                
                <div className="space-y-2">
                  <label className="font-medium text-sm text-foreground">
                    Invitados Hoy
                  </label>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((num) => (
                      <Button
                        key={num}
                        type="button"
                        variant={evaluation.invitados_hoy === num ? "default" : "outline"}
                        size="sm"
                        className={`flex-1 ${evaluation.invitados_hoy === num ? 'bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}
                        onClick={() => setEvaluation(prev => ({ ...prev, invitados_hoy: num }))}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Link href={`/staff/maestros/${classroomName}`}>
              <Button variant="outline" className="border-border text-muted-foreground">
                Cancelar
              </Button>
            </Link>
            
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary text-primary-foreground"
            >
              {isSaving ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Evaluación
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </StaffGuard>
  )
}