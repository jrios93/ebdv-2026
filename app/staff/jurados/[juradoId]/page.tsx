"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeftIcon, ClockIcon, UsersIcon, MapPinIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import { obtenerSalonesConEstado } from "@/lib/juradoService";

interface Salon {
  id: string;
  nombre: string;
  edad_min: number;
  edad_max: number;
  color: string;
  activo: boolean;
  estado: "pendiente" | "en_evaluacion" | "completado";
  total_jurados: number;
  jurados_evaluaron: number;
  promedio_puntaje?: number;
  ultima_actualizacion?: string;
}

export default function JuradoPortalPage({ params }: { params: Promise<{ juradoId: string }> }) {
  const resolvedParams = use(params);
  const [salones, setSalones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    cargarDatos();
  }, [resolvedParams.juradoId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Obtener salones con estado desde Supabase
      const salonesData = await obtenerSalonesConEstado();
      setSalones(salonesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError("No se pudieron cargar los datos. Por favor, intente recargar la página.");
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="secondary" className="text-sm">Pendiente</Badge>;
      case "en_evaluacion":
        return <Badge className="bg-yellow-100 text-yellow-800 text-sm">En Evaluación</Badge>;
      case "completado":
        return <Badge className="bg-green-100 text-green-800 text-sm">Completado</Badge>;
      default:
        return <Badge variant="outline" className="text-sm">Desconocido</Badge>;
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
      case "en_evaluacion":
        return <AlertCircleIcon className="w-5 h-5 text-yellow-500" />;
      case "completado":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con información del jurado */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push("/staff/jurados")}
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Salir</span>
              </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portal del Jurado</h1>
              <p className="text-lg text-gray-600">Sistema de Evaluación EBDV 2026</p>
              <p className="text-sm text-gray-500">Panel de Evaluación</p>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de salones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Salones Asignados</h2>
          <p className="text-gray-600">
            Seleccione un salón para comenzar o continuar la evaluación de proyectos
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {salones.map((salon) => (
              <Card key={salon.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1 flex items-center space-x-2">
                        <span>{salon.nombre}</span>
                        <Badge variant="outline" className="text-xs" style={{ backgroundColor: salon.color + '20', color: salon.color }}>
                          {salon.edad_min}-{salon.edad_max} años
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 mb-3">
                        Nivel: {salon.edad_min <= 5 ? 'Párvulos' : salon.edad_min <= 9 ? 'Principiantes' : salon.edad_min <= 12 ? 'Primarios' : 'Adolescentes'}
                      </CardDescription>
                      <div className="flex items-center space-x-2">
                        {getEstadoBadge(salon.estado)}
                        {getEstadoIcon(salon.estado)}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-700">Jurados</p>
                        <p className="text-gray-600">
                          {salon.jurados_evaluaron}/{salon.total_jurados}
                        </p>
                      </div>
                    </div>
                    {salon.promedio_puntaje !== undefined && (
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-700">Promedio</p>
                          <p className="text-gray-600">{salon.promedio_puntaje.toFixed(1)} pts</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      className="w-full"
                      onClick={() => router.push(`/staff/jurados/${resolvedParams.juradoId}/${salon.nombre.toLowerCase()}/evaluar`)}
                      disabled={salon.estado === "completado"}
                      variant={salon.estado === "completado" ? "outline" : "default"}
                    >
                      {salon.estado === "pendiente" && "Comenzar Evaluación"}
                      {salon.estado === "en_evaluacion" && "Continuar Evaluación"}
                      {salon.estado === "completado" && "Evaluación Completada"}
                    </Button>
                    
                    {salon.estado !== "pendiente" && (
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => router.push(`/staff/jurados/${resolvedParams.juradoId}/${salon.nombre.toLowerCase()}/resultados`)}
                      >
                        Ver Resultados
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}