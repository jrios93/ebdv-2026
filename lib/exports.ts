import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { supabase } from '@/lib/supabase'
import { getClassroomInfo } from '@/lib/classroom'

interface EvaluacionIndividualRow {
  id: string
  alumno_id: string
  fecha: string
  actitud: number
  puntualidad_asistencia: number
  animo: number
  trabajo_manual: number
  verso_memoria: number
  aprestamiento_biblico: number
  invitados_hoy: number
  alumnos: {
    id: string
    nombre: string
    apellidos: string
    edad: number
    genero: string
    classrooms: {
      nombre: string
    }
  }
}

  interface EvaluacionGrupalRow {
  id: string
  classroom_id: string
  fecha: string
  puntualidad: number
  animo_y_barras: number
  orden: number
  verso_memoria: number
  preguntas_correctas: number
  classrooms: {
    nombre: string
  }
}

interface AlumnoExport {
  id: string
  nombre: string
  apellidos: string
  edad: number
  genero: string
  sala: string
  evaluaciones: Array<{
    data: string
    hora: string
    data_hora_formatada: string
    total_pontos: number
    actitud: number
    puntualidad_asistencia: number
    animo: number
    trabajo_manual: number
    verso_memoria: number
    aprestamiento_biblico: number
    invitados_hoy: number
  }>
  total_semanal: number
  promedio_diario: number
  dias_evaluados: number
  data_primera_evaluacion: string
  hora_primera_evaluacion: string
}

interface SalaExport {
  nome: string
  avaliacoes: Array<{
    data: string
    hora: string
    data_hora_formatada: string
    total_pontos: number
    pontualidade_presenca: number
    animo_e_barras: number
    ordem: number
    verso_memoria: number
    perguntas_corretas: number
    total_perguntas: number
  }>
  total_semanal: number
  promedio_diario: number
  dias_avaliados: number
  melhor_dia: string
  pior_dia: string
}

export async function exportarSemanaCompleta(tipo: 'alumnos' | 'salones') {
  try {
    // Calcular rango desde hoy hasta fin de mes
    const today = new Date()
    const fechaInicio = today.toISOString().split('T')[0]
    
    // Calcular fin de mes (último día del mes actual)
    const finDeMes = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const fechaFin = finDeMes.toISOString().split('T')[0]
    
    console.log('📊 Exportando semana:', { tipo, fechaInicio, fechaFin })

    if (tipo === 'alumnos') {
      await exportarAlumnosSemana(fechaInicio, fechaFin)
    } else {
      await exportarSalonesSemana(fechaInicio, fechaFin)
    }
  } catch (error) {
    console.error('❌ Error en exportación semanal:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Detalles del error:', JSON.stringify(error, null, 2))
    alert(`❌ Error al exportar datos semanales: ${errorMessage}`)
  }
}

async function exportarAlumnosSemana(fechaInicio: string, fechaFin: string) {
  console.log('🔍 Iniciando exportación de alumnos semana:', { fechaInicio, fechaFin })
  
  try {
    // Obtener todas las evaluaciones individuales de la semana
    const { data: evaluaciones, error } = await supabase
      .from('puntuacion_individual_diaria')
      .select(`
        *,
        alumnos!inner(
          id,
          nombre,
          apellidos,
          edad,
          genero,
          classrooms!classroom_id(nombre)
        )
      `)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha, alumno_id')

    console.log('📊 Resultado consulta individual:', { 
      count: evaluaciones?.length || 0, 
      error: error?.message,
      hasData: !!evaluaciones 
    })

    if (error) {
      console.error('❌ Erro na consulta individual:', error)
      throw new Error(`Erro ao buscar avaliações individuais: ${error.message}`)
    }

    console.log(`📊 Encontradas ${evaluaciones?.length || 0} evaluaciones individuales`)

    // Procesar datos para exportación
    const alumnosMap = new Map<string, AlumnoExport>()

evaluaciones?.forEach((evaluacion: EvaluacionIndividualRow) => {
    const alumnoId = evaluacion.alumno_id
    const classroomInfo = getClassroomInfo(evaluacion.alumnos.classrooms.nombre)
    
    if (!alumnosMap.has(alumnoId)) {
      alumnosMap.set(alumnoId, {
        id: alumnoId,
        nombre: evaluacion.alumnos.nombre,
        apellidos: evaluacion.alumnos.apellidos,
        edad: evaluacion.alumnos.edad,
        genero: evaluacion.alumnos.genero,
        sala: evaluacion.alumnos.classrooms.nombre,
        evaluaciones: [],
        total_semanal: 0,
        promedio_diario: 0,
        dias_evaluados: 0,
        data_primera_evaluacion: evaluacion.fecha,
        hora_primera_evaluacion: ''
      })
    }

    const alumno = alumnosMap.get(alumnoId)!
    const totalDia = evaluacion.actitud + evaluacion.puntualidad_asistencia + evaluacion.animo + 
                     evaluacion.trabajo_manual + evaluacion.verso_memoria + evaluacion.aprestamiento_biblico
    
    // Formatear fecha y hora de la evaluación
    const fechaEvaluacion = new Date(evaluacion.fecha + 'T00:00:00')
    const fechaFormateada = fechaEvaluacion.toLocaleDateString('es-PE')
    const horaFormateada = fechaEvaluacion.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    const fechaHoraFormateada = `${fechaFormateada} ${horaFormateada}`
    
    alumno.evaluaciones.push({
      data: evaluacion.fecha,
      hora: horaFormateada,
      data_hora_formatada: fechaHoraFormateada,
      total_pontos: totalDia,
      actitud: evaluacion.actitud,
      puntualidad_asistencia: evaluacion.puntualidad_asistencia,
      animo: evaluacion.animo,
      trabajo_manual: evaluacion.trabajo_manual,
      verso_memoria: evaluacion.verso_memoria,
      aprestamiento_biblico: evaluacion.aprestamiento_biblico,
      invitados_hoy: evaluacion.invitados_hoy
    })
    
    // Actualizar totales
    alumno.total_semanal += totalDia
    alumno.dias_evaluados++
    if (evaluacion.fecha < alumno.data_primera_evaluacion) {
      alumno.data_primera_evaluacion = evaluacion.fecha
    }


  })

// Calcular medias
    alumnosMap.forEach(alumno => {
      alumno.promedio_diario = alumno.dias_evaluados > 0 
      ? Math.round((alumno.total_semanal / alumno.dias_evaluados) * 10) / 10 
      : 0
    })

  // Preparar dados para Excel
    const wsData = [
      ['DADOS DE ALUNOS - SEMANA COMPLETA'],
      [`Período: ${fechaInicio} a ${fechaFin}`],
      [],
    ['NOME', 'SOBRENOME', 'IDADE', 'GÊNERO', 'SALA', 'DIAS AVALIADOS', 
     'PONTUAJE SEMANAL', 'PROMÉDIO DIÁRIO', 'PRIMEIRA AVALIAÇÃO'],
      ...Array.from(alumnosMap.values()).map(alumno => [
        alumno.nombre,
        alumno.apellidos,
        alumno.edad,
        alumno.genero,
        alumno.sala,
        alumno.dias_evaluados,
        alumno.total_semanal,
        alumno.promedio_diario,
        alumno.data_primera_evaluacion
      ])
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Alunos Semana')

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })  
    const fileName = `alunos_semanal_${fechaInicio}_${fechaFin}.xlsx`
    saveAs(blob, fileName)  
    console.log(`✅ Exportados ${alumnosMap.size} alumnos`)
  } catch (error) {
    console.error('❌ Erro em exportarAlunosSemana:', error)
    throw error
  }
}

async function exportarSalonesSemana(fechaInicio: string, fechaFin: string) {
  try {
    console.log('🔍 Iniciando exportación de salones:', { fechaInicio, fechaFin })
    
    // Obter avaliações grupales da semana
    const { data: avaliacoes, error } = await supabase
      .from('puntuacion_grupal_diaria')
      .select(`
        *,
        classrooms!inner(nombre)
      `)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
      .order('fecha, classroom_id')

    if (error) {
      console.error('❌ Erro na consulta grupal:', error)
      throw new Error(`Erro ao buscar avaliações grupais: ${error.message}`)
    }

    console.log(`📊 Encontradas ${avaliacoes?.length || 0} avaliações grupais`)

  // Processar dados por salão
    const saloesMap = new Map<string, SalaExport>()

    avaliacoes?.forEach((avaliacao: EvaluacionGrupalRow) => {
    const classroomNome = avaliacao.classrooms.nombre
    
    if (!saloesMap.has(classroomNome)) {
      saloesMap.set(classroomNome, {
        nome: classroomNome,
        avaliacoes: [],
        total_semanal: 0,
        promedio_diario: 0,
        dias_avaliados: 0,
        melhor_dia: '',
        pior_dia: ''
      })
    }

    const sala = saloesMap.get(classroomNome)!
    const totalDia = avaliacao.puntualidad + avaliacao.animo_y_barras + avaliacao.orden + avaliacao.verso_memoria + avaliacao.preguntas_correctas
    
    // Formatar data e hora da avaliação
    const dataAvaliacao = new Date(avaliacao.fecha + 'T00:00:00')
    const dataFormatada = dataAvaliacao.toLocaleDateString('es-PE')
    const horaFormatada = dataAvaliacao.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    const dataHoraFormatada = `${dataFormatada} ${horaFormatada}`
    
    sala.avaliacoes.push({
      data: avaliacao.fecha,
      hora: horaFormatada,
      data_hora_formatada: dataHoraFormatada,
      total_pontos: totalDia,
      pontualidade_presenca: avaliacao.puntualidad,
      animo_e_barras: avaliacao.animo_y_barras,
      ordem: avaliacao.orden,
      verso_memoria: avaliacao.verso_memoria,
      perguntas_corretas: avaliacao.preguntas_correctas,
      total_perguntas: avaliacao.preguntas_correctas * 10 // Converter para pontos totais
    })
    
    sala.total_semanal += totalDia
    sala.dias_avaliados++
    
    // Encontrar melhor e pior dia
    if (!sala.melhor_dia || totalDia > (sala.avaliacoes.find(e => e.data === sala.melhor_dia)?.total_pontos ?? 0)) {
      sala.melhor_dia = avaliacao.fecha
    }
    if (!sala.pior_dia || totalDia < (sala.avaliacoes.find(e => e.data === sala.pior_dia)?.total_pontos ?? Infinity)) {
      sala.pior_dia = avaliacao.fecha
    }
  })

  // Calcular médias
  saloesMap.forEach(sala => {
    sala.promedio_diario = sala.dias_avaliados > 0 
    ? Math.round((sala.total_semanal / sala.dias_avaliados) * 10) / 10 
    : 0
  })

  // Preparar dados para Excel
    const wsData = [
      ['DADOS DE SALÕES - SEMANA COMPLETA'],
      [`Período: ${fechaInicio} a ${fechaFin}`],
      [],
    ['SALÃO', 'DIAS AVALIADOS', 'PONTUAJE SEMANAL', 'PROMÉDIO DIÁRIO', 'MELHOR DIA', 'PIOR DIA'],
    ...Array.from(saloesMap.values()).map(sala => [
      sala.nome,
      sala.dias_avaliados,
      sala.total_semanal,
      sala.promedio_diario,
      sala.melhor_dia,
      sala.pior_dia
    ])
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Salões Semana')

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    const fileName = `salones_semanal_${fechaInicio}_${fechaFin}.xlsx`
    saveAs(blob, fileName)  
    console.log(`✅ Exportados ${saloesMap.size} salões`)
  } catch (error) {
    console.error('❌ Erro em exportarSaloesSemana:', error)
    throw error
  }
}