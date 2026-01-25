"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Star, Heart, ArrowLeft } from "lucide-react"
import { StaffGuard } from "@/components/StaffGuard"

export default function ClassroomOptionsPage({ params }: { params: Promise<{ name: string }> }) {
  const [classroomName, setClassroomName] = useState<string>("")

  // Manejar params asíncronos
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params
      setClassroomName(resolvedParams.name)
    }
    unwrapParams()
  }, [params])

  const classroomConfig = {
    vida: { title: "vida", icon: Heart, color: "bg-green-100 text-green-700 border-green-300" },
    luz: { title: "luz", icon: Star, color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
    gracia: { title: "gracia", icon: Heart, color: "bg-red-100 text-red-700 border-red-300" },
    verdad: { title: "verdad", icon: Trophy, color: "bg-blue-100 text-blue-700 border-blue-300" }
  }

  const classroom = classroomName ? classroomConfig[classroomName as keyof typeof classroomConfig] : null

  if (!classroomName || !classroom) {
    return (
      <StaffGuard role="admin">
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Salón no encontrado</h1>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </StaffGuard>
    )
  }

  const IconComponent = classroom.icon

  return (
    <StaffGuard role="admin">
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="mb-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${classroom.color} mb-4`}>
              <IconComponent className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Salón <span className="capitalize">{classroom.title}</span>
            </h1>
            <p className="text-muted-foreground">Selecciona el tipo de puntuación que deseas registrar</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Puntuar Salón (Grupal) */}
            <Link href={`/staff/jurados/${classroomName}`}>
              <Card className="cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg border-2 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-primary" />
                    Puntuar Salón
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Evaluar al salón completo en las siguientes categorías:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Puntualidad (0-10 pts)</li>
                      <li>• Ánimo y Barras (0-20 pts)</li>
                      <li>• Orden (0-20 pts)</li>
                      <li>• Verso de Memoria (0-20 pts)</li>
                      <li>• Preguntas Correctas (0-30 pts)</li>
                    </ul>
                    <div className="pt-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Máximo: 100 puntos por salón
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Puntuar Alumnos (Individual) */}
            <Link href={`/staff/maestros/${classroomName}`}>
              <Card className="cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-green-600" />
                    Puntuar Alumnos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Evaluar a cada alumno individualmente en:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Actitud (0-10 pts)</li>
                      <li>• Puntualidad y Asistencia (0-10 pts)</li>
                      <li>• Ánimo (0-10 pts)</li>
                      <li>• Trabajo Manual (0-10 pts)</li>
                      <li>• Verso de Memoria (0-30 pts)</li>
                      <li>• Aprestamiento Bíblico (0-30 pts)</li>
                      <li>• Invitados Traídos (sin límite)</li>
                    </ul>
                    <div className="pt-2">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Máximo: 100 puntos por alumno
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Instructions */}
          <Card className="mt-8 border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">¿Cuándo usar cada opción?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Puntuar Salón</h4>
                  <p className="text-sm text-muted-foreground">
                    Úsalo cuando los jurados evalúan el desempeño general del salón en actividades grupales.
                    Esta puntuación se aplica a todo el salón por igual.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Puntuar Alumnos</h4>
                  <p className="text-sm text-muted-foreground">
                    Úsalo cuando los maestros evalúan individualmente a cada niño.
                    Permite registrar diferentes puntuaciones para cada alumno del salón.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffGuard>
  )
}