"use client"

import { cn } from "@/lib/utils"
import { Users } from "lucide-react"

interface InvitadosSelectorProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  max?: number
}

export function InvitadosSelector({
  value,
  onChange,
  disabled = false,
  max = 7
}: InvitadosSelectorProps) {
  const options = Array.from({ length: max + 1 }, (_, i) => ({
    value: i,
    label: i === 0 ? "Ninguno" : `${i} invitado${i > 1 ? 's' : ''}`,
    description: i === 0 ? "No trajo amigos hoy" : `Trajo ${i} amigo${i > 1 ? 's' : ''} hoy`
  }))

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h4 className="font-medium text-sm text-foreground">
          Invitados Registrados Hoy
        </h4>
      </div>
      <p className="text-xs text-muted-foreground">
        Amigos que invitó hoy a la EBDV (Máx. {max} por día)
      </p>

      <div className="grid grid-cols-4 gap-2">
        {options.map((option) => {
          const isSelected = value === option.value
          const isHighAchievement = option.value >= 4 && option.value <= max

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "relative px-3 py-2 text-xs font-medium rounded-md border transition-all duration-200",
                "hover:scale-105 active:scale-95",
                isSelected
                  ? cn(
                    "bg-primary text-primary-foreground border-primary shadow-md",
                    isHighAchievement && "ring-2 ring-yellow-400 ring-opacity-50"
                  )
                  : cn(
                    "bg-background border-border text-muted-foreground hover:border-primary hover:text-foreground",
                    isHighAchievement && "border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
                  ),
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="text-lg font-bold">
                  {option.value}
                </div>
                {isHighAchievement && (
                  <div className="absolute -top-1 -right-1">
                    <span className="text-yellow-500">⭐</span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>


      <div className="text-[10px] text-muted-foreground text-center">
        Registro diario. Al final del evento se premiará al alumno con mayor total acumulado.
      </div>
    </div>
  )
}
