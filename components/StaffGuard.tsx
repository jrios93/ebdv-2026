"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

type StaffRole = "maestro" | "jurado" | "admin" | "inscripciones" | "any" | Array<"maestro" | "jurado" | "admin" | "inscripciones">

export function StaffGuard({ children, role }: { children: React.ReactNode, role: StaffRole }) {
  const router = useRouter()

  useEffect(() => {
    const isAuth = localStorage.getItem("staffAuth")
    const authTime = localStorage.getItem("staffAuthTime")
    const userRole = localStorage.getItem("staffRole")
    
    if (!isAuth || isAuth !== "true") {
      router.push("/staff")
      return
    }

    // Si el rol es "any" o el usuario es admin, permitir acceso
    if (role === "any" || userRole === "admin") {
      return
    }

    // Si el rol es un array, verificar que el rol del usuario esté incluido
    if (Array.isArray(role)) {
      if (!role.includes(userRole as any)) {
        router.push("/staff")
        return
      }
    } else {
      // Si no, verificar que el rol coincida exactamente
      if (userRole !== role) {
        router.push("/staff")
        return
      }
    }

    // Opcional: expirar sesión después de 8 horas
    if (authTime) {
      const hoursElapsed = (new Date().getTime() - new Date(authTime).getTime()) / (1000 * 60 * 60)
      if (hoursElapsed > 8) {
        localStorage.removeItem("staffAuth")
        localStorage.removeItem("staffAuthTime")
        localStorage.removeItem("staffRole")
        router.push("/staff")
        return
      }
    }
  }, [router, role])

  return <>{children}</>
}