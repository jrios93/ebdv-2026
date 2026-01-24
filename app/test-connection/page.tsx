"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function TestConnection() {
  const [status, setStatus] = useState<string>("Loading...")
  const [classrooms, setClassrooms] = useState<any[]>([])

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log("Testing Supabase connection...")
        
        // Probar conexión simple
        const { data, error } = await supabase
          .from('classrooms')
          .select('*')
          .limit(5)

        if (error) {
          console.error("Supabase error:", error)
          setStatus(`Error: ${error.message}`)
        } else {
          console.log("Supabase data:", data)
          setStatus(`Connected! Found ${data?.length || 0} classrooms`)
          setClassrooms(data || [])
        }
      } catch (err) {
        console.error("Connection error:", err)
        setStatus(`Connection failed: ${err}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="bg-card border rounded-lg p-4 mb-4">
        <h2 className="font-semibold mb-2">Status:</h2>
        <p className={status.includes("Error") ? "text-red-500" : "text-green-500"}>
          {status}
        </p>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Classrooms Found:</h2>
        {classrooms.length > 0 ? (
          <ul className="space-y-2">
            {classrooms.map((classroom) => (
              <li key={classroom.id} className="border rounded p-2">
                <strong>{classroom.nombre}</strong> - 
                Edad: {classroom.edad_min}-{classroom.edad_max} - 
                Color: {classroom.color}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No classrooms found or connection failed</p>
        )}
      </div>

      <div className="bg-card border rounded-lg p-4 mt-4">
        <h2 className="font-semibold mb-2">Environment Variables:</h2>
        <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}</p>
        <p>API Key Length: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || "❌ Missing"}</p>
      </div>
    </div>
  )
}