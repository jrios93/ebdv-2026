"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeftIcon, DownloadIcon, CheckCircleIcon } from "lucide-react";
import { obtenerEvaluacionesPorSalon, getClassroomIdByName, getClassroomIdByNameOrThrow } from "@/lib/juradoService";

export default function ResultadosSalonPage({ params }: { params: Promise<{ juradoId: string; salon: string }> }) {
  const resolvedParams = use(params);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const cargarResultados = async () => {
    try {
      setLoading(true);
      setError("");
      
      let salonId: string;
      try {
        salonId = await getClassroomIdByNameOrThrow(resolvedParams.salon);
      } catch (error) {
        setError("Salón no encontrado");
        return;
      }
      
        const evaluacionesData = await obtenerEvaluacionesPorSalon(salonId);
      setEvaluaciones(evaluacionesData);
    } catch (error) {
      console.error('Error al cargar resultados:', error);
      setError("No se pudieron cargar los resultados");
    } finally {
      setLoading(false);
    }
  };

  const obtenerSalonIdPorNombre = (nombre: string): string | null => {
    const nombreToId = {
      'verdad': '5272477b-26a4-4179-a276-1c4730238974',
      'gracia': '9b8a58b3-6356-4b75-b28b-d5f5d8e596fd', 
      'luz': 'd863c43d-9b83-494a-a88b-c3973a31bfd7',
      'vida': 'eda65bd9-dadd-4f74-954e-b952a91845a3'
    };
    return nombreToId[nombre.toLowerCase() as keyof typeof nombreToId] || null;
  };

  const descargarReporte = () => {
    const salonNombre = resolvedParams.salon.charAt(0).toUpperCase() + resolvedParams.salon.slice(1);
    const datos = {
      salon: salonNombre,
      fecha: new Date().toLocaleDateString(),
      totalEvaluaciones: evaluaciones.length,
      evaluaciones: evaluaciones
    };
    
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${salonNombre}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPromedios = () => {
    if (evaluaciones.length === 0) return null;
    
    const totals = evaluaciones.reduce((acc, evaluation) => ({
      puntualidad: acc.puntualidad + (evaluation.puntualidad || 0),
      animo_y_barras: acc.animo_y_barras + (evaluation.animo_y_barras || 0),
      orden: acc.orden + (evaluation.orden || 0),
      verso_memoria: acc.verso_memoria + (evaluation.verso_memoria || 0),
      preguntas_correctas: acc.preguntas_correctas + (evaluation.preguntas_correctas || 0)
    }), { puntualidad: 0, animo_y_barras: 0, orden: 0, verso_memoria: 0, preguntas_correctas: 0 });

    const total = totals.puntualidad + totals.animo_y_barras + totals.orden + totals.verso_memoria + totals.preguntas_correctas;
    
    return {
      ...totals,
      promedio: {
        puntualidad: (totals.puntualidad / evaluaciones.length).toFixed(1),
        animo_y_barras: (totals.animo_y_barras / evaluaciones.length).toFixed(1),
        orden: (totals.orden / evaluaciones.length).toFixed(1),
        verso_memoria: (totals.verso_memoria / evaluaciones.length).toFixed(1),
        preguntas_correctas: (totals.preguntas_correctas / evaluaciones.length).toFixed(1),
        total: (total / evaluaciones.length).toFixed(1)
      }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const salonNombre = resolvedParams.salon.charAt(0).toUpperCase() + resolvedParams.salon.slice(1);
  const promedios = getPromedios();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/staff/jurados/${resolvedParams.juradoId}`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Volver</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Resultados de {salonNombre}</h1>
                <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <Button
              onClick={descargarReporte}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Descargar Reporte</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen */}
        {promedios && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Resumen de Evaluaciones</CardTitle>
              <CardDescription>
                {evaluaciones.length} jurado{evaluaciones.length !== 1 ? 's' : ''} han evaluado este salón
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{promedios.promedio.puntualidad}</div>
                  <div className="text-sm text-gray-600">Puntualidad</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{promedios.promedio.animo_y_barras}</div>
                  <div className="text-sm text-gray-600">Ánimo y Barras</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{promedios.promedio.orden}</div>
                  <div className="text-sm text-gray-600">Orden</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{promedios.promedio.verso_memoria}</div>
                  <div className="text-sm text-gray-600">Verso de Memoria</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{promedios.promedio.preguntas_correctas}</div>
                  <div className="text-sm text-gray-600">Respuestas Correctas</div>
                </div>
              </div>
              
              <div className="mt-6 p-6 bg-blue-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-700">{promedios.promedio.total}</div>
                <div className="text-lg text-blue-600">Puntaje Total Promedio</div>
                <Badge className="mt-2 bg-green-100 text-green-800">
                  {evaluaciones.length >= 3 ? 'Evaluación Completada' : 'En Progreso'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de evaluaciones */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Evaluaciones por Jurado</h2>
          
          {evaluaciones.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No hay evaluaciones registradas para este salón</p>
              </CardContent>
            </Card>
          ) : (
            evaluaciones.map((evaluacion, index) => (
              <Card key={evaluacion.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {evaluacion.maestros?.nombre || 'Jurado'} 
                    </CardTitle>
                    <div className="text-2xl font-bold text-blue-600">
                      {(evaluacion.puntualidad || 0) + 
                       (evaluacion.animo_y_barras || 0) + 
                       (evaluacion.orden || 0) + 
                       (evaluacion.verso_memoria || 0) + 
                       (evaluacion.preguntas_correctas || 0)} pts
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Puntualidad</p>
                      <p className="text-2xl font-bold text-blue-600">{evaluacion.puntualidad || 0}/10</p>
                    </div>
                    <div>
                      <p className="font-medium">Ánimo y Barras</p>
                      <p className="text-2xl font-bold text-green-600">{evaluacion.animo_y_barras || 0}/20</p>
                    </div>
                    <div>
                      <p className="font-medium">Orden</p>
                      <p className="text-2xl font-bold text-purple-600">{evaluacion.orden || 0}/20</p>
                    </div>
                    <div>
                      <p className="font-medium">Verso Memoria</p>
                      <p className="text-2xl font-bold text-orange-600">{evaluacion.verso_memoria || 0}/20</p>
                    </div>
                    <div>
                      <p className="font-medium">Resp. Correctas</p>
                      <p className="text-2xl font-bold text-red-600">{evaluacion.preguntas_correctas || 0}/30</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}