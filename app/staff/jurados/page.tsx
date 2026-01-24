"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Star, Heart, LogOut, Clock, Scale } from "lucide-react"
import { StaffGuard } from "@/components/StaffGuard"

const classrooms = [
  {
    name: "vida",
    title: "Vida",
    description: "Aulas de nivel inicial",
    icon: Heart,
    color: "bg-red-500",
    hoverColor: "hover:bg-red-600",
    ageRange: "3-5 años"
  },
  {
    name: "luz", 
    title: "Luz",
    description: "Aulas de nivel primario bajo",
    icon: Star,
    color: "bg-yellow-500",
    hoverColor: "hover:bg-yellow-600",
    ageRange: "6-8 años"
  },
  {
    name: "gracia",
    title: "Gracia", 
    description: "Aulas de nivel primario medio",
    icon: Users,
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600",
    ageRange: "9-11 años"
  },
  {
    name: "verdad",
    title: "Verdad",
    description: "Aulas de nivel primario alto",
    icon: Trophy,
    color: "bg-blue-500", 
    hoverColor: "hover:bg-blue-600",
    ageRange: "12-15 años"
  }
]

export default function JuradosPage() {
  const handleLogout = () => {
    localStorage.removeItem("staffAuth")
    localStorage.removeItem("staffAuthTime")
    localStorage.removeItem("staffRole")
    window.location.href = "/"
  }

  return (
    <StaffGuard role="jurado">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header con info de sesión */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 text-gray-800">
              <span className="text-red-500">E</span>
              <span className="text-green-500">B</span>
              <span className="text-orange-500">D</span>
              <span className="text-blue-500">V</span>
              <span className="text-purple-500">2026</span>
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mb-2">
              <Scale className="w-4 h-4" />
              <span className="font-medium">Portal de Jurados</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>•</span>
              <span>{new Date().toLocaleTimeString('es-PE')}</span>
            </div>
          </div>

          {/* Classroom Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {classrooms.map((classroom) => {
              const IconComponent = classroom.icon
              return (
                <Link key={classroom.name} href={`/staff/jurados/${classroom.name}`}>
                  <Card className={`cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-xl border-2 border-gray-200 ${classroom.hoverColor}`}>
                    <CardHeader className="text-center pb-3">
                      <div className={`w-16 h-16 ${classroom.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold capitalize text-gray-800">
                        {classroom.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-600 mb-2">{classroom.description}</p>
                      <p className="text-sm font-semibold text-gray-500">{classroom.ageRange}</p>
                      <div className="mt-4 text-sm text-gray-700">
                        Puntuar salón →
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
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
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