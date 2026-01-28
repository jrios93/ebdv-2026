"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeftIcon, ClockIcon, UsersIcon, CheckCircleIcon } from "lucide-react";
import { obtenerEvaluacionDelDia, guardarEvaluacion, getClassroomIdByName, getClassroomIdByNameOrThrow } from "@/lib/juradoService";

export default function EvaluarSalonPage({ params }: { params: Promise<{ juradoId: string; salon: string }> }) {
  const resolvedParams = use(params);
  const [evaluacion, setEvaluacion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Criterios de evaluación con las opciones correctas
  const criterios = [
    {
      id: 'puntualidad',
      nombre: 'Puntualidad',
      maximo: 10,
      opciones: [
        { label: 'Malo (0%)', valor: 0 },
        { label: 'Regular (25%)', valor: 2.5 },
        { label: 'Bueno (50%)', valor: 5 },
        { label: 'Muy Bueno (75%)', valor: 7.5 },
        { label: 'Excelente (100%)', valor: 10 }
      ]
    },
    {
      id: 'animo_y_barras',
      nombre: 'Ánimo y Barras',
      maximo: 20,
      opciones: [
        { label: 'Malo', valor: 5 },
        { label: 'Regular', valor: 10 },
        { label: 'Bueno', valor: 15 },
        { label: 'Excelente', valor: 20 }
      ]
    },
    {
      id: 'orden',
      nombre: 'Orden',
      maximo: 20,
      opciones: [
        { label: 'Malo', valor: 5 },
        { label: 'Regular', valor: 10 },
        { label: 'Bueno', valor: 15 },
        { label: 'Excelente', valor: 20 }
      ]
    },
    {
      id: 'verso_memoria',
      nombre: 'Verso de Memoria',
      maximo: 20,
      opciones: [
        { label: 'Malo', valor: 5 },
        { label: 'Regular', valor: 10 },
        { label: 'Bueno', valor: 15 },
        { label: 'Excelente', valor: 20 }
      ]
    },
    {
      id: 'preguntas_correctas',
      nombre: 'Niños con Respuesta Correcta',
      maximo: 30,
      opciones: [
        { label: 'Ninguno', valor: 0 },
        { label: '1 niño', valor: 5 },
        { label: '2 niños', valor: 10 },
        { label: '3 niños', valor: 15 },
        { label: '4 niños', valor: 20 },
        { label: '5 niños', valor: 25 },
        { label: '6 niños', valor: 30 }
      ]
    }
  ];

  useEffect(() => {
    cargarEvaluacion();
  }, [resolvedParams.juradoId, resolvedParams.salon]);

  const cargarEvaluacion = async () => {
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

      // Obtener fecha actual en formato Perú YYYY-MM-DD
      const getFechaPeru = () => {
        const ahora = new Date();
        const year = ahora.toLocaleDateString('en-CA', {
          timeZone: 'America/Lima',
          year: 'numeric'
        });
        const month = ahora.toLocaleDateString('en-CA', {
          timeZone: 'America/Lima',
          month: '2-digit'
        });
        const day = ahora.toLocaleDateString('en-CA', {
          timeZone: 'America/Lima',
          day: '2-digit'
        });

        return `${year}-${month}-${day}`;
      };

      const today = getFechaPeru();
      console.log('📅 Fecha actual (Perú):', {
        fecha: today,
        tipo: typeof today,
        hora: new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })
      });

      const evaluacionData = await obtenerEvaluacionDelDia(salonId, today, resolvedParams.juradoId);

      if (evaluacionData) {
        console.log('✅ Evaluación existente encontrada, cargando...', evaluacionData);
        // Eliminar el campo 'preguntas' ya que es generado por la BD
        const { preguntas, ...evaluacionSinPreguntas } = evaluacionData;
        console.log('📝 Evaluación sin campo generado:', evaluacionSinPreguntas);
        setEvaluacion(evaluacionSinPreguntas);
      } else {
        // Crear evaluación vacía (normal para primera vez del día)
        console.log('🆕 Creando nueva evaluación para el día:', today);
        setEvaluacion({
          jurado_id: resolvedParams.juradoId,
          classroom_id: salonId,
          fecha: today,
          puntualidad: 0,
          animo_y_barras: 0,
          orden: 0,
          verso_memoria: 0,
          preguntas_correctas: 0
        });
      }
    } catch (error) {
      console.error('Error al cargar evaluación:', error);
      setError("No se pudo cargar la evaluación");
    } finally {
      setLoading(false);
    }
  };

  const actualizarCampo = (campo: string, valor: number) => {
    setEvaluacion((prev: any) => {
      const { preguntas, ...sinPreguntas } = prev;
      return {
        ...sinPreguntas,
        [campo]: valor
      };
    });
  };

  const guardarProgreso = async () => {
    if (!evaluacion) return;

    setSaving(true);
    setError("");

    let currentSalonId: string;
    try {
      currentSalonId = await getClassroomIdByNameOrThrow(resolvedParams.salon);
    } catch (error) {
      setError("Salón no encontrado");
      setSaving(false);
      return;
    }

    try {
      // Limpiar campo 'preguntas' antes de guardar
      const { preguntas, ...evaluacionLimpia } = evaluacion;
      const exito = await guardarEvaluacion(currentSalonId, evaluacionLimpia);

      if (exito) {
        setSuccess("Progreso guardado correctamente");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Error al guardar el progreso");
      }
    } catch (error) {
      console.error("Error en guardarProgreso:", error);
      setError("Ocurrió un error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const finalizarEvaluacion = async () => {
    if (!evaluacion) return;

    const total = evaluacion.puntualidad + evaluacion.animo_y_barras +
      evaluacion.orden + evaluacion.verso_memoria + evaluacion.preguntas_correctas;

    if (total === 0) {
      setError("Por favor, ingrese al menos un puntaje");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let finalSalonId: string;
      try {
        finalSalonId = await getClassroomIdByNameOrThrow(resolvedParams.salon);
      } catch (error) {
        setError("Salón no encontrado");
        setSaving(false);
        return;
      }

      // Limpiar campo 'preguntas' antes de guardar
      const { preguntas, ...evaluacionLimpia } = evaluacion;

      console.log('💾 Guardando evaluación:', {
        salonId: finalSalonId,
        evaluacion: evaluacionLimpia,
        evaluacionKeys: Object.keys(evaluacionLimpia)
      });

      const exito = await guardarEvaluacion(finalSalonId, evaluacionLimpia);

      if (exito) {
        console.log('🎉 Evaluación guardada, redirigiendo...');
        setSuccess("✅ Evaluación completada");

        setTimeout(() => {
          console.log('🚀 Redirigiendo a resultados...');
          router.push(`/staff/jurados/${resolvedParams.juradoId}/${resolvedParams.salon}/resultados`);
        }, 800);
      } else {
        console.error('❌ guardarEvaluación falló');
        setError("Error al guardar la evaluación");
      }
    } catch (error) {
      console.error('❌ Error en finalizarEvaluacion:', error);
      setError("Ocurrió un error al guardar");
    } finally {
      console.log('🏁 Liberando botón');
      setSaving(false);
    }
  };

  const getTotalPuntaje = () => {
    if (!evaluacion) return 0;
    return evaluacion.puntualidad + evaluacion.animo_y_barras +
      evaluacion.orden + evaluacion.verso_memoria + evaluacion.preguntas_correctas;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando evaluación...</p>
        </div>
      </div>
    );
  }

  if (!evaluacion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            {error || "No se encontró la evaluación"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const salonNombre = resolvedParams.salon.charAt(0).toUpperCase() + resolvedParams.salon.slice(1);

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
                <h1 className="text-xl font-bold text-gray-900">Evaluación del Salón</h1>
                <p className="text-gray-600">{salonNombre} - {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                Puntaje Total: {getTotalPuntaje()}/100
              </Badge>
              <Button
                variant="outline"
                onClick={guardarProgreso}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <ClockIcon className="w-4 h-4" />
                <span>{saving ? "Guardando..." : "Guardar"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircleIcon className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {criterios.map((criterio) => (
            <Card key={criterio.id} className="p-6">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{criterio.nombre}</CardTitle>
                    <CardDescription>Máximo: {criterio.maximo} puntos</CardDescription>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {evaluacion[criterio.id as keyof typeof evaluacion] || 0}/{criterio.maximo}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Barra de progreso visual */}
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{
                          width: `${((evaluacion[criterio.id as keyof typeof evaluacion] || 0) / criterio.maximo) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Botones de selección con etiquetas */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(criterio.opciones || []).map((opcion: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => actualizarCampo(criterio.id, opcion.valor)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${evaluacion[criterio.id as keyof typeof evaluacion] === opcion.valor
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-800 text-sm">
                            {opcion.label}
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            {opcion.valor}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {opcion.valor} pts
                        </div>
                        {evaluacion[criterio.id as keyof typeof evaluacion] === opcion.valor && (
                          <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            onClick={finalizarEvaluacion}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? "Guardando..." : "Finalizar Evaluación"}
          </Button>
        </div>
      </div>
    </div>
  );
}
