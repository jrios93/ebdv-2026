"use client"
import { useState, useEffect } from "react"

export default function SimpleTest() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const testDirectConnection = async () => {
      try {
        // Conexión directa usando fetch como en tu curl
        const response = await fetch(
          'https://xhslnlccbsoyiylmrmxb.supabase.co/rest/v1/classrooms?select=*&limit=5',
          {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'apikey': 'sb_publishable_Hrl8mKdAD03RmeZ9aIEyGg_qwdalJHL',
              'authorization': 'Bearer sb_publishable_Hrl8mKdAD03RmeZ9aIEyGg_qwdalJHL'
            }
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log("Direct fetch result:", result)
        setData(result)
      } catch (err) {
        console.error("Direct fetch error:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    }

    testDirectConnection()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Direct Supabase Test</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-4">
          <strong>✅ Connected!</strong> Found {data.length} classrooms
        </div>
      )}

      <div className="bg-card border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Classrooms:</h2>
        {data ? (
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <p className="text-muted-foreground">Loading...</p>
        )}
      </div>
    </div>
  )
}