import { duracionEnHoras, horaAMinutos } from '@/services/timeUtils';
import { DIAS_SEMANA } from '@/types';
import type { Franja, Docente, DiaSemana, ResultadoValidacion } from '@/types';

export interface ResumenHorasDocente {
  docenteId: string;
  nombre: string;
  horasClases: number;
  horasOcupaciones: number;
  horasTotal: number;
  horasContratadas: number;
  diferencia: number; // positivo = exceso, negativo = faltan
  huecosEntreclases: HuecoEntreClases[];
}

export interface HuecoEntreClases {
  dia: DiaSemana;
  inicio: string;
  fin: string;
  duracionMin: number;
}

/**
 * Calcula resumen de horas para todos los docentes.
 */
export function calcularHorasDocentes(
  franjas: Franja[],
  docentes: Docente[],
): ResumenHorasDocente[] {
  return docentes.map((docente) => {
    const franjasDocente = franjas.filter((f) => f.docenteId === docente.id);

    const horasClases = franjasDocente
      .filter((f) => f.tipo === 'clase')
      .reduce((acc, f) => acc + duracionEnHoras(f.horaInicio, f.horaFin), 0);

    const horasOcupaciones = franjasDocente
      .filter((f) => f.tipo === 'ocupacion')
      .reduce((acc, f) => acc + duracionEnHoras(f.horaInicio, f.horaFin), 0);

    const horasTotal = horasClases + horasOcupaciones;
    const diferencia = horasTotal - docente.horasContratadas;

    const huecosEntreclases = detectarHuecosDocente(franjasDocente);

    return {
      docenteId: docente.id,
      nombre: docente.nombre,
      horasClases,
      horasOcupaciones,
      horasTotal,
      horasContratadas: docente.horasContratadas,
      diferencia,
      huecosEntreclases,
    };
  });
}

/**
 * Detecta huecos libres entre franjas de un docente en cada dia.
 */
function detectarHuecosDocente(franjas: Franja[]): HuecoEntreClases[] {
  const huecos: HuecoEntreClases[] = [];

  for (const dia of DIAS_SEMANA) {
    const franjasDia = franjas
      .filter((f) => f.dia === dia)
      .sort((a, b) => horaAMinutos(a.horaInicio) - horaAMinutos(b.horaInicio));

    for (let i = 0; i < franjasDia.length - 1; i++) {
      const finActual = horaAMinutos(franjasDia[i].horaFin);
      const inicioSiguiente = horaAMinutos(franjasDia[i + 1].horaInicio);

      if (inicioSiguiente > finActual) {
        huecos.push({
          dia: dia as DiaSemana,
          inicio: franjasDia[i].horaFin,
          fin: franjasDia[i + 1].horaInicio,
          duracionMin: inicioSiguiente - finActual,
        });
      }
    }
  }

  return huecos;
}

/**
 * Genera avisos de validacion sobre horas de docentes.
 */
export function generarAvisosHoras(resumenes: ResumenHorasDocente[]): ResultadoValidacion[] {
  const avisos: ResultadoValidacion[] = [];
  let id = 0;

  for (const r of resumenes) {
    if (r.diferencia > 0.1) {
      avisos.push({
        id: `horas-exceso-${++id}`,
        severidad: 'aviso',
        mensaje: `${r.nombre}: ${r.diferencia.toFixed(1)}h de exceso (${r.horasTotal.toFixed(1)}h / ${r.horasContratadas}h contratadas)`,
        entidadTipo: 'docente',
        entidadId: r.docenteId,
      });
    } else if (r.diferencia < -0.1) {
      avisos.push({
        id: `horas-faltan-${++id}`,
        severidad: 'aviso',
        mensaje: `${r.nombre}: faltan ${Math.abs(r.diferencia).toFixed(1)}h (${r.horasTotal.toFixed(1)}h / ${r.horasContratadas}h contratadas)`,
        entidadTipo: 'docente',
        entidadId: r.docenteId,
      });
    }

    for (const hueco of r.huecosEntreclases) {
      avisos.push({
        id: `hueco-${++id}`,
        severidad: 'aviso',
        mensaje: `${r.nombre}: hueco de ${hueco.duracionMin}min el ${hueco.dia} entre ${hueco.inicio} y ${hueco.fin}`,
        entidadTipo: 'docente',
        entidadId: r.docenteId,
      });
    }
  }

  return avisos;
}
