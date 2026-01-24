"use client"
import { Controller } from "react-hook-form"
import { useCallback } from "react"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getClassroomByAge } from "@/lib/classroom"
import type { FormData } from "@/components/types"

const formatPhoneNumber = (value: string) => {
  const cleaned = value.replace(/[^\d+]/g, '')

  if (cleaned.startsWith('+51')) {
    const afterCode = cleaned.substring(3)
    if (afterCode.length <= 3) return `+51 ${afterCode}`
    if (afterCode.length <= 6) return `+51 ${afterCode.slice(0, 3)} ${afterCode.slice(3)}`
    if (afterCode.length <= 9) return `+51 ${afterCode.slice(0, 3)} ${afterCode.slice(3, 6)} ${afterCode.slice(6)}`
    return `+51 ${afterCode.slice(0, 3)} ${afterCode.slice(3, 6)} ${afterCode.slice(6, 9)}`
  }

  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
}

interface RegistrationFormProps {
  form: any
  isSubmitting: boolean
  onSubmit: (data: FormData) => void
}

export const RegistrationForm = ({ form, isSubmitting, onSubmit }: RegistrationFormProps) => {
  const renderInput = useCallback((name: keyof FormData, label: string, placeholder: string, disabled: boolean = false) => (
    <Controller
      control={form.control}
      name={name}
      key={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="mb-4">
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            {...field}
            id={field.name}
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.invalid ? `${field.name}-error` : undefined}
            placeholder={placeholder}
            className="bg-background"
            disabled={disabled || isSubmitting}
          />
          {fieldState.invalid && fieldState.error && (
            <FieldError errors={[fieldState.error]} id={`${field.name}-error`} />
          )}
        </Field>
      )}
    />
  ), [form.control, isSubmitting])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border shadow-lg bg-white/95 backdrop-blur-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg text-foreground">Registro de Participante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 ">
          {renderInput("childName", "Nombre del niño/a", "Ingresa el nombre", false)}
          {renderInput("childLastname", "Apellidos", "Ingresa los apellidos", false)}

          <Controller
            control={form.control}
            name="age"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="mb-4">
                <FieldLabel htmlFor={field.name}>Edad</FieldLabel>
                <select
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? `${field.name}-error` : undefined}
                  onChange={(e) => {
                    const age = parseInt(e.target.value)
                    field.onChange(age)
                    // Auto-asignar classroom basado en edad
                    form.setValue('classroom', getClassroomByAge(age))
                  }}
                  disabled={isSubmitting}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {[...Array(13)].map((_, i) => {
                    const age = i + 3
                    return (
                      <option key={age} value={age}>
                        {age} años
                      </option>
                    )
                  })}
                </select>
                {fieldState.invalid && fieldState.error && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="gender"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel id="gender-label">Género</FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                  className="flex gap-6 mt-2"
                  aria-labelledby="gender-label"
                  aria-describedby={fieldState.invalid ? "gender-error" : undefined}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="niño" id="niño" />
                    <Label htmlFor="niño">Niño</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="niña" id="niña" />
                    <Label htmlFor="niña">Niña</Label>
                  </div>
                </RadioGroup>
                {fieldState.invalid && fieldState.error && (
                  <FieldError errors={[fieldState.error]} id="gender-error" />
                )}
              </Field>
            )}
          />

          <Separator className="my-6" />

          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground text-center">Datos del Padre/Madre/Tutor</p>
            {renderInput("parentName", "Nombre completo", "Nombre del responsable", false)}
            <Controller
              control={form.control}
              name="parentPhone"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="mb-4">
                  <FieldLabel htmlFor={field.name}>Teléfono</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? `${field.name}-error` : undefined}
                    placeholder="Ej: +51 925 439 390 o 925 439 390"
                    className="bg-background"
                    disabled={isSubmitting}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value)
                      field.onChange(formatted)
                    }}
                  />
                  {fieldState.invalid && fieldState.error && (
                    <FieldError errors={[fieldState.error]} id={`${field.name}-error`} />
                  )}
                </Field>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <button
        type="submit"
        disabled={isSubmitting || !form.formState.isValid}
        className="w-full py-3 text-base uppercase cursor-pointer font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Procesando...</span>
          </div>
        ) : (
          <>
            {form.formState.isValid ? '🎉 Listo para inscribir' : '📝 Completa los datos'}
          </>
        )}
      </button>
    </form>
  )
}
