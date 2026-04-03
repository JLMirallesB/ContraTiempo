import { duracionEnHoras } from '@/services/timeUtils';
import type { Franja, FranjaClase, Asignatura } from '@/types';

export interface ResumenCapacidadAsignatura {
  asignaturaId: string;
  nombre: string;
  alias: string;
  ratio: number;
  turnosSemanales: number;
  totalFranjas: number;
  totalHoras: number;
  capacidadAlumnado: number; // totalFranjas * ratio
}

/**
 * Calcula la capacidad de alumnado para cada asignatura.
 */
export function calcularCapacidadAsignaturas(
  franjas: Franja[],
  asignaturas: Asignatura[],
): ResumenCapacidadAsignatura[] {
  return asignaturas.map((asig) => {
    const franjasAsig = franjas.filter(
      (f) => f.tipo === 'clase' && f.asignaturaId === asig.id,
    ) as FranjaClase[];

    const totalHoras = franjasAsig.reduce(
      (acc, f) => acc + duracionEnHoras(f.horaInicio, f.horaFin),
      0,
    );

    return {
      asignaturaId: asig.id,
      nombre: asig.nombre,
      alias: asig.alias,
      ratio: asig.ratio,
      turnosSemanales: asig.turnosSemanales,
      totalFranjas: franjasAsig.length,
      totalHoras,
      capacidadAlumnado: franjasAsig.length * asig.ratio,
    };
  });
}
