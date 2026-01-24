"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GraduationCap, Users, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function StaffPortalPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"maestro" | "jurado" | "admin" | null>(null)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    setTimeout(() => {
      if (password === "ebdv2026" && selectedRole) {
        localStorage.setItem("staffAuth", "true")
        localStorage.setItem("staffRole", selectedRole)
        localStorage.setItem("staffAuthTime", new Date().toISOString())
        
        if (selectedRole === "maestro") {
          router.push("/staff/maestros")
        } else if (selectedRole === "jurado") {
          router.push("/staff/jurados")
        } else {
          router.push("/staff/admin")
        }
      } else {
        setError("❌ Password incorrecto o no ha seleccionado un rol")
      }
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 text-foreground">
                <span className="text-red-500">E</span>
                <span className="text-green-500">B</span>
                <span className="text-orange-500">D</span>
                <span className="text-blue-500">V</span>
                <span className="text-primary">2026</span>
              </h1>
              <p className="text-muted-foreground">Portal de Staff y Maestros</p>
        </div>

        {/* Login Card */}
        <Card className="bg-card shadow-xl border-border">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Acceso Restringido
            </CardTitle>
            <p className="text-gray-600">
              Seleccione su rol y ingrese el password
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Seleccione su rol:</label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={selectedRole === "maestro" ? "default" : "outline"}
                  className={`h-auto p-4 flex flex-col items-center gap-2 ${
                    selectedRole === "maestro" 
                      ? "bg-blue-500 hover:bg-blue-600 text-white" 
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedRole("maestro")}
                >
                  <GraduationCap className="w-6 h-6" />
                  <span className="text-sm font-medium">Maestro</span>
                </Button>
                
                <Button
                  type="button"
                  variant={selectedRole === "jurado" ? "default" : "outline"}
                  className={`h-auto p-4 flex flex-col items-center gap-2 ${
                    selectedRole === "jurado" 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedRole("jurado")}
                >
                  <Users className="w-6 h-6" />
                  <span className="text-sm font-medium">Jurado</span>
                </Button>

                <Button
                  type="button"
                  variant={selectedRole === "admin" ? "default" : "outline"}
                  className={`h-auto p-4 flex flex-col items-center gap-2 ${
                    selectedRole === "admin" 
                      ? "bg-purple-500 hover:bg-purple-600 text-white" 
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedRole("admin")}
                >
                  <Shield className="w-6 h-6" />
                  <span className="text-sm font-medium">Admin</span>
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Ingrese password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-gray-300 text-gray-900 focus:border-blue-500"
                  required
                />
              </div>
              
              {error && (
                <div className="text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                disabled={isLoading || !selectedRole}
              >
                {isLoading ? "Verificando..." : `Ingresar como ${selectedRole || "..."}`}
              </Button>
            </form>

            {/* Role Info */}
            <div className="text-center text-sm text-gray-500">
              {selectedRole === "maestro" && (
                <div>
                  <GraduationCap className="w-4 h-4 inline mr-2" />
                  Acceso a lista de alumnos y evaluación individual
                </div>
              )}
              {selectedRole === "jurado" && (
                <div>
                  <Users className="w-4 h-4 inline mr-2" />
                  Acceso a puntuación de salones
                </div>
              )}
              {selectedRole === "admin" && (
                <div>
                  <Shield className="w-4 h-4 inline mr-2" />
                  Acceso a resúmenes y estadísticas generales
                </div>
              )}
              {!selectedRole && (
                <div>
                  <Shield className="w-4 h-4 inline mr-2" />
                  Seleccione un rol para continuar
                </div>
              )}
              {selectedRole === "jurado" && (
                <div>
                  <Users className="w-4 h-4 inline mr-2" />
                  Acceso a puntuación de salones
                </div>
              )}
              {!selectedRole && (
                <div>
                  <Shield className="w-4 h-4 inline mr-2" />
                  Seleccione un rol para continuar
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Volver al inicio */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}