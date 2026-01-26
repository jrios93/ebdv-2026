import { supabase } from './supabase';

// Tipos para la base de datos
export interface Jurado {
  id: string;
  nombre: string;
  dni: string;
  rol: string;
  activo: boolean;
  creado_en?: string;
}

export interface Salon {
  id: string;
  nombre: string;
  edad_min: number;
  edad_max: number;
  color: string;
  activo: boolean;
  creado_en?: string;
}

export interface Alumno {
  id: string;
  nombre: string;
  apellidos: string;
  edad: number;
  genero: 'niño' | 'niña';
  nombre_padre: string;
  telefono: string;
  telefono_niño?: string;
  classroom_id: string;
  classroom_forzado_id?: string;
  activo: boolean;
  fecha_inscripcion: string;
}

export interface Evaluacion {
  id: string;
  classroom_id: string;
  fecha: string;
  jurado_id: string;
  puntualidad: number;
  animo_y_barras: number;
  orden: number;
  verso_memoria: number;
  preguntas_correctas: number;
  preguntas: number;
  creado_en: string;
  actualizado_en: string;
}

export interface SalonConEstado extends Salon {
  estado: 'pendiente' | 'en_evaluacion' | 'completado';
  total_jurados: number;
  jurados_evaluaron: number;
  promedio_puntaje?: number;
  ultima_actualizacion?: string;
}

// ====== AUTENTICACIÓN DE JURADOS ======

export async function autenticarJurado(codigo: string, password: string): Promise<Jurado | null> {
  try {
    // Por ahora, usaremos DNI como código y una contraseña simple
    // TODO: Implementar un sistema de autenticación más robusto
    
    // Buscar jurado por DNI (usando código como DNI)
    const { data, error } = await supabase
      .from('maestros')
      .select('*')
      .eq('dni', codigo)
      .eq('rol', 'jurado')
      .eq('activo', true)
      .single();

    if (error || !data) {
      console.error('Error al buscar jurado:', error);
      return null;
    }

    // Validación simple de contraseña (temporal)
    const contraseñasValidas = {
      '12345678': 'emilio123',   // Emilio Catay
      '87654321': 'eliseo123',  // Eliseo Maldonado  
      '11223344': 'pierre123'    // Pierre Vivanco
    };

    if (contraseñasValidas[data.dni as keyof typeof contraseñasValidas] === password) {
      return data as Jurado;
    }

    return null;
  } catch (error) {
    console.error('Error en autenticación:', error);
    return null;
  }
}

// ====== SALONES ======

export async function obtenerSalones(): Promise<Salon[]> {
  try {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('activo', true)
      .order('edad_min');

    if (error) {
      console.error('Error al obtener salones:', error);
      return [];
    }

    return data as Salon[];
  } catch (error) {
    console.error('Error al obtener salones:', error);
    return [];
  }
}

export async function obtenerSalonesConEstado(juradoId?: string): Promise<SalonConEstado[]> {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    // Obtener salones básicos
    const salones = await obtenerSalones();

    // Para cada salón, obtener su estado de evaluación
    const salonesConEstado = await Promise.all(
      salones.map(async (salon) => {
        // Obtener evaluaciones de hoy para este salón
        const { data: evaluaciones, error } = await supabase
          .from('puntuacion_grupal_diaria')
          .select('*')
          .eq('classroom_id', salon.id)
          .eq('fecha', hoy);

        if (error) {
          console.error(`Error al obtener evaluaciones del salón ${salon.nombre}:`, error);
          return {
            ...salon,
            estado: 'pendiente' as const,
            total_jurados: 0,
            jurados_evaluaron: 0
          };
        }

        const totalEvaluaciones = evaluaciones?.length || 0;
        const estado: 'pendiente' | 'en_evaluacion' | 'completado' = 
          totalEvaluaciones >= 3 ? 'completado' : 
          totalEvaluaciones > 0 ? 'en_evaluacion' : 'pendiente';

        // Calcular promedio si hay evaluaciones
        const promedioPuntaje = evaluaciones && evaluaciones.length > 0 
          ? evaluaciones.reduce((sum, evaluation) => sum + 
              (evaluation.puntualidad || 0) + 
              (evaluation.animo_y_barras || 0) + 
              (evaluation.orden || 0) + 
              (evaluation.verso_memoria || 0) + 
              (evaluation.preguntas_correctas || 0), 0) / evaluaciones.length
          : 0;

        return {
          ...salon,
          estado,
          total_jurados: 3, // Total de jurados esperados
          jurados_evaluaron: totalEvaluaciones,
          promedio_puntaje: promedioPuntaje,
          ultima_actualizacion: evaluaciones && evaluaciones.length > 0 
            ? Math.max(...evaluaciones.map(e => new Date(e.actualizado_en).getTime())).toString()
            : undefined
        };
      })
    );

    return salonesConEstado;
  } catch (error) {
    console.error('Error al obtener salones con estado:', error);
    return [];
  }
}

// ====== ALUMNOS ======

export async function obtenerAlumnosPorSalon(salonId: string): Promise<Alumno[]> {
  try {
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('classroom_id', salonId)
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('Error al obtener alumnos:', error);
      return [];
    }

    return data as Alumno[];
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    return [];
  }
}

// ====== EVALUACIONES ======

export async function obtenerEvaluacionDelDia(juradoId: string, salonId: string): Promise<Evaluacion | null> {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('puntuacion_grupal_diaria')
      .select('*')
      .eq('jurado_id', juradoId)
      .eq('classroom_id', salonId)
      .eq('fecha', hoy)
      .maybeSingle(); // Cambiar a maybeSingle para manejar casos vacíos

    // Ignorar errores de "no encontrado" - es normal cuando no hay evaluación previa
    if (error && error.code !== 'PGRST116') {
      console.error('Error al obtener evaluación:', error);
      return null;
    }

    return data as Evaluacion;
  } catch (error) {
    console.error('Error al obtener evaluación:', error);
    return null;
  }
}

export async function guardarEvaluacion(evaluacion: Partial<Evaluacion>): Promise<boolean> {
  try {
    // Remover el campo 'preguntas' porque es auto-generado en SQL
    const { preguntas, ...evaluacionSinPreguntas } = evaluacion as any;
    
    const { error } = await supabase
      .from('puntuacion_grupal_diaria')
      .upsert({
        ...evaluacionSinPreguntas,
        actualizado_en: new Date().toISOString()
      }, {
        onConflict: 'classroom_id,fecha,jurado_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error al guardar evaluación:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error al guardar evaluación:', error);
    return false;
  }
}

export async function obtenerEvaluacionesPorSalon(salonId: string, fecha?: string): Promise<Evaluacion[]> {
  try {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('puntuacion_grupal_diaria')
      .select(`
        *,
        maestros!inner (nombre, rol)
      `)
      .eq('classroom_id', salonId)
      .eq('fecha', fechaConsulta);

    if (error) {
      console.error('Error al obtener evaluaciones:', error);
      return [];
    }

    return data as Evaluacion[];
  } catch (error) {
    console.error('Error al obtener evaluaciones:', error);
    return [];
  }
}

// ====== UTILIDADES ======

export function obtenerInformacionSalon(salonId: string): {
  nombre: string;
  color: string;
  edadRango: string;
  descripcion: string;
} | null {
  const info = {
    '5272477b-26a4-4179-a276-1c4730238974': {
      nombre: 'Verdad',
      color: 'blue',
      edadRango: '13-15 años',
      descripcion: 'Adolescentes'
    },
    '9b8a58b3-6356-4b75-b28b-d5f5d8e596fd': {
      nombre: 'Gracia', 
      color: 'red',
      edadRango: '10-12 años',
      descripcion: 'Primarios'
    },
    'd863c43d-9b83-494a-a88b-c3973a31bfd7': {
      nombre: 'Luz',
      color: 'yellow', 
      edadRango: '6-9 años',
      descripcion: 'Principiantes'
    },
    'eda65bd9-dadd-4f74-954e-b952a91845a3': {
      nombre: 'Vida',
      color: 'green',
      edadRango: '3-5 años', 
      descripcion: 'Párvulos'
    }
  };

  return info[salonId as keyof typeof info] || null;
}

export function getSalonIdPorNombre(nombre: string): string | null {
  const nombreToId = {
    'verdad': '5272477b-26a4-4179-a276-1c4730238974',
    'gracia': '9b8a58b3-6356-4b75-b28b-d5f5d8e596fd', 
    'luz': 'd863c43d-9b83-494a-a88b-c3973a31bfd7',
    'vida': 'eda65bd9-dadd-4f74-954e-b952a91845a3'
  };

  return nombreToId[nombre.toLowerCase() as keyof typeof nombreToId] || null;
}