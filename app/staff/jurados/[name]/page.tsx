"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StaffGuard } from "@/components/StaffGuard"
import { ArrowLeft, Users, Trophy, Star, Clock, Save } from "lucide-react"
import { getClassroomInfo } from "@/lib/classroom"
import { 
  savePuntuacionGrupal, 
  getPuntuacionGrupalHoy,
  getClassroomIdByName 
} from "@/lib/supabaseQueries"
import { PreguntasSelector } from "@/components/ui/preguntas-selector"
import { ScoreSelector } from "@/components/ui/score-selector"

interface GrupalEvaluationForm {
  puntualidad: 0 | 5 | 10
  animo_y_barras: 0 | 10 | 20
  orden: 0 | 10 | 20
  verso_memoria: 0 | 10 | 20
  preguntas_correctas: 0 | 5 | 10 | 15 | 20 | 25 | 30
}

export default function JuradosClassroomPage({ params }: { params: Promise<{ name: string }> }) {
  const [classroomName, setClassroomName] = useState("")

  // Manejar params asíncronos
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params
      const className = resolvedParams.name
      setClassroomName(className)
      
      // Cargar puntuación existente
      try {
        const today = new Date().toISOString().split('T')[0]
        const classroomId = await getClassroomIdByName(classroomName)
        if (!classroomId) {
          console.error('Classroom ID no encontrado para:', className)
          return
        }
        
        const puntuacionExistente = await getPuntuacionGrupalHoy(classroomId, today)
        
        if (puntuacionExistente) {
          setEvaluation({
            puntualidad: puntuacionExistente.puntualidad as 0 | 5 | 10,
            animo_y_barras: puntuacionExistente.animo_y_barras as 0 | 10 | 20,
            orden: puntuacionExistente.orden as 0 | 10 | 20,
            verso_memoria: puntuacionExistente.verso_memoria as 0 | 10 | 20,
            preguntas_correctas: puntuacionExistente.preguntas_correctas as 0 | 5 | 10 | 15 | 20 | 25 | 30
          })
        }
      } catch (error) {
        console.error('Error loading puntuacion existente:', error)
      } finally {
        setLoading(false)
      }
    }
    unwrapParams()
  }, [params])
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [evaluation, setEvaluation] = useState<GrupalEvaluationForm>({
    puntualidad: 0,
    animo_y_barras: 0,
    orden: 0,
    verso_memoria: 0,
    preguntas_correctas: 0
  })

  const classroomInfo = classroomName ? getClassroomInfo(classroomName) : null

  // Eliminado el useEffect duplicado - ahora la carga se hace en el useEffect principal

  const calculateTotal = () => {
    return evaluation.puntualidad +
      evaluation.animo_y_barras +
      evaluation.orden +
      evaluation.verso_memoria +
      evaluation.preguntas_correctas
  }

  const getGrade = (score: number) => {
    const maxScore = 90 // Maximum possible score
    const percentage = (score / maxScore) * 100

    if (percentage >= 90) return { grade: "Excelente", color: "bg-green-100 text-green-700 border-green-300" }
    if (percentage >= 75) return { grade: "Muy Bueno", color: "bg-blue-100 text-blue-700 border-blue-300" }
    if (percentage >= 60) return { grade: "Bueno", color: "bg-yellow-100 text-yellow-700 border-yellow-300" }
    return { grade: "Mejorable", color: "bg-red-100 text-red-700 border-red-300" }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // Obtener classroom_id y jurado_id
      const classroomId = await getClassroomIdByName(classroomName)
      // Omitir jurado_registro_id por ahora (se agregará autenticación después)

      if (!classroomId) {
        throw new Error('Classroom no encontrado')
      }

      const puntuacionData = {
        classroom_id: classroomId,
        fecha: new Date().toISOString().split('T')[0],
        puntualidad: evaluation.puntualidad,
        animo_y_barras: evaluation.animo_y_barras,
        orden: evaluation.orden,
        verso_memoria: evaluation.verso_memoria,
        preguntas_correctas: evaluation.preguntas_correctas,
        // jurado_registro_id: se omitirá temporalmente
      }

      const success = await savePuntuacionGrupal(puntuacionData)

      if (success) {
        router.push("/staff/jurados")
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
    options,
    description
  }: {
    label: string
    field: keyof GrupalEvaluationForm
    options: { value: number; label: string }[]
    description?: string
  }) => (
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-foreground">{label}</h4>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
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

  const totalScore = calculateTotal()
  const grade = getGrade(totalScore)
  const maxScore = 90
  const percentage = Math.round((totalScore / maxScore) * 100)

  return (
    <StaffGuard role="jurado">
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/staff/jurados" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a salones
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Puntuación Grupal
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className={`w-12 h-12 ${classroomInfo?.bgColor} ${classroomInfo?.borderColor} border-2 rounded-full flex items-center justify-center`}>
                    {classroomInfo?.icon && <classroomInfo.icon className={`w-6 h-6 ${classroomInfo.textColor} `} />}
                  </div>
                  <Badge className={classroomInfo?.borderColor}>
                    {classroomInfo?.name || classroomName}
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-muted-foreground">Puntuación Total</div>
                <div className="text-3xl font-bold text-foreground">{totalScore}/{maxScore}</div>
                <div className="text-lg text-muted-foreground">{percentage}%</div>
                <Badge className={grade.color}>
                  {grade.grade}
                </Badge>
              </div>
            </div>
          </div>

          {/* Evaluación Grupal Form */}
          <Card className="border-border mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Criterios de Evaluación Grupal
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Evalúa el desempeño general del salón en las diferentes categorías
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <ScoreSelector
                value={evaluation.puntualidad}
                onChange={(value) => setEvaluation(prev => ({ ...prev, puntualidad: value as 0 | 5 | 10 }))}
                disabled={isSaving}
                label="Puntualidad"
                description="Puntualidad del salón al inicio de la actividad"
                options={[
                  { value: 0, label: "Tarde (0 pts)" },
                  { value: 5, label: "Parcial (5 pts)" },
                  { value: 10, label: "A tiempo (10 pts)" }
                ]}
              />

              <ScoreSelector
                value={evaluation.animo_y_barras}
                onChange={(value) => setEvaluation(prev => ({ ...prev, animo_y_barras: value as 0 | 10 | 20 }))}
                disabled={isSaving}
                label="Ánimo y Barras"
                description="Participación y entusiasmo del salón"
                options={[
                  { value: 0, label: "Bajo (0 pts)" },
                  { value: 10, label: "Regular (10 pts)" },
                  { value: 20, label: "Excelente (20 pts)" }
                ]}
              />

              <ScoreSelector
                value={evaluation.orden}
                onChange={(value) => setEvaluation(prev => ({ ...prev, orden: value as 0 | 10 | 20 }))}
                disabled={isSaving}
                label="Orden"
                description="Comportamiento y disciplina durante la actividad"
                options={[
                  { value: 0, label: "Desordenado (0 pts)" },
                  { value: 10, label: "Parcial (10 pts)" },
                  { value: 20, label: "Ordenado (20 pts)" }
                ]}
              />

              <ScoreSelector
                value={evaluation.verso_memoria}
                onChange={(value) => setEvaluation(prev => ({ ...prev, verso_memoria: value as 0 | 10 | 20 }))}
                disabled={isSaving}
                label="Verso de Memoria"
                description="Memorización y recitación del verso bíblico"
                options={[
                  { value: 0, label: "No recitó (0 pts)" },
                  { value: 10, label: "Parcial (10 pts)" },
                  { value: 20, label: "Completo (20 pts)" }
                ]}
              />

              <PreguntasSelector
                value={evaluation.preguntas_correctas}
                onChange={(value) => setEvaluation(prev => ({ ...prev, preguntas_correctas: value as 0 | 5 | 10 | 15 | 20 | 25 | 30 }))}
                disabled={isSaving}
              />
            </CardContent>
          </Card>

          {/* Score Summary */}
          <Card className="border-border mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-500" />
                Resumen de Puntuación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">{evaluation.puntualidad}</div>
                  <div className="text-xs text-muted-foreground">Puntualidad</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{evaluation.animo_y_barras}</div>
                  <div className="text-xs text-muted-foreground">Ánimo</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{evaluation.orden}</div>
                  <div className="text-xs text-muted-foreground">Orden</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{evaluation.verso_memoria}</div>
                  <div className="text-xs text-muted-foreground">Verso</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{evaluation.preguntas_correctas}</div>
                  <div className="text-xs text-muted-foreground">Respuestas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Link href="/staff/jurados">
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
                  Guardar Puntuación
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </StaffGuard>
  )
}
