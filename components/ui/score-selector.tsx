"use client"

import { cn } from "@/lib/utils"

interface ScoreSelectorProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  label?: string
  description?: string
  options?: Array<{ value: number; label: string }>
  max?: number
}

export function ScoreSelector({ 
  value, 
  onChange, 
  disabled = false, 
  label, 
  description, 
  options,
  max = 10
}: ScoreSelectorProps) {
  // Si se proporciona max, generar opciones automáticamente
  const generatedOptions = options || Array.from({ length: max + 1 }, (_, i) => ({
    value: i,
    label: i.toString()
  }))

  return (
    <div className="space-y-2">
      {label && <h4 className="font-medium text-sm text-foreground">{label}</h4>}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      
      <div className={`grid gap-2 ${generatedOptions.length > 10 ? 'grid-cols-6' : generatedOptions.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {generatedOptions.map((option) => {
          const isSelected = value === option.value
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={cn(
                "flex-1 transition-all duration-200",
                isSelected 
                  ? 'bg-primary text-primary-foreground shadow-sm scale-105' 
                  : 'border-border text-muted-foreground hover:bg-muted',
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="px-2 py-2 text-center">
                <div className={cn(
                  "font-bold text-sm",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}>
                  {option.label}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}