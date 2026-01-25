"use client"

import { cn } from "@/lib/utils"
import { Users } from "lucide-react"

interface PreguntasSelectorProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function PreguntasSelector({ value, onChange, disabled = false }: PreguntasSelectorProps) {
  const options = [
    { value: 0, label: "Ninguno (0 pts)" },
    { value: 5, label: "1 niño (5 pts)" },
    { value: 10, label: "2 niños (10 pts)" },
    { value: 15, label: "3 niños (15 pts)" },
    { value: 20, label: "4 niños (20 pts)" },
    { value: 25, label: "5 niños (25 pts)" },
    { value: 30, label: "6 niños (30 pts)" }
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-sm text-foreground">Niños con Respuesta Correcta</h4>
          <p className="text-xs text-muted-foreground">3 preguntas × 2 niños × 5 puntos</p>
        </div>
      </div>
      
      {/* Grid consistente con otros botones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {options.map((option) => {
          const isSelected = value === option.value
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={cn(
                "flex-1 transition-all duration-200",
                // Mismo estilo que TabSelector existente
                isSelected 
                  ? 'bg-primary text-primary-foreground shadow-sm scale-105' 
                  : 'border-border text-muted-foreground hover:bg-muted',
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="px-3 py-2 text-center">
                {/* Punto clave mostrado */}
                <div className={cn(
                  "font-bold text-lg",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}>
                  {option.label.split('(')[0].trim()}
                </div>
                {/* Puntos en texto más pequeño */}
                <div className={cn(
                  "text-xs",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  ({option.label.split('(')[1]})
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Barra de progreso AL FINAL */}
      <div className="bg-muted/50 rounded-lg px-3 py-2 border border-muted">
        <div className="text-right">
          <div className="text-lg font-bold text-foreground">{value}/30 pts</div>
          <div className="text-xs text-muted-foreground">Puntos totales</div>
        </div>
      </div>
    </div>
  )
}