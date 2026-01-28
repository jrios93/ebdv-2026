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
  preguntas: number; // Campo generado por la BD
  jurado_id?: string;
  creado_en: string;
  actualizado_en: string;
}

// ====== AUTENTICACIÓN JURADO ======

export async function autenticarJurado(dni: string, password: string): Promise<Jurado | null> {
  try {
    // Validar contraseñas directamente sin buscar en DB (modo frontend-only)
    const contraseñasValidas = {
      '12345678': 'emilio123',
      '87654321': 'eliseo123', 
      '11223344': 'pierre123'
    };

    // Primero validar contraseña
    if (contraseñasValidas[dni as keyof typeof contraseñasValidas] !== password) {
      return null;
    }

    // Buscar el jurado en la base de datos para obtener su ID real
    const { data, error } = await supabase
      .from('maestros')
      .select('id, dni, nombre, email, rol, activo, creado_en')
      .eq('dni', dni)
      .eq('rol', 'jurado')
      .eq('activo', true)
      .single();

    if (error || !data) {
      console.error('Jurado no encontrado en DB:', error);
      return null;
    }

    return data as Jurado;
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
    
    // Obtener fecha actual de Perú o usar la proporcionada
      const today = fecha || (() => {
        const ahoraPeru = new Date();
        // Obtener componentes por separado y limpiarlos
        const year = ahoraPeru.toLocaleDateString('en-CA', { 
          timeZone: 'America/Lima',
          year: 'numeric'
        }).trim();
        const month = ahoraPeru.toLocaleDateString('en-CA', { 
          timeZone: 'America/Lima',
          month: '2-digit'
        }).trim();
        const day = ahoraPeru.toLocaleDateString('en-CA', { 
          timeZone: 'America/Lima',
          day: '2-digit'
        }).trim();
        
        const fechaFormateada = `${year}-${month}-${day}`;
        console.log('🔧 Componentes de fecha:', { year, month, day, resultado: fechaFormateada });
        
        return fechaFormateada;
      })();
    
    console.log('📅 Fecha para consulta de salones:', { 
      today,
      tipo: typeof today,
      longitud: today?.length,
      horaPeru: new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })
    });
    
    // Validar que la fecha no tenga espacios
    if (typeof today === 'string' && today.includes(' ')) {
      console.error('❌ ERROR: La fecha contiene espacios:', JSON.stringify(today));
      throw new Error('La fecha contiene caracteres inválidos');
    }
    
    console.log('🌐 Consultando con fecha:', today);
    
    // Obtener evaluaciones del día para cada salón
    const { data: evaluaciones, error } = await supabase
      .from('puntuacion_grupal_diaria')
      .select('classroom_id, creado_en')  // Corregido: usar el nombre real de la columna
      .eq('fecha', today);
    
    if (error) {
      console.error('❌ Error en consulta de evaluaciones:', error);
      throw error;
    }
    
    console.log('✅ Evaluaciones cargadas:', evaluaciones?.length || 0, 'registros');
    
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

// ====== EVALUACIONES INDIVIDUALES ======

export async function obtenerEvaluacionDelDia(
  salonId: string,
  fecha: string,
  juradoId: string
): Promise<PuntuacionGrupal | null> {
  try {
    // Validar que el juradoId no sea un ID temporal
    if (juradoId.startsWith('temp-')) {
      console.error('❌ ID temporal detectado, esto no debería pasar:', juradoId);
      throw new Error(`ID temporal no válido: ${juradoId}. Por favor, inicia sesión nuevamente.`);
    }

    // Importante: Usar la fecha local (Perú) directamente para la consulta
    // La BD debe almacenar la fecha según el timezone local
    console.log('🔍 Buscando evaluación:', { 
      salonId, 
      fecha, // Fecha local YYYY-MM-DD
      juradoId,
      horaPeru: new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })
    });

    const { data, error } = await supabase
      .from('puntuacion_grupal_diaria')
      .select('*')
      .eq('classroom_id', salonId)
      .eq('fecha', fecha) // Usar fecha local directamente
      .eq('jurado_id', juradoId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.log('⚠️ Error en consulta pero esperado si no existe evaluación:', error.message);
      // No lanzar error si es solo que no existe la evaluación
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    console.log('✅ Evaluación encontrada:', data);
    return data as PuntuacionGrupal;
  } catch (error) {
    console.error('Error al obtener evaluación del día:', error);
    return null;
  }
}

export async function guardarEvaluacion(
  salonId: string,
  evaluacion: Omit<PuntuacionGrupal, 'id' | 'creado_en' | 'actualizado_en' | 'classroom_id' | 'preguntas'> & { jurado_id: string }
): Promise<boolean> {
  try {
    // Eliminar explícitamente el campo 'preguntas' si existe
    const { preguntas, ...evaluacionLimpia } = evaluacion as any;
    
    console.log('💾 Guardando evaluación:', { 
      salonId, 
      evaluacionLimpia,
      campos: Object.keys(evaluacionLimpia),
      seEliminoPreguntas: !!preguntas
    });
    
    const { error } = await supabase
      .from('puntuacion_grupal_diaria')
      .upsert({
        ...evaluacionLimpia,
        classroom_id: salonId,
        actualizado_en: new Date().toISOString()
      }, {
        onConflict: 'classroom_id,fecha,jurado_id'
      });

    if (error) {
      console.error('Error al guardar evaluación:', error);
      return false;
    }

    console.log('✅ Evaluación guardada exitosamente en la BD');
    return true;
  } catch (error) {
    console.error('Error al guardar evaluación:', error);
    return false;
  }
}

export async function obtenerEvaluacionesPorSalon(
  salonId: string,
  fecha?: string
): Promise<PuntuacionGrupal[]> {
  try {
    let query = supabase
      .from('puntuacion_grupal_diaria')
      .select('*')
      .eq('classroom_id', salonId)
      .order('fecha', { ascending: false });

    if (fecha) {
      query = query.eq('fecha', fecha);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener evaluaciones por salón:', error);
      return [];
    }

    console.log('📊 Evaluaciones encontradas para salón:', { salonId, cantidad: data?.length || 0, data });

    return data || [];
  } catch (error) {
    console.error('Error al obtener evaluaciones por salón:', error);
    return [];
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

export async function getClassroomIdByNameOrThrow(nombre: string): Promise<string> {
  const id = CLASSROOM_IDS[nombre.toLowerCase()]
  if (!id) {
    throw new Error(`Salón "${nombre}" no encontrado`)
  }
  return id
}

export async function getClassNameById(id: string): Promise<string | null> {
  const name = CLASSROOM_NAMES[id]
  return name || null
}