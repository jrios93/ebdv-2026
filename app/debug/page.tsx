"use client"
import { useState } from "react"
import { debugClassroomSearch } from "@/lib/debugQueries"

export default function DebugPage() {
  const [results, setResults] = useState<any>(null)

  const testSearch = async () => {
    const debugResults = await debugClassroomSearch("vida")
    setResults(debugResults)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Classroom Search</h1>
      
      <button 
        onClick={testSearch}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Test Search for "vida"
      </button>
      
      {results && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold mb-2">All Classrooms:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(results.allClassrooms, null, 2)}
            </pre>
          </div>
          
          <div className="bg-blue-100 p-4 rounded">
            <h3 className="font-bold mb-2">Exact Search:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(results.classroom, null, 2)}
            </pre>
            {results.searchError && (
              <p className="text-red-600 mt-2">Error: {JSON.stringify(results.searchError, null, 2)}</p>
            )}
          </div>
          
          <div className="bg-green-100 p-4 rounded">
            <h3 className="font-bold mb-2">Multiple Search:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(results.multiple, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      <p className="text-sm text-gray-600 mt-4">
        Abre la consola del navegador para ver más detalles
      </p>
    </div>
  )
}