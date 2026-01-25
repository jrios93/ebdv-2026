import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Trophy, Star, Heart } from "lucide-react"

const classrooms = [
  {
    name: "vida",
    title: "vida",
    description: "Aulas de nivel inicial",
    icon: Heart,
    color: "bg-red-500",
    hoverColor: "hover:bg-red-600",
    ageRange: "3-5 años"
  },
  {
    name: "luz",
    title: "luz",
    description: "Aulas de nivel primario bajo",
    icon: Star,
    color: "bg-yellow-500",
    hoverColor: "hover:bg-yellow-600",
    ageRange: "6-9 años"
  },
  {
    name: "gracia",
    title: "gracia",
    description: "Aulas de nivel primario medio",
    icon: Users,
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600",
    ageRange: "10-12 años"
  },
  {
    name: "verdad",
    title: "verdad",
    description: "Aulas de nivel primario alto",
    icon: Trophy,
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
    ageRange: "13-15 años"
  }
]

export default function ClassroomsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-red-500">E</span>
            <span className="text-green-500">B</span>
            <span className="text-orange-500">D</span>
            <span className="text-blue-500">V</span>
            <span className="text-purple-500">2026</span>
          </h1>
          <p className="text-xl text-gray-600 mb-2">Seleccione un salón para ver los alumnos</p>
          <p className="text-sm text-gray-500">Domingo 3:00 PM - Evaluación Diaria</p>
        </div>

        {/* Classroom Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {classrooms.map((classroom) => {
            const IconComponent = classroom.icon
            return (
              <Link key={classroom.name} href={`/classrooms/${classroom.name}`}>
                <Card className={`cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-xl border-2 ${classroom.hoverColor} border-transparent`}>
                  <CardHeader className="text-center pb-3">
                    <div className={`w-16 h-16 ${classroom.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold capitalize">
                      {classroom.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 mb-2">{classroom.description}</p>
                    <p className="text-sm font-semibold text-gray-500">{classroom.ageRange}</p>
                    <div className="mt-4 text-sm text-gray-400">
                      Ver alumnos →
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <span className="mr-2">←</span>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
