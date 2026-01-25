"use client"
import { useForm } from "react-hook-form"
import { useState, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { projectSchema } from "@/schemas/project"
import { createProject } from "@/actions/project"
import { toast } from "sonner"
import { RegistrationForm } from "@/components/RegistrationForm"
import { SuccessDialog } from "@/components/SuccessDialog"
import { getClassroomByAge } from "@/lib/classroom"
import type { FormData } from "@/components/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, ArrowLeft, Building2 } from "lucide-react"

import { IoIosPin } from "react-icons/io";
import { FaClock, FaMobile } from "react-icons/fa"
import { IoLogoWhatsapp } from "react-icons/io5"
const Home = () => {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [inscriptionData, setInscriptionData] = useState<FormData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    defaultValues: {
      childName: "",
      childLastname: "",
      age: 3,
      gender: "niño",
      parentName: "",
      parentPhone: "",
      classroom: getClassroomByAge(3),
    },
    resolver: zodResolver(projectSchema),
    mode: "onChange"
  })

  const onSubmit = useCallback(async (data: FormData) => {
    setIsSubmitting(true)

    try {
      const res = await createProject(data)

      if (res.success) {
        setInscriptionData(data)
        setShowSuccessDialog(true)
        form.reset({
          childName: "",
          childLastname: "",
          age: 3,
          gender: "niño",
          parentName: "",
          parentPhone: "",
          classroom: getClassroomByAge(3),
        })
        toast.success("¡Inscripción completada exitosamente!")
      } else {
        toast.error(res.error || "Error al realizar la inscripción. Por favor revise los datos.")
      }
    } catch (error) {
      toast.error("Error inesperado. Por favor intenta de nuevo más tarde.")
    } finally {
      setIsSubmitting(false)
    }
  }, [form])

  return (
    <div className="min-h-screen relative overflow-hidden" role="main">
      {/* Fondo */}
      <img src={"/images/ebdv-bg.jpg"} alt="Imagen" className="bg-cover w-full h-full overflow-hidden -z-10 absolute" />
      <div className="fixed inset-0 bg-primary/10 backdrop-blur-xl"></div>

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-7xl font-bold mb-3 drop-shadow-lg">
              <span className="text-red-500 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">E</span>
              <span className="text-green-500 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">B</span>
              <span className="text-orange-500 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">D</span>
              <span className="text-blue-500 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">V</span>
              <span className="text-primary drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">2026</span>
            </h1>

            <p className="text-sm text-muted-foreground drop-shadow">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </header>

          {/* Cards de Acceso Doble */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Card para Padres */}
            <Card className="bg-card border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-foreground">
                  Inscripción
                </h2>
                <p className="text-muted-foreground mb-6 text-lg">
                  Formulario de Inscripción - EBDV 2026
                </p>
                <Link href="/inscribir">
                  <Button size="lg" className="w-full bg-green-500 hover:bg-green-600 text-white  cursor-pointer font-medium py-3 text-lg">
                    Inscribir Niño(a)
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Card para Staff */}
            <Card className="bg-card border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">

                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-foreground">
                  Staff
                </h2>
                <p className="text-muted-foreground mb-6 text-lg">
                  Acceso al sistema de evaluación
                </p>
                <Link href="/staff">
                  <Button size="lg" className="w-full bg-accent hover:bg-accent/90  cursor-pointer text-secondary-foreground font-medium py-3 text-lg">
                    Portal Staff
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Info Rápida */}
          <Card className="bg-card shadow-md border-border">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4  text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <IoIosPin className="text-red-500" />
                  <span className="font-semibold text-foreground">
                    Ubicación:</span>
                  <span>Av. Leandra Torres 263</span>
                </div>

                <div className="flex items-center gap-2">

                  <FaClock className="text-red-500" />
                  <span className="font-semibold text-foreground">
                    Hora:
                  </span>
                  <span>3:00 PM</span>
                </div>

                <div className="flex items-center gap-2">

                  <IoLogoWhatsapp className="text-green-500" />
                  <span className="font-semibold text-foreground"> Contacto:</span>
                  <span>
                    964 001 530

                  </span>                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  © 2026 PIB - HYO • Todos los derechos reservados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        inscriptionData={inscriptionData}
      />
    </div>
  )
}

export default Home
