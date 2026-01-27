"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { StaffGuard } from "@/components/StaffGuard"
import BatchEvaluation from "@/components/BatchEvaluation"
import { getAlumnosByClassroom, getClassroomIdByName } from "@/lib/supabaseQueries"
import { supabase } from "@/lib/supabase"
import DebugInfoPanel from "@/components/DebugInfoPanel"

export default function EvaluacionRapidaPage({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const classroomName = resolvedParams.name
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [classroomId, setClassroomId] = useState<string>("")
  const [maestroId, setMaestroId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('🚀 Iniciando carga de datos para evaluación rápida...')
        
        // Obtener ID del classroom
        const id = await getClassroomIdByName(classroomName.trim())
        if (!id) {
          console.error('❌ Classroom no encontrado:', classroomName)
          return
        }
        setClassroomId(id)
        console.log('✅ Classroom ID obtenido:', id)

        // Obtener alumnos del classroom
        const alumnosData = await getAlumnosByClassroom(id)
        setAlumnos(alumnosData)
        console.log('✅ Alumnos cargados:', alumnosData.length)

        // Obtener ID del maestro actual - MÉTODO SIMPLE para frontend puro
        console.log('🎯 Cargando maestro para evaluación rápida...')
        
        // Usar primer maestro activo (mismo método que todo el frontend)
        const { data: maestroActivo, error: maestroError } = await supabase
          .from('maestros')
          .select('id, nombre, email, rol, activo')
          .eq('activo', true)
          .eq('rol', 'maestro')
          .order('nombre', { ascending: true })
          .limit(1)
          .single()

        if (maestroError) {
          console.error('❌ Error obteniendo maestro:', maestroError)
          return
        }
        
        if (!maestroActivo) {
          console.error('❌ No se encontró ningún maestro activo')
          return
        }
        
        // Establecer en localStorage para consistencia
        localStorage.setItem('staffUserId', maestroActivo.id)
        setMaestroId(maestroActivo.id)
        console.log('✅ Maestro seleccionado:', maestroActivo.nombre, 'ID:', maestroActivo.id)
        
      } catch (error) {
        console.error('❌ Error general cargando datos iniciales:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [classroomName])

  if (loading) {
    return (
      <StaffGuard role="maestro">
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando evaluación rápida...</p>
          </div>
        </div>
      </StaffGuard>
    )
  }

  if (!classroomId || !maestroId) {
    return (
      <StaffGuard role="maestro">
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                🐛 Depuración de Carga
              </h3>
              <div className="text-left space-y-1 text-sm text-yellow-700">
                <p>📍 Classroom ID: {classroomId || 'No encontrado'}</p>
                <p>👤 Maestro ID: {maestroId || 'No encontrado'}</p>
                <p>🏛️ Classroom: {classroomName}</p>
              </div>
            </div>
            
            <DebugInfoPanel />
            
            <p className="text-red-600 font-medium mt-4">
              No se pudo cargar la información del maestro.
            </p>
            <p className="text-muted-foreground">
              Verifique los datos arriba o contacte al administrador.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔄 Recargar Página
            </button>
          </div>
        </div>
      </StaffGuard>
    )
  }

  return (
    <StaffGuard role="maestro">
      <BatchEvaluation
        classroomId={classroomId}
        maestroId={maestroId}
        alumnos={alumnos}
        onBack={() => router.push(`/staff/maestros/${classroomName}`)}
      />
    </StaffGuard>
  )
}