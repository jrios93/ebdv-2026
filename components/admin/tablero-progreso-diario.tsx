"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Trophy, Users, Calendar, Crown } from "lucide-react"
import { FaSeedling, FaDove, FaBible } from "react-icons/fa"
import { IoSunnySharp } from "react-icons/io5"
import { Alumno, getTableroProgresoDiario } from "@/lib/supabaseQueries"

interface TableroCaminoLudoProps {
  classrooms: Array<{
    name: string
    title: string
    icon: any
    color: string
    bgColor: string
    borderColor: string
    textColor: string
    textMutedColor: string
  }>
}

interface AlumnoConPuntaje {
  alumno: Alumno
  puntosDia: number
  totalAcumulado: number
  esDestacado: boolean
}

interface DiaSalonData {
  salon: string
  dia: string
  alumnos: AlumnoConPuntaje[]
}

// Componente Tooltip mejorado que no tapa la ficha
function TooltipAlumno({ alumno, classroom, isDestacado, children }: {
  alumno: AlumnoConPuntaje,
  classroom: any,
  isDestacado: boolean,
  children: React.ReactNode
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top')

  return (
    <div
      className="relative inline-block"
      style={{ zIndex: 9998 }}
      onMouseEnter={(e) => {
        // Calcular si hay espacio arriba para el tooltip
        const rect = e.currentTarget.getBoundingClientRect()
        const spaceAbove = rect.top
        const spaceBelow = window.innerHeight - rect.bottom
        setTooltipPosition(spaceAbove > 120 ? 'top' : 'bottom')
        setShowTooltip(true)
      }}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}

      {showTooltip && (
        <div
          className={`absolute z-[9999] px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-xl min-w-[180px] whitespace-nowrap
            ${tooltipPosition === 'top'
              ? 'bottom-full mb-2 left-1/2 transform -translate-x-1/2'
              : 'top-full mt-2 left-1/2 transform -translate-x-1/2'
            }`}
          style={{ zIndex: 9999 }}
        >
          {/* Triángulo del tooltip */}
          <div className={`absolute w-3 h-3 bg-white border border-gray-200 transform rotate-45 z-[9999] 
            ${tooltipPosition === 'top'
              ? '-bottom-1.5 left-1/2 -translate-x-1/2 border-t-0 border-l-0'
              : '-top-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0'
            }`}
            style={{ zIndex: 9999 }}
          />

          <div className="relative z-[9999]" style={{ zIndex: 9999 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${classroom.bgColor.replace('bg-', 'bg-')}`}></div>
              <div className="font-bold text-gray-800">{alumno.alumno.nombre}</div>
              {isDestacado && <Crown className="w-4 h-4 text-yellow-500 ml-auto" />}
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Puntos del día:</span>
                <span className="font-bold">{alumno.puntosDia}</span>
              </div>
              <div className="flex justify-between">
                <span>Total acumulado:</span>
                <span className="font-bold">{alumno.totalAcumulado}</span>
              </div>
              <div className="flex justify-between">
                <span>Salón:</span>
                <span className={classroom.textColor}>{classroom.name}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function TableroCaminoLudo() {
  const [datosDiarios, setDatosDiarios] = useState<DiaSalonData[]>([])
  const [loading, setLoading] = useState(true)

  const classrooms = [
    {
      name: 'vida',
      title: 'Salón Vida',
      icon: FaSeedling,
      color: 'green',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      textColor: 'text-green-700',
      textMutedColor: 'text-green-600'
    },
    {
      name: 'luz',
      title: 'Salón Luz',
      icon: IoSunnySharp,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-700',
      textMutedColor: 'text-yellow-600'
    },
    {
      name: 'gracia',
      title: 'Salón Gracia',
      icon: FaDove,
      color: 'red',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      textColor: 'text-red-700',
      textMutedColor: 'text-red-600'
    },
    {
      name: 'verdad',
      title: 'Salón Verdad',
      icon: FaBible,
      color: 'blue',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-700',
      textMutedColor: 'text-blue-600'
    }
  ]

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        const datos = await getTableroProgresoDiario(7) // Últimos 7 días
        setDatosDiarios(datos)
      } catch (error) {
        console.error('Error cargando datos del tablero:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  // Agrupar datos por salón
  const datosPorSalon = classrooms.reduce((acc: Record<string, DiaSalonData[]>, classroom) => {
    const salonName = classroom.name
    acc[salonName] = datosDiarios.filter(d => d.salon === salonName)
    return acc
  }, {} as Record<string, DiaSalonData[]>)

  // Obtener todos los días únicos ordenados (descendente)
  const todosLosDias = [...new Set(datosDiarios.map(d => d.dia))].sort().reverse()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tablero...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-4 md:p-6">
      {/* Encabezado simple */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Camino del Progreso</h1>
        <p className="text-gray-600">Cada cuadrado representa un día de estudio del Verbo </p>
      </div>

      {/* Tablero principal - Vertical tipo Ludo */}
      <div className="flex flex-col items-center max-w-7xl mx-auto">

        {/* META - Parte superior */}
        <div className="relative mb-12 w-full max-w-2xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 shadow-lg border-2 border-yellow-600">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Trophy className="w-8 h-8 text-white" />
                  <h2 className="text-2xl md:text-3xl font-bold text-white">META ESPIRITUAL</h2>
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <p className="text-white/90 text-sm md:text-base">Avance diario en el estudio del "Verbo"</p>
              </div>
            </div>

            {/* Flecha hacia abajo */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-12 border-r-12 border-t-16 border-l-transparent border-r-transparent border-t-yellow-500"></div>
            </div>
          </motion.div>
        </div>

        {/* Camino con días - Versión mejorada */}
        <div className="relative w-full">
          {/* Línea del camino central */}
          <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-gradient-to-b from-yellow-400 via-blue-400 to-gray-300 transform -translate-x-1/2 z-0 rounded-full shadow-md"></div>

          {/* Días ordenados verticalmente */}
          <div className="relative z-10 space-y-8 md:space-y-12">
            {todosLosDias.map((dia, diaIndex) => {
              const fecha = new Date(dia + 'T00:00:00')
              const diaSemana = fecha.toLocaleDateString('es-PE', { weekday: 'short' })
              const diaMes = fecha.getDate()
              const mes = fecha.toLocaleDateString('es-PE', { month: 'short' })

              return (
                <motion.div
                  key={dia}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: diaIndex * 0.1 }}
                  className="relative"
                >
                  {/* Encabezado de día - Arriba */}
                  <div className="mb-6 text-center">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="inline-flex items-center gap-3 bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg backdrop-blur-sm bg-white/95"
                    >
                      <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="text-lg font-bold text-gray-800">
                        {diaSemana} {diaMes} {mes}
                      </div>
                      <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Día {todosLosDias.length - diaIndex}
                      </div>
                    </motion.div>
                  </div>

                  {/* Salones a los lados */}
                  <div className="flex flex-col md:flex-row justify-between items-stretch gap-6 md:gap-12">
                    {/* Lado izquierdo - Primeros salones */}
                    <div className="flex-1 space-y-4">
                      {classrooms.slice(0, Math.ceil(classrooms.length / 2)).map((classroom) => {
                        const datosSalon = datosPorSalon[classroom.name] || []
                        const datosDia = datosSalon.find(d => d.dia === dia)
                        const alumnosDelDia = datosDia?.alumnos || []
                        const destacadosDelDia = alumnosDelDia.filter(a => a.esDestacado).sort((a, b) => b.totalAcumulado - a.totalAcumulado)
                        const regularDelDia = alumnosDelDia.filter(a => !a.esDestacado).sort((a, b) => b.totalAcumulado - a.totalAcumulado)

                        return (
                          <motion.div
                            key={`${classroom.name}-${dia}`}
                            whileHover={{ y: -2 }}
                            className={`${classroom.bgColor} rounded-xl shadow-md p-4 border ${classroom.borderColor}`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${classroom.textColor.replace('text-', 'bg-').replace('-700', '-500')} text-white`}>
                                <classroom.icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className={`font-bold ${classroom.textColor}`}>{classroom.name}</h3>
                                <p className="text-xs text-gray-500">{classroom.title}</p>
                              </div>
                              <div className="text-sm bg-white/80 px-3 py-1 rounded-full border">
                                {alumnosDelDia.length} asist.
                              </div>
                            </div>

                            {/* Fichas */}
                            {alumnosDelDia.length > 0 ? (
                              <div className="space-y-3">
                                {/* Fichas destacadas */}
                                {destacadosDelDia.length > 0 && (
                                  <div className="relative">
                                    <div className="flex items-center gap-2 mb-6">
                                      <Crown className="w-4 h-4 text-yellow-500" />
                                      <span className={`text-xs font-medium ${classroom.textMutedColor}`}>
                                        Destacados
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1">
                                      {destacadosDelDia.map((alumno, index) => {
                                        // Calcular el puntaje máximo entre destacados
                                        const puntajeMaximo = destacadosDelDia.length > 0 ? Math.max(...destacadosDelDia.map(a => a.totalAcumulado)) : 0
                                        const esMejorPuntaje = alumno.totalAcumulado === puntajeMaximo

                                        return (
                                          <React.Fragment key={`destacado-${alumno.alumno.id}`}>
                                            <TooltipAlumno
                                              alumno={alumno}
                                              classroom={classroom}
                                              isDestacado={true}
                                            >
                                              <motion.div
                                                whileHover={{ scale: 1.2, y: -3 }}
                                                className={`w-9 h-9 rounded-full ${classroom.textColor.replace('text-', 'bg-').replace('-700', '-600')} ${classroom.name === "luz" ? "bg-yellow-600" : ""} border-2 border-yellow-400 shadow-lg cursor-pointer flex items-center justify-center relative`}
                                              >
                                                <span className={` font-semibold text-white`}>
                                                  {alumno.alumno.nombre.charAt(0)}
                                                </span>
                                                {/* Puntito amarillo indicador de destacado */}
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
                                                {/* Trofeo para el mejor puntaje */}
                                                {esMejorPuntaje && (
                                                  <div className="absolute -top-4 -left-4 rounded-full bg-white p-1  border-yellow-400 border-2">
                                                    <Trophy className="w-4 h-4 text-yellow-500 drop-shadow-sm" />
                                                  </div>
                                                )}
                                              </motion.div>
                                            </TooltipAlumno>
                                            {index < destacadosDelDia.length - 1 && (
                                              <div className="w-3 h-px bg-gray-300 mx-1"></div>
                                            )}
                                          </React.Fragment>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Separador visual entre niveles */}
                                {destacadosDelDia.length > 0 && regularDelDia.length > 0 && (
                                  <div className="flex items-center justify-center py-2">
                                    <div className="h-px bg-gray-300 w-full"></div>
                                    <div className="px-2 text-xs text-gray-400">|</div>
                                    <div className="h-px bg-gray-300 w-full"></div>
                                  </div>
                                )}

                                {/* Fichas regulares */}
                                {regularDelDia.length > 0 && (
                                  <div>
                                    <div className={`text-xs font-medium ${classroom.textMutedColor} mb-2`}>
                                      Asistentes
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1">
                                      {regularDelDia.map((alumno, index) => (
                                        <React.Fragment key={`regular-${alumno.alumno.id}`}>
                                          <TooltipAlumno
                                            alumno={alumno}
                                            classroom={classroom}
                                            isDestacado={false}
                                          >
                                            <motion.div
                                              whileHover={{ scale: 1.1, y: -2 }}
                                              className={`w-7 h-7 rounded-full ${classroom.textColor.replace('text-', 'bg-').replace('-700', '-400')} border border-white shadow-sm cursor-pointer`}
                                              style={{
                                                transform: `translateX(${index * 1.5}px)`
                                              }}
                                            />
                                          </TooltipAlumno>
                                          {index < regularDelDia.length - 1 && (
                                            <div className="w-2 h-px bg-gray-200 mx-0.5"></div>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-6 text-gray-400 text-sm">
                                <div className="opacity-50">Sin asistencia este día</div>
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Lado derecho - Resto de salones */}
                    <div className="flex-1 space-y-4">
                      {classrooms.slice(Math.ceil(classrooms.length / 2)).map((classroom) => {
                        const datosSalon = datosPorSalon[classroom.name] || []
                        const datosDia = datosSalon.find(d => d.dia === dia)
                        const alumnosDelDia = datosDia?.alumnos || []
                        const destacadosDelDia = alumnosDelDia.filter(a => a.esDestacado).sort((a, b) => b.totalAcumulado - a.totalAcumulado)
                        const regularDelDia = alumnosDelDia.filter(a => !a.esDestacado).sort((a, b) => b.totalAcumulado - a.totalAcumulado)

                        return (
                          <motion.div
                            key={`${classroom.name}-${dia}`}
                            whileHover={{ y: -2 }}
                            className={`${classroom.bgColor} rounded-xl shadow-md p-4 border ${classroom.borderColor}`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${classroom.textColor.replace('text-', 'bg-').replace('-700', '-500')} text-white`}>
                                <classroom.icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className={`font-bold ${classroom.textColor}`}>{classroom.name}</h3>
                                <p className="text-xs text-gray-500">{classroom.title}</p>
                              </div>
                              <div className="text-sm bg-white/80 px-3 py-1 rounded-full border">
                                {alumnosDelDia.length} asist.
                              </div>
                            </div>

                            {/* Fichas */}
                            {alumnosDelDia.length > 0 ? (
                              <div className="space-y-3">
                                {/* Fichas destacadas */}
                                {destacadosDelDia.length > 0 && (
                                  <div className="relative">
                                    <div className="flex items-center gap-2 mb-6">
                                      <Crown className="w-4 h-4 text-yellow-500" />
                                      <span className={`text-xs font-medium  ${classroom.textMutedColor}`}>
                                        Destacados
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1">
                                      {destacadosDelDia.map((alumno, index) => {
                                        // Calcular el puntaje máximo entre destacados
                                        const puntajeMaximo = destacadosDelDia.length > 0 ? Math.max(...destacadosDelDia.map(a => a.totalAcumulado)) : 0
                                        const esMejorPuntaje = alumno.totalAcumulado === puntajeMaximo

                                        return (
                                          <React.Fragment key={`destacado-${alumno.alumno.id}`}>
                                            <TooltipAlumno
                                              alumno={alumno}
                                              classroom={classroom}
                                              isDestacado={true}
                                            >
                                              <motion.div
                                                whileHover={{ scale: 1.2, y: -3 }}
                                                className={`w-9 h-9 rounded-full ${classroom.textColor.replace('text-', 'bg-').replace('-700', '-600')} ${classroom.name === "gracia" ? "bg-red-600" : ""}  border-2 border-yellow-400 shadow-lg cursor-pointer flex items-center justify-center relative`}
                                              >
                                                <span className={`text-xs font-bold text-white `}>
                                                  {alumno.alumno.nombre.charAt(0)}
                                                </span>
                                                {/* Puntito amarillo indicador de destacado */}
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
                                                {/* Trofeo para el mejor puntaje */}
                                                {esMejorPuntaje && (

                                                  <div className="absolute -top-4 -left-4 rounded-full bg-white p-1  border-yellow-400 border-2">
                                                    <Trophy className="w-4 h-4 text-yellow-500 drop-shadow-sm" />
                                                  </div>
                                                )}
                                              </motion.div>
                                            </TooltipAlumno>
                                            {index < destacadosDelDia.length - 1 && (
                                              <div className="w-3 h-px bg-gray-300 mx-1"></div>
                                            )}
                                          </React.Fragment>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Separador visual entre niveles */}
                                {destacadosDelDia.length > 0 && regularDelDia.length > 0 && (
                                  <div className="flex items-center justify-center py-2">
                                    <div className="h-px bg-gray-300 w-full"></div>
                                    <div className="px-2 text-xs text-gray-400">|</div>
                                    <div className="h-px bg-gray-300 w-full"></div>
                                  </div>
                                )}

                                {/* Fichas regulares */}
                                {regularDelDia.length > 0 && (
                                  <div>
                                    <div className={`text-xs font-medium ${classroom.textMutedColor} mb-2`}>
                                      Asistentes
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1">
                                      {regularDelDia.map((alumno, index) => (
                                        <React.Fragment key={`regular-${alumno.alumno.id}`}>
                                          <TooltipAlumno
                                            alumno={alumno}
                                            classroom={classroom}
                                            isDestacado={false}
                                          >
                                            <motion.div
                                              whileHover={{ scale: 1.1, y: -2 }}
                                              className={`w-7 h-7 rounded-full ${classroom.textColor.replace('text-', 'bg-').replace('-700', '-400')} border border-white shadow-sm cursor-pointer`}
                                              style={{
                                                transform: `translateX(${index * 1.5}px)`
                                              }}
                                            />
                                          </TooltipAlumno>
                                          {index < regularDelDia.length - 1 && (
                                            <div className="w-2 h-px bg-gray-200 mx-0.5"></div>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-6 text-gray-400 text-sm">
                                <div className="opacity-50">Sin asistencia este día</div>
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Leyenda mejorada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white rounded-xl shadow-lg p-6 max-w-4xl w-full border border-gray-200"
        >
          <h3 className="font-bold text-gray-800 mb-6 text-center text-lg">Guía del Tablero</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-full bg-green-600 border-2 border-yellow-400 shadow-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">V</span>
                </div>
              </div>
              <div className="font-medium text-gray-800">Ficha destacada</div>
              <div className="text-gray-600 text-sm mt-1">Mayor puntaje acumulado</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-400 shadow-sm"></div>
              </div>
              <div className="font-medium text-gray-800">Ficha regular</div>
              <div className="text-gray-600 text-sm mt-1">Alumno asistente</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded-full bg-green-400"></div>
                  <div className="w-6 h-6 rounded-full bg-yellow-400"></div>
                  <div className="w-6 h-6 rounded-full bg-red-400"></div>
                  <div className="w-6 h-6 rounded-full bg-blue-400"></div>
                </div>
              </div>
              <div className="font-medium text-gray-800">Colores por salón</div>
              <div className="text-gray-600 text-sm mt-1">Vida, Luz, Gracia, Verdad</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-yellow-500 rounded-lg p-3 w-12 h-12 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="font-medium text-gray-800">Meta espiritual</div>
              <div className="text-gray-600 text-sm mt-1">Objetivo final del camino</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              <p>🎯 Pasa el cursor sobre cualquier ficha para ver sus detalles</p>
              <p>📊 Cada cuadrado muestra la asistencia de un día específico</p>
              <p className="mt-2 text-gray-500 italic">"EBDV2026 - Él Verbo"</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div >
  )
}
