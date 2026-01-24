import z from "zod"

export const PROJECT_STATUSES = ["draft", "active", "finished"] as const

export const CLASSROOM_TYPES = ["vida", "luz", "gracia", "verdad"] as const

export const projectSchema = z.object({
  childName: z.string()
    .min(2, "El nombre del niño es requerido")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, "El nombre solo puede contener letras, espacios, acentos, guiones y apóstrofes"),
  childLastname: z.string()
    .min(2, "El apellido del niño es requerido")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, "Los apellidos solo pueden contener letras, espacios, acentos, guiones y apóstrofes"),
  age: z.number().min(3).max(15, "La edad debe estar entre 3 y 15 años"),
  gender: z.enum(["niño", "niña"], {
    message: "Debe seleccionar niño o niña"
  }),
  parentName: z.string()
    .min(2, "El nombre del padre/tutor es requerido")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, "El nombre solo puede contener letras, espacios, acentos, guiones y apóstrofes"),
  parentPhone: z.string()
    .regex(/^\+?[0-9\s()-]+$/, "Solo se permiten números, espacios, +, () y -")
    .transform(val => val.replace(/\s/g, '').replace(/[()-]/g, ''))
    .refine(val => {
      // Quitar el +51 si existe para contar solo los 9 dígitos del móvil
      const mobileOnly = val.replace(/^\+51/, '')
      return mobileOnly.length >= 7 && mobileOnly.length <= 9
    }, "El teléfono peruano debe tener entre 7-9 dígitos (ej: +51 999 123 456)")
    .refine(val => val.length <= 15, "El teléfono no puede exceder 15 dígitos"),
  classroom: z.enum(CLASSROOM_TYPES, {
    message: "Debe seleccionar una clase válida"
  }),
})

