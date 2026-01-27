"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function DebugInfoPanel() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [maestros, setMaestros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        // Obtener información del usuario autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (!authError && user) {
          setUserInfo({
            id: user.id,
            email: user.email,
            created_at: user.created_at
          })
        }

        // Obtener todos los maestros
        const { data: todosMaestros, error: maestrosError } = await supabase
          .from('maestros')
          .select('id, nombre, email, rol, activo')
          .limit(10)
        
        if (!maestrosError) {
          setMaestros(todosMaestros || [])
        }

      } catch (error) {
        console.error('Error en DebugInfoPanel:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDebugInfo()
  }, [])

  if (loading) {
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
        <p className="text-sm text-blue-700">Cargando información de depuración...</p>
      </div>
    )
  }

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-lg text-left">
      <h4 className="font-semibold text-blue-800 mb-3">🔍 Información de Depuración</h4>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-blue-700">👤 Usuario Autenticado:</p>
          {userInfo ? (
            <div className="ml-4 text-xs text-blue-600 space-y-1">
              <p>ID: {userInfo.id}</p>
              <p>Email: {userInfo.email}</p>
              <p>Creado: {new Date(userInfo.created_at).toLocaleDateString()}</p>
            </div>
          ) : (
            <p className="ml-4 text-xs text-red-600">No hay usuario autenticado</p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-blue-700">👥 Maestros Disponibles:</p>
          {maestros.length > 0 ? (
            <div className="ml-4 text-xs text-blue-600 space-y-1">
              {maestros.map((maestro, index) => (
                <div key={maestro.id} className={`p-1 rounded ${userInfo && userInfo.email === maestro.email ? 'bg-green-100' : 'bg-gray-50'}`}>
                  <p><strong>{index + 1}.</strong> {maestro.nombre}</p>
                  <p>Email: {maestro.email}</p>
                  <p>ID: {maestro.id}</p>
                  <p>Rol: {maestro.rol} | Activo: {maestro.activo ? 'Sí' : 'No'}</p>
                  {userInfo && userInfo.email === maestro.email && (
                    <p className="text-green-700 font-bold">✅ ESTE ES TU USUARIO</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="ml-4 text-xs text-red-600">No se encontraron maestros</p>
          )}
        </div>
      </div>
    </div>
  )
}