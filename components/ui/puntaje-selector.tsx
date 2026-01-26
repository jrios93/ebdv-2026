"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface ScoreOption {
  label: string;
  value: number;
  description: string;
  color: string;
}

interface PuntajeSelectorProps {
  options: ScoreOption[];
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  maxScore: number;
  criterio: string;
}

export function PuntajeSelector({ 
  options, 
  value, 
  onChange, 
  disabled = false,
  maxScore,
  criterio
}: PuntajeSelectorProps) {
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  const getProgressWidth = () => {
    if (value === 0) return 0;
    return (value / maxScore) * 100;
  };

  const getCurrentLabel = () => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : "Sin calificar";
  };

  const getCurrentColor = () => {
    const option = options.find(opt => opt.value === value);
    return option ? option.color : "bg-gray-300";
  };

  return (
    <div className="space-y-4">
      {/* Barra de progreso visual */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${getCurrentColor()}`}
            style={{ width: `${getProgressWidth()}%` }}
          ></div>
        </div>
        
        {/* Indicador actual */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300"
          style={{ left: `${Math.max(2, Math.min(98, getProgressWidth()))}%` }}
        >
          <div className="w-6 h-6 bg-white border-4 border-blue-500 rounded-full shadow-lg"></div>
        </div>
      </div>

      {/* Puntuación actual destacada */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-800">
          {value}/{maxScore} pts
        </div>
        <Badge 
          variant="secondary" 
          className="mt-1 text-sm px-3 py-1"
        >
          {getCurrentLabel()}
        </Badge>
      </div>

      {/* Opciones de puntuación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            onMouseEnter={() => setHoveredOption(option.value)}
            onMouseLeave={() => setHoveredOption(null)}
            disabled={disabled}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200 text-left
              ${value === option.value 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${hoveredOption === option.value ? 'transform scale-105' : ''}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800 text-sm">
                {option.label}
              </span>
              <span className="text-lg font-bold text-blue-600">
                {option.value}pts
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {option.description}
            </p>
            {value === option.value && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Opciones predefinidas para diferentes criterios
export const PUNTUACION_OPCIONES = {
  PUNTUALIDAD: [
    { label: "Malo (0%)", value: 0, description: "No llegó a tiempo", color: "bg-red-500" },
    { label: "Regular (25%)", value: 2.5, description: "Llegó con retraso", color: "bg-orange-500" },
    { label: "Bueno (50%)", value: 5, description: "Llegó casi a tiempo", color: "bg-yellow-500" },
    { label: "Muy Bueno (75%)", value: 7.5, description: "Llegó justo a tiempo", color: "bg-lime-500" },
    { label: "Excelente (100%)", value: 10, description: "Llegó antes de tiempo", color: "bg-green-500" }
  ],
  BASICO_20: [
    { label: "Malo", value: 5, description: "Rendimiento bajo", color: "bg-red-500" },
    { label: "Regular", value: 10, description: "Rendimiento básico", color: "bg-orange-500" },
    { label: "Bueno", value: 15, description: "Buen rendimiento", color: "bg-yellow-500" },
    { label: "Excelente", value: 20, description: "Rendimiento sobresaliente", color: "bg-green-500" }
  ],
  NIÑOS_30: [
    { label: "Ninguno", value: 0, description: "No respondió", color: "bg-gray-400" },
    { label: "1 niño", value: 5, description: "Respuesta correcta", color: "bg-red-400" },
    { label: "2 niños", value: 10, description: "2 respuestas correctas", color: "bg-orange-400" },
    { label: "3 niños", value: 15, description: "3 respuestas correctas", color: "bg-yellow-400" },
    { label: "4 niños", value: 20, description: "4 respuestas correctas", color: "bg-lime-400" },
    { label: "5 niños", value: 25, description: "5 respuestas correctas", color: "bg-green-400" },
    { label: "6 niños", value: 30, description: "6 respuestas correctas", color: "bg-green-600" }
  ]
};