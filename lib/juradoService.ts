import { supabase } from './supabase';

export interface Jurado {
  id: string;
  dni: string;
  nombre: string;
  email?: string;
  telefono?: string;
  rol: 'maestro' | 'jurado' | 'admin';
  activo: boolean;
  creado_en: string;
}

export interface Salon {
  id: string;
  nombre: string;
  descripcion?: string;
  edad_min: number;
  edad_max: number;
  color: string;
  activo: boolean;
}

export interface PuntuacionGrupal {
  id: string;
  classroom_id: string;
  fecha: string;
  puntualidad: number;
  animo_y_barras: number;
  orden: number;
  verso_memoria: number;
  preguntas_correctas: number;
  preguntas: number;
  jurado_registro_id?: string;
  creado_en: string;
  actualizado_en: string;
}

// ====== AUTENTICACIÓN JURADO ======

export async function autenticarJurado(codigo: string, password: string): Promise<Jurado | null> {
  try {
    // Validar contraseñas directamente sin buscar en DB (modo frontend-only)
    const contraseñasValidas = {
      '19837455': { 
        password: 'emilio123', 
        nombre: 'Emilio Catay',
        dni: '19837455',
        rol: 'jurado' as const,
        activo: true,
        id: 'temp-id-1',
        creado_en: new Date().toISOString()
      },
      '43160277': { 
        password: 'eliseo123', 
        nombre: 'Eliseo Maldonado',
        dni: '43160277', 
        rol: 'jurado' as const,
        activo: true,
        id: 'temp-id-2',
        creado_en: new Date().toISOString()
      },
      '45476174': { 
        password: 'pierre123', 
        nombre: 'Pierre Vivanco',
        dni: '45476174',
        rol: 'jurado' as const,
        activo: true, 
        id: 'temp-id-3',
        creado_en: new Date().toISOString()
      }
    };

    const juradoData = contraseñasValidas[codigo as keyof typeof contraseñasValidas];
    
    if (juradoData && juradoData.password === password) {
      return juradoData as Jurado;
    }

    return null;
  } catch (error) {
    console.error('Error en autenticación:', error);
    return null;
  }
}

// ====== SALONES ======

export async function obtenerSalonesConEstado(fecha?: string): Promise<Array<Salon & { estado: "pendiente" | "en_evaluacion" | "completado", total_jurados: number }>> {
  try {
    // Primero obtener todos los salones base
    const salones = await obtenerSalones();
    const today = fecha || new Date().toISOString().split('T')[0];
    
    // Obtener evaluaciones del día para cada salón
    const { data: evaluaciones } = await supabase
      .from('puntuacion_grupal_diaria')
      .select('classroom_id, created_at')
      .eq('fecha', today);
    
    return salones.map(salon => {
      const evaluacionHoy = evaluaciones?.find(e => e.classroom_id === salon.id);
      
      let estado: "pendiente" | "en_evaluacion" | "completado" = "pendiente";
      
      if (evaluacionHoy) {
        // Si tiene evaluación hoy, está completado (suponemos que la evaluación es rápida)
        estado = "completado";
      } else {
        // Podrías agregar lógica aquí para determinar si está en evaluación
        // Por ahora, si no tiene evaluación y es el día actual, está pendiente
        estado = "pendiente";
      }
      
      return {
        ...salon,
        estado,
        total_jurados: 3 // Número fijo de jurados por evaluación
      };
    });
  } catch (error) {
    console.error('Error al obtener salones con estado:', error);
    return [];
  }
}

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

    return data || [];
  } catch (error) {
    console.error('Error al obtener salones:', error);
    return [];
  }
}

export async function obtenerSalonPorId(id: string): Promise<Salon | null> {
  try {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener salón:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error al obtener salón:', error);
    return null;
  }
}

// ====== EVALUACIONES GRUPALES ======

export async function crearPuntuacionGrupal(puntuacion: Omit<PuntuacionGrupal, 'id' | 'creado_en' | 'actualizado_en'>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('puntuacion_grupal_diaria')
      .insert(puntuacion);

    if (error) {
      console.error('Error al crear puntuación grupal:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error al crear puntuación grupal:', error);
    return false;
  }
}

export async function actualizarPuntuacionGrupal(
  id: string,
  puntuacion: Partial<PuntuacionGrupal>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('puntuacion_grupal_diaria')
      .update({
        ...puntuacion,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar puntuación grupal:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error al actualizar puntuación grupal:', error);
    return false;
  }
}

export async function obtenerPuntuacionGrupalPorFecha(
  fecha: string,
  classroom_id?: string
): Promise<PuntuacionGrupal[]> {
  try {
    let query = supabase
      .from('puntuacion_grupal_diaria')
      .select('*')
      .eq('fecha', fecha)
      .order('creado_en', { ascending: false });

    if (classroom_id) {
      query = query.eq('classroom_id', classroom_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener puntuaciones grupales:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error al obtener puntuaciones grupales:', error);
    return [];
  }
}

export async function obtenerPuntuacionGrupalPorId(id: string): Promise<PuntuacionGrupal | null> {
  try {
    const { data, error } = await supabase
      .from('puntuacion_grupal_diaria')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener puntuación grupal:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error al obtener puntuación grupal:', error);
    return null;
  }
}

// ====== ESTADÍSTICAS ======

export async function obtenerRankingDeSalones(fecha?: string): Promise<Array<{
  salon: string;
  total_puntos: number;
  evaluaciones: number;
}> | null> {
  try {
    let query = supabase
      .from('puntuacion_grupal_diaria')
      .select(`
        classrooms!inner(nombre),
        puntualidad,
        animo_y_barras,
        orden,
        verso_memoria,
        preguntas_correctas,
        preguntas,
        fecha
      `);

    if (fecha) {
      query = query.eq('fecha', fecha);
    }

    const { data, error } = await query.order('fecha', { ascending: false });

    if (error) {
      console.error('Error al obtener ranking:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Agrupar por salón y calcular totales
    const ranking = data.reduce((acc: any, item: any) => {
      const salon = item.classrooms.nombre;
      const total = item.puntualidad + item.animo_y_barras + item.orden + 
                   item.verso_memoria + item.preguntas;

      if (!acc[salon]) {
        acc[salon] = { total_puntos: 0, evaluaciones: 0 };
      }

      acc[salon].total_puntos += total;
      acc[salon].evaluaciones += 1;

      return acc;
    }, {});

    return Object.entries(ranking).map(([salon, stats]: [string, any]) => ({
      salon,
      total_puntos: stats.total_puntos,
      evaluaciones: stats.evaluaciones
    })).sort((a, b) => b.total_puntos - a.total_puntos);

  } catch (error) {
    console.error('Error al obtener ranking:', error);
    return null;
  }
}

// Mapa de IDs de classrooms a nombres (para consistencia)
export const CLASSROOM_IDS: Record<string, string> = {
  'vida': 'eda65bd9-dadd-4f74-954e-b952a91845a3',
  'luz': 'd863c43d-9b83-494a-a88b-c3973a31bfd7', 
  'gracia': '9b8a58b3-6356-4b75-b28b-d5f5d8e596fd',
  'verdad': '5272477b-26a4-4179-a276-1c4730238974'
};

// Mapa inverso de nombres a IDs
export const CLASSROOM_NAMES: Record<string, string> = {
  'eda65bd9-dadd-4f74-954e-b952a91845a3': 'vida',
  'd863c43d-9b83-494a-a88b-c3973a31bfd7': 'luz',
  '9b8a58b3-6356-4b75-b28b-d5f5d8e596fd': 'gracia', 
  '5272477b-26a4-4179-a276-1c4730238974': 'verdad'
};

export async function getClassroomIdByName(nombre: string): Promise<string | null> {
  const id = CLASSROOM_IDS[nombre.toLowerCase()]
  return id || null
}

export async function getClassNameById(id: string): Promise<string | null> {
  const name = CLASSROOM_NAMES[id]
  return name || null
}