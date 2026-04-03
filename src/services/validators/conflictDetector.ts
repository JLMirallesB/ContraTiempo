import { seSolapan } from '@/services/timeUtils';
import type { Franja, Aula, Docente, ResultadoValidacion } from '@/types';

/**
 * Detecta todos los conflictos en un conjunto de franjas.
 * Retorna errores (bloquean) y avisos (informativos).
 */
export function detectarConflictos(
  franjas: Franja[],
  aulas: Aula[],
  docentes: Docente[],
): ResultadoValidacion[] {
  const resultados: ResultadoValidacion[] = [];
  let idCounter = 0;
  const nextId = () => `conflict-${++idCounter}`;

  // 1. Aula ocupada: dos franjas en la misma aula + dia + hora solapadas
  const franjasConAula = franjas.filter((f) => f.aulaId);
  for (let i = 0; i < franjasConAula.length; i++) {
    for (let j = i + 1; j < franjasConAula.length; j++) {
      const a = franjasConAula[i];
      const b = franjasConAula[j];
      if (
        a.aulaId === b.aulaId &&
        a.dia === b.dia &&
        seSolapan(a.horaInicio, a.horaFin, b.horaInicio, b.horaFin)
      ) {
        const aula = aulas.find((au) => au.id === a.aulaId);
        resultados.push({
          id: nextId(),
          severidad: 'error',
          mensaje: `Conflicto en ${aula?.nombre ?? 'aula'}: ${a.dia} ${a.horaInicio}-${a.horaFin} y ${b.horaInicio}-${b.horaFin}`,
          entidadTipo: 'aula',
          entidadId: a.aulaId!,
          franjaIds: [a.id, b.id],
        });
      }
    }
  }

  // 2. Docente duplicado: un docente en dos sitios al mismo momento
  for (let i = 0; i < franjas.length; i++) {
    for (let j = i + 1; j < franjas.length; j++) {
      const a = franjas[i];
      const b = franjas[j];
      if (
        a.docenteId === b.docenteId &&
        a.dia === b.dia &&
        seSolapan(a.horaInicio, a.horaFin, b.horaInicio, b.horaFin)
      ) {
        const docente = docentes.find((d) => d.id === a.docenteId);
        resultados.push({
          id: nextId(),
          severidad: 'error',
          mensaje: `${docente?.nombre ?? 'Docente'} tiene conflicto: ${a.dia} ${a.horaInicio}-${a.horaFin} y ${b.horaInicio}-${b.horaFin}`,
          entidadTipo: 'docente',
          entidadId: a.docenteId,
          franjaIds: [a.id, b.id],
        });
      }
    }
  }

  return resultados;
}
