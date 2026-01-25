"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, LogOut, Clock, GraduationCap } from "lucide-react"
import { getClassroomInfo } from "@/lib/classroom"
import { StaffGuard } from "@/components/StaffGuard"

const classrooms = [
  {
    name: "vida",
    title: "vida",
    description: "Aulas de nivel inicial",
    ageRange: "3-5 años"
  },
  {
    name: "luz",
    title: "luz",
    description: "Aulas de nivel primario bajo",
    ageRange: "6-9 años"
  },
  {
    name: "gracia",
    title: "gracia",
    description: "Aulas de nivel primario medio",
    ageRange: "10-12 años"
  },
  {
    name: "verdad",
    title: "verdad",
    description: "Aulas de nivel primario alto",
    ageRange: "13-15 años"
  }
]

export default function MaestrosPage() {
  const handleLogout = () => {
    localStorage.removeItem("staffAuth")
    localStorage.removeItem("staffAuthTime")
    localStorage.removeItem("staffRole")
    window.location.href = "/"
  }

  return (
    <StaffGuard role="maestro">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header con info de sesión */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 text-gray-800">
              <span className="text-red-500">E</span>
              <span className="text-green-500">B</span>
              <span className="text-orange-500">D</span>
              <span className="text-blue-500">V</span>
              <span className="text-accent">2026</span>
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mb-2">
              <GraduationCap className="w-4 h-4" />
              <span className="font-medium">Portal de Maestros</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>•</span>
              <span>{new Date().toLocaleTimeString('es-PE')}</span>
            </div>
          </div>

          {/* Classroom Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2  gap-6 mb-8">
            {classrooms.map((classroom) => {
              const classroomInfo = getClassroomInfo(classroom.name)
              const IconComponent = classroomInfo.icon
              return (
                <Link key={classroom.name} href={`/staff/maestros/${classroom.name}`}>
                  <Card className={`cursor-pointer  transition-all duration-200 transform hover:scale-105 hover:shadow-xl border-2 ${classroomInfo.borderColor} ${classroomInfo.bgColor} hover:opacity-90`}>
                    <CardHeader className="text-center pb-3">
                      <div className={`w-16 h-16 bg-linear-to-br ${classroomInfo.textColor.replace('text', 'from')} ${classroomInfo.textColor.replace('text', 'to')} rounded-full flex items-center justify-center mx-auto mb-3`}>
                        <IconComponent className={`w-8 h-8 ${classroomInfo.textColor} `} />
                      </div>
                      <CardTitle className={`text-2xl font-bold ${classroomInfo.textColor}`}>
                        {classroom.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className={`mb-2 ${classroomInfo.textMutedColor}`}>{classroom.description}</p>
                      <p className={`text-sm font-semibold ${classroomInfo.textMutedColor}`}>{classroom.ageRange}</p>
                      <div className={`mt-4 text-sm ${classroomInfo.textColor}`}>
                        Ver alumnos →
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-destructive text-gray-700 hover:bg-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </StaffGuard>
  )
}
