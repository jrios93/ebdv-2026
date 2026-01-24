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
import { Users, ArrowLeft } from "lucide-react"

const InscripcionPage = () => {
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Fondo */}
      <img src={"/images/ebdv-bg.jpg"} alt="Imagen" className="bg-cover w-full h-full overflow-hidden -z-10 absolute" />
      <div className="fixed inset-0 bg-primary/10 backdrop-blur-xl"></div>
      
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center text-white hover:text-gray-200 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
            <h1 className="text-4xl sm:text-6xl font-bold mb-3 text-white drop-shadow-lg">
              <span className="text-red-500 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">E</span>
              <span className="text-green-500 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">B</span>
              <span className="text-orange-500 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">D</span>
              <span className="text-blue-500 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">V</span>
              <span className="text-purple-500 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">2026</span>
            </h1>
            <h2 className="text-2xl font-bold text-white mb-2">Inscripción de Alumnos</h2>
            <p className="text-gray-200">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Formulario de Inscripción */}
          <RegistrationForm
            form={form}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
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

export default InscripcionPage