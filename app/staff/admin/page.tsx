"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Star, Heart, LogOut, Clock, Shield, TrendingUp, Award, UserPlus, Download, Calendar } from "lucide-react"
import { StaffGuard } from "@/components/StaffGuard"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { 
  getStatsDashboard, 
  getTopAlumnosToday, 
  getClassroomRankingToday,
  getTopInvitadosToday,
  getAllEvaluacionesToday,
  getAllSalonesEvaluadosToday,
  getAlumnosPorSalon,
  getResumenSemanal
} from "@/lib/supabaseQueries"

interface Stats {
  totalAlumnos: number
  evaluacionesHoy: number
  totalHoy: number
  mejorClassroom: string | null
  puntualidadAsistencia: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalAlumnos: 0,
    evaluacionesHoy: 0,
    totalHoy: 0,
    mejorClassroom: null,
    puntualidadAsistencia: 0
  })
  const [topAlumnos, setTopAlumnos] = useState<any[]>([])
  const [classroomRanking, setClassroomRanking] = useState<any[]>([])
  const [topInvitados, setTopInvitados] = useState<any[]>([])
  const [alumnosPorSalon, setAlumnosPorSalon] = useState<Array<{salon: string, cantidad: number, asistidos: number}>>([])
  const [resumenSemanal, setResumenSemanal] = useState<{
    rankingAlumnos: Array<{
      alumno: any
      totalPuntos: number
      totalInvitados: number
      posicion: number
    }>
    rankingSalones: Array<{
      salon: string
      totalPuntos: number
      posicion: number
    }>
    campeonInvitados: {
      alumno: any
      totalInvitados: number
    } | null
  }>({ rankingAlumnos: [], rankingSalones: [], campeonInvitados: null })
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsData, alumnosData, rankingData, invitadosData, salonData, semanalData] = await Promise.all([
          getStatsDashboard(),
          getTopAlumnosToday(5),
          getClassroomRankingToday(),
          getTopInvitadosToday(3),
          getAlumnosPorSalon(),
          getResumenSemanal()
        ])

        setStats(statsData)
        setTopAlumnos(alumnosData || [])
        setClassroomRanking(rankingData || [])
        setTopInvitados(invitadosData || [])
        setAlumnosPorSalon(salonData || [])
        setResumenSemanal(semanalData)
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const exportEvaluacionesToExcel = async () => {
    setIsExporting(true)
    try {
      const data = await getAllEvaluacionesToday()
      if (!data) {
        alert('No hay evaluaciones para exportar hoy')
        return
      }

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Evaluaciones Hoy')
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      const fileName = `evaluaciones_${new Date().toISOString().split('T')[0]}.xlsx`
      saveAs(blob, fileName)
    } catch (error) {
      console.error('Error exportando evaluaciones:', error)
      alert('Error al exportar evaluaciones')
    } finally {
      setIsExporting(false)
    }
  }

  const exportSalonesToExcel = async () => {
    setIsExporting(true)
    try {
      const data = await getAllSalonesEvaluadosToday()
      if (!data) {
        alert('No hay datos de salones para exportar hoy')
        return
      }

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Salones Hoy')
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      const fileName = `salones_${new Date().toISOString().split('T')[0]}.xlsx`
      saveAs(blob, fileName)
    } catch (error) {
      console.error('Error exportando salones:', error)
      alert('Error al exportar salones')
    } finally {
      setIsExporting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("staffAuth")
    localStorage.removeItem("staffAuthTime")
    localStorage.removeItem("staffRole")
    window.location.href = "/"
  }



  const classrooms = [
    { name: "vida", title: "Vida", icon: Heart, color: "bg-green-100 text-green-700 border-green-300" },
    { name: "luz", title: "Luz", icon: Star, color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
    { name: "gracia", title: "Gracia", icon: Heart, color: "bg-red-100 text-red-700 border-red-300" },
    { name: "verdad", title: "Verdad", icon: Trophy, color: "bg-blue-100 text-blue-700 border-blue-300" }
  ]

  // Calcular totales para decisiones operativas
  const totalAsistidosHoy = alumnosPorSalon.reduce((sum, salon) => sum + salon.asistidos, 0)
  const porcentajeAsistencia = stats.totalAlumnos > 0 ? Math.round((totalAsistidosHoy / stats.totalAlumnos) * 100) : 0

  return (
    <StaffGuard role="admin">
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4">
              <span className="text-red-500">E</span>
              <span className="text-green-500">B</span>
              <span className="text-orange-500">D</span>
              <span className="text-blue-500">V</span>
              <span className="text-purple-500">2026</span>
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-2">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Panel de Administración</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>•</span>
              <span>{new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* 1. DISTRIBUCIÓN DE ALUMNOS (Contexto General) */}
          <Card className="border-border mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-6 h-6 text-blue-600" />
                Inscritos vs Asistencias por Salón
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Cargando distribución...</div>
              ) : alumnosPorSalon.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {alumnosPorSalon.map((salon) => {
                      const classroom = classrooms.find(c => c.name === salon.salon.toLowerCase())
                      const IconComponent = classroom?.icon || Users
                      const color = classroom?.color || "bg-gray-100 text-gray-700 border-gray-300"
                      
                      return (
                        <div key={salon.salon} className={`p-6 rounded-lg border-2 ${color} text-center shadow-sm hover:shadow-md transition-shadow`}>
                          <IconComponent className="w-10 h-10 mx-auto mb-3" />
                          <div className="text-3xl font-bold mb-1 text-red-600">{salon.asistidos}</div>
                          <div className="text-sm capitalize font-medium">{salon.salon}</div>
                          <div className="text-xs opacity-75 mb-2">ASISTIDOS HOY</div>
                          <div className="flex items-center justify-center gap-2">
                            <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                              📋 {salon.cantidad} inscritos
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ({salon.cantidad > 0 ? Math.round((salon.asistidos / salon.cantidad) * 100) : 0}%)
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div className="p-6 rounded-lg border-2 border-dashed border-red-300 text-center bg-white/70 shadow-sm">
                      <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center">
                        <Users className="w-8 h-8 text-red-600" />
                      </div>
                      <div className="text-3xl font-bold text-red-700 mb-1">{totalAsistidosHoy}</div>
                      <div className="text-sm font-medium text-red-600">TOTAL ASISTIDOS</div>
                      <div className="text-xs text-gray-500 mb-2">Para decisiones operativas</div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          📋 {stats.totalAlumnos} inscritos
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({porcentajeAsistencia}%)
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground bg-white/50 rounded-lg p-3">
                    <Users className="w-4 h-4 inline mr-2" />
                    Participación activa en el evento EBDV 2026
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No hay datos de distribución de alumnos</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. RESUMEN SEMANAL (Datos Estratégicos) */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                🏆 Resumen Semanal - Competencia EBDV 2026
              </h2>
              <p className="text-sm text-muted-foreground">
                Posiciones acumuladas durante toda la semana
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ranking Alumnos Semanal */}
              <Card className="border-border bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                    Ganadores por Salón
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Premio #1 de cada salón</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Cargando ranking...</div>
                  ) : resumenSemanal.rankingAlumnos.length > 0 ? (
                    <div className="space-y-3">
                      {resumenSemanal.rankingAlumnos.slice(0, 5).map((item, index) => {
                        const isFirstInClassroom = index === 0 || 
                          (index > 0 && resumenSemanal.rankingAlumnos[index-1].alumno.classroom_id !== item.alumno.classroom_id)
                        
                        return (
                          <div key={item.alumno.id} className={`relative rounded-lg p-3 transition-all ${
                            isFirstInClassroom 
                              ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 shadow-sm' 
                              : 'bg-white/70'
                          }`}>
                            {isFirstInClassroom && (
                              <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                🏆
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow ${
                                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 
                                  index === 1 ? 'bg-gray-400' : 
                                  index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                                }`}>
                                  {item.posicion}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{item.alumno.nombre} {item.alumno.apellidos}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{item.totalPuntos} pts</span>
                                    {item.totalInvitados > 0 && (
                                      <span className="text-green-600">👥 {item.totalInvitados}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Sin datos semanales aún</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ranking Salones Semanal */}
              <Card className="border-border bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    Ranking de Salones
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Puntos grupales</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Cargando ranking...</div>
                  ) : resumenSemanal.rankingSalones.length > 0 ? (
                    <div className="space-y-3">
                      {resumenSemanal.rankingSalones.map((salon, index) => {
                        const classroom = classrooms.find(c => c.name === salon.salon.toLowerCase())
                        const IconComponent = classroom?.icon || TrendingUp
                        
                        return (
                          <div key={salon.salon} className={`flex items-center justify-between rounded-lg p-3 transition-all ${
                            index === 0 ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 shadow-sm' : 'bg-white/70'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow ${
                                index === 0 ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 
                                index === 1 ? 'bg-blue-500' : 
                                index === 2 ? 'bg-purple-500' : 'bg-gray-400'
                              }`}>
                                {salon.posicion}
                              </div>
                              <IconComponent className="w-5 h-5" />
                              <div>
                                <p className="font-semibold capitalize text-sm">{salon.salon}</p>
                                <p className="text-xs text-muted-foreground">{salon.totalPuntos} puntos acumulados</p>
                              </div>
                            </div>
                            {index === 0 && (
                              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                🥇 Lider
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Sin datos grupales esta semana</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Campeón Invitados Semanal */}
              <Card className="border-border bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-purple-600" />
                    Campeón de Invitados
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Premio Especial</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Cargando datos...</div>
                  ) : resumenSemanal.campeonInvitados ? (
                    <div className="bg-white rounded-xl p-6 border-2 border-purple-300 shadow-lg">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-3xl shadow-xl mx-auto mb-4 animate-pulse">
                          👑
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-purple-900">
                          {resumenSemanal.campeonInvitados.alumno.nombre} {resumenSemanal.campeonInvitados.alumno.apellidos}
                        </h3>
                        <p className="text-2xl text-purple-600 font-bold mb-3">
                          🎉 {resumenSemanal.campeonInvitados.totalInvitados} invitados esta semana
                        </p>
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                          <p className="text-sm font-semibold text-purple-700">🏆 PREMIO ESPECIAL</p>
                          <p className="text-xs text-muted-foreground mt-1">Por traer más amigos al evento</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Nadie ha traído invitados esta semana</p>
                      <p className="text-xs text-muted-foreground mt-2">¡Animate a invitar amigos!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>





          {/* 3. ACCIONES RÁPIDAS Y EXPORTACIÓN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Quick Actions */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>⚡ Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Botón de administración de alumnos */}
                  <Link href="/staff/admin/alumnos">
                    <Card className="cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg border border-blue-200 bg-blue-50">
                      <CardContent className="p-3 text-center">
                        <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-xs font-medium text-blue-900">Admin Alumnos</p>
                      </CardContent>
                    </Card>
                  </Link>
                  
                  {classrooms.map((classroom) => {
                    const IconComponent = classroom.icon
                    return (
                      <Link key={classroom.name} href={`/staff/admin/${classroom.name}`}>
                        <Card className={`cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${classroom.color} border`}>
                          <CardContent className="p-3 text-center">
                            <IconComponent className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-xs font-medium">Puntuar {classroom.title}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Export Actions */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-500" />
                  Exportar Datos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    onClick={exportEvaluacionesToExcel}
                    disabled={isExporting || isLoading}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Exportando...' : 'Evaluaciones de Alumnos (Excel)'}
                  </Button>
                  <Button 
                    onClick={exportSalonesToExcel}
                    disabled={isExporting || isLoading}
                    variant="outline"
                    className="flex items-center gap-2 border-border"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Exportando...' : 'Evaluaciones de Salones (Excel)'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logout */}
          <div className="text-center">
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-border text-muted-foreground hover:bg-muted"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </StaffGuard>
  )
}