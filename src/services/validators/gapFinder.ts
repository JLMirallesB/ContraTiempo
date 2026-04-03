import { horaAMinutos, minutosAHora, seSolapan } from '@/services/timeUtils';
import { DIAS_SEMANA } from '@/types';
import type { Franja, Aula, DiaSemana, ConfiguracionHorario } from '@/types';

export interface HuecoDisponible {
  dia: DiaSemana;
  inicio: string;
  fin: string;
  duracionMin: number;
  aulaId?: string;
  aulaNombre?: string;
}

/**
 * Busca huecos libres en aulas (sin ninguna franja en ese horario).
 */
export function buscarHuecosAulas(
  franjas: Franja[],
  aulas: Aula[],
  config: ConfiguracionHorario,
  duracionMinima: number = 30,
): HuecoDisponible[] {
  const huecos: HuecoDisponible[] = [];
  const inicioJornada = horaAMinutos(config.horaInicio);
  const finJornada = horaAMinutos(config.horaFin);

  for (const aula of aulas) {
    for (const dia of DIAS_SEMANA) {
      const franjasAulaDia = franjas
        .filter((f) => f.aulaId === aula.id && f.dia === dia)
        .sort((a, b) => horaAMinutos(a.horaInicio) - horaAMinutos(b.horaInicio));

      // Encontrar huecos entre franjas
      let cursor = inicioJornada;
      for (const f of franjasAulaDia) {
        const fInicio = horaAMinutos(f.horaInicio);
        if (fInicio > cursor) {
          const dur = fInicio - cursor;
          if (dur >= duracionMinima) {
            huecos.push({
              dia: dia as DiaSemana,
              inicio: minutosAHora(cursor),
              fin: minutosAHora(fInicio),
              duracionMin: dur,
              aulaId: aula.id,
              aulaNombre: aula.nombre,
            });
          }
        }
        cursor = Math.max(cursor, horaAMinutos(f.horaFin));
      }
      // Hueco despues de la ultima franja
      if (cursor < finJornada) {
        const dur = finJornada - cursor;
        if (dur >= duracionMinima) {
          huecos.push({
            dia: dia as DiaSemana,
            inicio: minutosAHora(cursor),
            fin: minutosAHora(finJornada),
            duracionMin: dur,
            aulaId: aula.id,
            aulaNombre: aula.nombre,
          });
        }
      }
    }
  }

  return huecos;
}

/**
 * Busca huecos combinados donde coinciden docente libre + aula libre.
 */
export function buscarHuecosCombinados(
  franjas: Franja[],
  docenteId: string,
  aulas: Aula[],
  config: ConfiguracionHorario,
  duracionMinima: number = 30,
): HuecoDisponible[] {
  const huecosAulas = buscarHuecosAulas(franjas, aulas, config, duracionMinima);

  // Obtener franjas del docente
  const franjasDocente = franjas.filter((f) => f.docenteId === docenteId);

  // Filtrar huecos de aulas donde el docente tambien esta libre
  return huecosAulas.filter((hueco) => {
    return !franjasDocente.some(
      (f) =>
        f.dia === hueco.dia &&
        seSolapan(f.horaInicio, f.horaFin, hueco.inicio, hueco.fin),
    );
  });
}
