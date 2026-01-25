"use client"
import { useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getClassroomInfo } from "@/lib/classroom"
import type { FormData } from "./types"

interface SuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inscriptionData: FormData | null
}

export const SuccessDialog = ({ open, onOpenChange, inscriptionData }: SuccessDialogProps) => {
  const classroomInfo = inscriptionData ? getClassroomInfo(inscriptionData.classroom) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="sr-only" role="status" aria-live="polite">
        {open && "Inscripción completada exitosamente"}
      </div>
      <DialogContent className="max-w-sm mx-4 border rounded-2xl">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-20 h-20 bg-linearto-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-3xl">🎉</span>
          </div>
          <DialogTitle className="text-2xl font-bold text-center sm:text-4xl">
            <span className="text-red-500">¡</span>
            <span className="text-green-500">B</span>
            <span className="text-orange-500">i</span>
            <span className="text-blue-500">e</span>
            <span className="text-red-500">n</span>
            <span className="text-green-500">v</span>
            <span className="text-orange-500">e</span>
            <span className="text-blue-500">n</span>
            <span className="text-red-500">i</span>
            <span className="text-green-500">d</span>
            <span className="text-orange-500">o</span>
            <span className="text-red-500">!</span>
          </DialogTitle>
          <div className="text-lg font-semibold text-center">
            {useMemo(() => (
              <>
                <span className="bg-red-500 text-transparent bg-clip-text">E</span>
                <span className="bg-green-500 text-transparent bg-clip-text">B</span>
                <span className="bg-orange-500 text-transparent bg-clip-text">D</span>
                <span className="bg-blue-500 text-transparent bg-clip-text">V</span>
                <span className="bg-accent text-transparent  bg-clip-text text-lg sm:text-3xl"> 2026</span>
              </>
            ), [])}
          </div>
          <DialogDescription className="text-base font-medium text-center text-muted-foreground">
            <span className="text-accent font-bold text-lg">{inscriptionData?.childName}</span> está oficialmente inscrit{inscriptionData?.gender === "niño" ? "o" : "a"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Badge de classroom con color */}
          <div className={`text-center p-3 rounded-xl ${classroomInfo?.bgColor} border-2 ${classroomInfo?.borderColor}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {classroomInfo?.icon ? (
                <classroomInfo.icon className={`text-2xl ${classroomInfo.textColor}`} />
              ) : (
                <span className="text-2xl">{classroomInfo?.emoji}</span>
              )}
              <span className={`font-bold text-sm ${classroomInfo?.textColor}`}>
                {classroomInfo?.name}
              </span>
            </div>
            <p className={`text-xs font-medium ${classroomInfo?.textMutedColor}`}>
              {inscriptionData?.gender} • {inscriptionData?.age} años
            </p>
          </div>

          {/* Información del evento */}
          <div className="bg-linear-to-r from-yellow-50 to-orange-50 rounded-xl p-4 text-center border-2 border-orange-200">
            <p className="text-sm font-bold text-orange-800 mb-2">🏆 ¡Nos vemos en la EBDV!</p>
            <p className="text-xs font-medium text-orange-700">
              📍 Primera Iglesia Bautista<br />
              📅 Av. Leandra Torres 263<br />
              ⏰ 26-31 ene • 3-5:30pm
            </p>
          </div>
        </div>

        <Button
          onClick={() => onOpenChange(false)}
          className="w-full mt-4 bg-linear-to-r from-green-500 to-blue-500 text-white font-bold py-3 text-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 hover:scale-[1.02] shadow-lg"
        >
          🎊 ¡Increíble!
        </Button>
      </DialogContent>
    </Dialog>
  )
}
